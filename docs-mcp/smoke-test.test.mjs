import assert from "node:assert/strict";
import { createServer } from "node:http";
import { afterEach, test } from "node:test";

import { runSmokeTest } from "./smoke-test.mjs";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve) => {
          server.close(resolve);
          server.closeAllConnections();
        }),
    ),
  );
});

async function listen(handler) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

test("completes an MCP initialize and tools/list handshake", async () => {
  let sseResponse;

  const baseUrl = await listen(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/sse") {
      sseResponse = response;
      response.writeHead(200, {
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
      });
      response.write("event: endpoint\ndata: /messages?sessionId=test\n\n");
      return;
    }

    if (request.method === "POST" && url.pathname === "/messages") {
      const payload = await readJson(request);
      response.writeHead(202).end();

      if (payload.method === "initialize") {
        sseResponse.write(
          `event: message\ndata: ${JSON.stringify({
            jsonrpc: "2.0",
            id: payload.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "fixture", version: "1.0.0" },
            },
          })}\n\n`,
        );
      } else if (payload.method === "tools/list") {
        sseResponse.write(
          `event: message\ndata: ${JSON.stringify({
            jsonrpc: "2.0",
            id: payload.id,
            result: { tools: [{ name: "search_docs" }] },
          })}\n\n`,
        );
      }
      return;
    }

    response.writeHead(404).end();
  });

  const result = await runSmokeTest({
    endpoint: `${baseUrl}/sse`,
    timeoutMs: 2_000,
  });

  assert.deepEqual(result.serverInfo, { name: "fixture", version: "1.0.0" });
  assert.deepEqual(result.toolNames, ["search_docs"]);
});

test("reports an upstream SSE failure", async () => {
  const baseUrl = await listen((_request, response) => {
    response.writeHead(502, { "Content-Type": "text/plain" });
    response.end("bad gateway");
  });

  await assert.rejects(
    runSmokeTest({
      endpoint: `${baseUrl}/sse`,
      timeoutMs: 2_000,
    }),
    /MCP SSE endpoint returned HTTP 502: bad gateway/,
  );
});

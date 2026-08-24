import assert from "node:assert/strict";
import { createServer } from "node:http";
import { afterEach, test } from "node:test";

import { runSmokeTest } from "./smoke-test.mjs";

const servers = [];
const search = {
  library: "genlayer-docs",
  query: "equivalence principle",
  limit: 3,
  expectedText: "Equivalence Principle",
  rejectMarkdownMirror: true,
  rejectUndefinedMetadata: true,
};

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

function resultFor(payload, searchText) {
  switch (payload.method) {
    case "initialize":
      return {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "fixture", version: "1.0.0" },
      };
    case "tools/list":
      return { tools: [{ name: "search_docs" }] };
    case "tools/call":
      return {
        content: [{ type: "text", text: searchText }],
        isError: false,
      };
    default:
      throw new Error(`Unexpected fixture method ${payload.method}`);
  }
}

test("validates the legacy SSE handshake and a real search", async () => {
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

      if (payload.id !== undefined) {
        sseResponse.write(
          `event: message\ndata: ${JSON.stringify({
            jsonrpc: "2.0",
            id: payload.id,
            result: resultFor(
              payload,
              "Result 1: https://docs.genlayer.com/equivalence-principle\nEquivalence Principle",
            ),
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
    search,
  });

  assert.deepEqual(result.serverInfo, { name: "fixture", version: "1.0.0" });
  assert.deepEqual(result.toolNames, ["search_docs"]);
  assert.equal(result.searchValidated, true);
});

test("validates stateless Streamable HTTP without sending a session id", async () => {
  const methods = [];
  const sessionHeaders = [];

  const baseUrl = await listen(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method !== "POST" || url.pathname !== "/mcp") {
      response.writeHead(404).end();
      return;
    }

    const payload = await readJson(request);
    methods.push(payload.method);
    sessionHeaders.push(request.headers["mcp-session-id"]);

    if (payload.id === undefined) {
      response.writeHead(202).end();
      return;
    }

    response.writeHead(200, { "Content-Type": "text/event-stream" });
    response.end(
      `event: message\ndata: ${JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        result: resultFor(
          payload,
          "Result 1: https://docs.genlayer.com/equivalence-principle\nEquivalence Principle",
        ),
      })}\n\n`,
    );
  });

  const result = await runSmokeTest({
    endpoint: `${baseUrl}/mcp`,
    timeoutMs: 2_000,
    search,
  });

  assert.deepEqual(methods, [
    "initialize",
    "notifications/initialized",
    "tools/list",
    "tools/call",
  ]);
  assert.deepEqual(sessionHeaders, [undefined, undefined, undefined, undefined]);
  assert.deepEqual(result.toolNames, ["search_docs"]);
  assert.equal(result.searchValidated, true);
});

test("rejects duplicate Markdown mirror search results", async () => {
  const baseUrl = await listen(async (request, response) => {
    const payload = await readJson(request);
    if (payload.id === undefined) {
      response.writeHead(202).end();
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        result: resultFor(
          payload,
          "Result 1: https://docs.genlayer.com/equivalence-principle\nEquivalence Principle\nResult 2: https://docs.genlayer.com/equivalence-principle.md\nEquivalence Principle",
        ),
      }),
    );
  });

  await assert.rejects(
    runSmokeTest({ endpoint: `${baseUrl}/mcp`, timeoutMs: 2_000, search }),
    /duplicate \.md mirror result/,
  );
});

test("rejects undefined search result metadata", async () => {
  const baseUrl = await listen(async (request, response) => {
    const payload = await readJson(request);
    if (payload.id === undefined) {
      response.writeHead(202).end();
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        result: resultFor(
          payload,
          "Result 1: https://docs.genlayer.com/equivalence-principle\nundefined\nEquivalence Principle",
        ),
      }),
    );
  });

  await assert.rejects(
    runSmokeTest({ endpoint: `${baseUrl}/mcp`, timeoutMs: 2_000, search }),
    /undefined result metadata/,
  );
});

test("reports an upstream Streamable HTTP failure", async () => {
  const baseUrl = await listen((_request, response) => {
    response.writeHead(502, { "Content-Type": "text/plain" });
    response.end("bad gateway");
  });

  await assert.rejects(
    runSmokeTest({
      endpoint: `${baseUrl}/mcp`,
      timeoutMs: 2_000,
    }),
    /MCP HTTP endpoint returned HTTP 502: bad gateway/,
  );
});

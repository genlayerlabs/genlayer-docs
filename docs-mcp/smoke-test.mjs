#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_EXPECTED_TOOL = "search_docs";

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function* parseSse(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let separator = buffer.match(/\r?\n\r?\n/);
      while (separator?.index !== undefined) {
        const block = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);

        let event = "message";
        const data = [];

        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) {
            event = line.slice("event:".length).trim();
          } else if (line.startsWith("data:")) {
            data.push(line.slice("data:".length).trimStart());
          }
        }

        if (data.length > 0) {
          yield { event, data: data.join("\n") };
        }

        separator = buffer.match(/\r?\n\r?\n/);
      }

      if (done) {
        return;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function waitForEvent(events, predicate, description) {
  while (true) {
    const { done, value } = await events.next();
    if (done) {
      throw new Error(`SSE stream ended before ${description}`);
    }
    if (predicate(value)) {
      return value;
    }
  }
}

async function waitForJsonRpcResponse(events, id) {
  const event = await waitForEvent(
    events,
    (candidate) => {
      if (candidate.event !== "message") {
        return false;
      }
      try {
        return JSON.parse(candidate.data).id === id;
      } catch {
        return false;
      }
    },
    `JSON-RPC response ${id}`,
  );

  const payload = JSON.parse(event.data);
  if (payload.error) {
    throw new Error(
      `JSON-RPC response ${id} failed: ${JSON.stringify(payload.error)}`,
    );
  }
  return payload;
}

async function responseError(response) {
  const body = (await response.text()).trim();
  return `HTTP ${response.status}${body ? `: ${body.slice(0, 500)}` : ""}`;
}

async function postJson(url, payload, signal) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`MCP message endpoint returned ${await responseError(response)}`);
  }
}

export async function runSmokeTest({
  endpoint,
  expectedTool = DEFAULT_EXPECTED_TOOL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!endpoint) {
    throw new Error("An MCP SSE endpoint is required");
  }

  const sseUrl = new URL(endpoint);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let events;

  try {
    const response = await fetch(sseUrl, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`MCP SSE endpoint returned ${await responseError(response)}`);
    }
    if (!response.body) {
      throw new Error("MCP SSE endpoint returned no response body");
    }

    events = parseSse(response.body);
    const endpointEvent = await waitForEvent(
      events,
      (candidate) => candidate.event === "endpoint",
      "the MCP message endpoint",
    );
    const messagesUrl = new URL(endpointEvent.data, sseUrl);

    const initializeResponse = waitForJsonRpcResponse(events, 1);
    await postJson(
      messagesUrl,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "genlayer-docs-mcp-smoke-test",
            version: "1.0.0",
          },
        },
      },
      controller.signal,
    );
    const initialize = await initializeResponse;

    await postJson(
      messagesUrl,
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      },
      controller.signal,
    );

    const toolsResponse = waitForJsonRpcResponse(events, 2);
    await postJson(
      messagesUrl,
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      },
      controller.signal,
    );
    const tools = (await toolsResponse).result?.tools;

    if (!Array.isArray(tools)) {
      throw new Error("MCP tools/list response did not contain a tools array");
    }
    if (expectedTool && !tools.some((tool) => tool.name === expectedTool)) {
      throw new Error(
        `MCP tool ${JSON.stringify(expectedTool)} was not advertised; received: ${tools
          .map((tool) => tool.name)
          .join(", ")}`,
      );
    }

    return {
      serverInfo: initialize.result?.serverInfo ?? null,
      toolNames: tools.map((tool) => tool.name),
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`MCP smoke test timed out after ${timeoutMs}ms`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    controller.abort();
    if (events) {
      await events.return().catch(() => {});
    }
  }
}

async function main() {
  const endpoint =
    process.argv[2] ??
    process.env.DOCS_MCP_ENDPOINT ??
    "https://docs-mcp.genlayer.com/sse";
  const timeoutMs = parsePositiveInteger(
    process.env.DOCS_MCP_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const expectedTool =
    process.env.DOCS_MCP_EXPECTED_TOOL ?? DEFAULT_EXPECTED_TOOL;

  const result = await runSmokeTest({ endpoint, expectedTool, timeoutMs });
  const server = result.serverInfo
    ? `${result.serverInfo.name ?? "unknown"}@${result.serverInfo.version ?? "unknown"}`
    : "unknown";
  console.log(
    `MCP smoke test passed: ${server}; tools: ${result.toolNames.join(", ")}`,
  );
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(`MCP smoke test failed: ${error.message}`);
    process.exitCode = 1;
  });
}

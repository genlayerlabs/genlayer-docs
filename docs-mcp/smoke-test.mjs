#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_EXPECTED_TOOL = "search_docs";
const DEFAULT_PROTOCOL_VERSION = "2025-11-25";
const DEFAULT_SEARCH = Object.freeze({
  library: "genlayer-docs",
  query: "equivalence principle",
  limit: 3,
  expectedText: "Equivalence Principle",
  rejectMarkdownMirror: true,
  rejectUndefinedMetadata: true,
});

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function inferTransport(endpoint) {
  return new URL(endpoint).pathname.replace(/\/+$/, "").endsWith("/sse")
    ? "sse"
    : "streamable-http";
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

function parseJsonRpcEvent(event, expectedId) {
  if (event.event !== "message") {
    return null;
  }

  try {
    const payload = JSON.parse(event.data);
    return payload.id === expectedId ? payload : null;
  } catch {
    return null;
  }
}

async function waitForJsonRpcResponse(events, id) {
  const event = await waitForEvent(
    events,
    (candidate) => parseJsonRpcEvent(candidate, id) !== null,
    `JSON-RPC response ${id}`,
  );

  return assertJsonRpcSuccess(parseJsonRpcEvent(event, id), id);
}

function assertJsonRpcSuccess(payload, id) {
  if (!payload) {
    throw new Error(`JSON-RPC response ${id} was empty`);
  }
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

async function postSseJson(url, payload, signal) {
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

async function postStreamableJson(url, payload, signal) {
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
    throw new Error(`MCP HTTP endpoint returned ${await responseError(response)}`);
  }
  if (response.headers.has("mcp-session-id")) {
    throw new Error(
      "MCP HTTP endpoint created a session; the production endpoint must remain stateless",
    );
  }
  if (response.status === 202 || payload.id === undefined) {
    await response.body?.cancel().catch(() => {});
    return null;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    return assertJsonRpcSuccess(await response.json(), payload.id);
  }
  if (!contentType.includes("text/event-stream") || !response.body) {
    throw new Error(
      `MCP HTTP endpoint returned unsupported content type ${JSON.stringify(contentType)}`,
    );
  }

  const events = parseSse(response.body);
  try {
    return await waitForJsonRpcResponse(events, payload.id);
  } finally {
    await events.return().catch(() => {});
  }
}

function initializeRequest(id, protocolVersion) {
  return {
    jsonrpc: "2.0",
    id,
    method: "initialize",
    params: {
      protocolVersion,
      capabilities: {},
      clientInfo: {
        name: "genlayer-docs-mcp-smoke-test",
        version: "2.0.0",
      },
    },
  };
}

const initializedNotification = {
  jsonrpc: "2.0",
  method: "notifications/initialized",
  params: {},
};

function toolsListRequest(id) {
  return { jsonrpc: "2.0", id, method: "tools/list", params: {} };
}

function searchRequest(id, search) {
  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: "search_docs",
      arguments: {
        library: search.library,
        query: search.query,
        limit: search.limit,
      },
    },
  };
}

function validateTools(payload, expectedTool) {
  const tools = payload.result?.tools;
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
  return tools.map((tool) => tool.name);
}

function markdownMirrorIdentity(rawUrl) {
  try {
    const url = new URL(rawUrl);
    let pathname = url.pathname;

    if (/\/index(?:\.html)?\.md$/i.test(pathname)) {
      pathname = pathname.replace(/\/index(?:\.html)?\.md$/i, "");
    } else if (/\.html\.md$/i.test(pathname)) {
      pathname = pathname.replace(/\.md$/i, "");
    } else if (/\.md$/i.test(pathname)) {
      pathname = pathname.replace(/\.md$/i, "");
    }

    pathname = pathname.replace(/\/+$/, "") || "/";
    return `${url.origin}${pathname}`;
  } catch {
    return rawUrl
      .replace(/(?:\/index(?:\.html)?)?\.md(?:[?#].*)?$/i, "")
      .replace(/\/+$/, "");
  }
}

function findMarkdownMirrorDuplicate(text) {
  const resultUrls = [...text.matchAll(/^Result \d+:\s+(\S+)\s*$/gim)].map(
    (match) => match[1],
  );
  const seen = new Map();

  for (const resultUrl of resultUrls) {
    const identity = markdownMirrorIdentity(resultUrl);
    const previousUrl = seen.get(identity);
    if (
      previousUrl &&
      previousUrl !== resultUrl &&
      (/\.md(?:[?#]|$)/i.test(previousUrl) ||
        /\.md(?:[?#]|$)/i.test(resultUrl))
    ) {
      return [previousUrl, resultUrl];
    }
    seen.set(identity, resultUrl);
  }

  return null;
}

function validateSearch(payload, search) {
  if (payload.result?.isError) {
    throw new Error("search_docs returned isError=true");
  }

  const text = (payload.result?.content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");

  if (!text) {
    throw new Error("search_docs returned no text content");
  }
  if (
    search.expectedText &&
    !text.toLowerCase().includes(search.expectedText.toLowerCase())
  ) {
    throw new Error(
      `search_docs did not contain expected text ${JSON.stringify(search.expectedText)}`,
    );
  }
  const markdownMirrorDuplicate = search.rejectMarkdownMirror
    ? findMarkdownMirrorDuplicate(text)
    : null;
  if (markdownMirrorDuplicate) {
    throw new Error(
      `search_docs returned duplicate HTML/Markdown mirror results: ${markdownMirrorDuplicate.join(
        " and ",
      )}`,
    );
  }
  if (
    search.rejectUndefinedMetadata &&
    /(?:^|\r?\n)undefined(?:\r?\n|$)/i.test(text)
  ) {
    throw new Error("search_docs returned undefined result metadata");
  }

  return text;
}

async function runSseTest({ endpoint, expectedTool, protocolVersion, search, signal }) {
  const sseUrl = new URL(endpoint);
  const response = await fetch(sseUrl, {
    headers: { Accept: "text/event-stream" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`MCP SSE endpoint returned ${await responseError(response)}`);
  }
  if (!response.body) {
    throw new Error("MCP SSE endpoint returned no response body");
  }

  const events = parseSse(response.body);
  try {
    const endpointEvent = await waitForEvent(
      events,
      (candidate) => candidate.event === "endpoint",
      "the MCP message endpoint",
    );
    const messagesUrl = new URL(endpointEvent.data, sseUrl);

    const initializeResponse = waitForJsonRpcResponse(events, 1);
    await postSseJson(
      messagesUrl,
      initializeRequest(1, protocolVersion),
      signal,
    );
    const initialize = await initializeResponse;

    await postSseJson(messagesUrl, initializedNotification, signal);

    const toolsResponse = waitForJsonRpcResponse(events, 2);
    await postSseJson(messagesUrl, toolsListRequest(2), signal);
    const toolNames = validateTools(await toolsResponse, expectedTool);

    let searchText = null;
    if (search) {
      const searchResponse = waitForJsonRpcResponse(events, 3);
      await postSseJson(messagesUrl, searchRequest(3, search), signal);
      searchText = validateSearch(await searchResponse, search);
    }

    return {
      serverInfo: initialize.result?.serverInfo ?? null,
      toolNames,
      searchValidated: searchText !== null,
    };
  } finally {
    await events.return().catch(() => {});
  }
}

async function runStreamableHttpTest({
  endpoint,
  expectedTool,
  protocolVersion,
  search,
  signal,
}) {
  const url = new URL(endpoint);
  const initialize = await postStreamableJson(
    url,
    initializeRequest(1, protocolVersion),
    signal,
  );

  await postStreamableJson(url, initializedNotification, signal);

  const tools = await postStreamableJson(url, toolsListRequest(2), signal);
  const toolNames = validateTools(tools, expectedTool);

  let searchText = null;
  if (search) {
    searchText = validateSearch(
      await postStreamableJson(url, searchRequest(3, search), signal),
      search,
    );
  }

  return {
    serverInfo: initialize.result?.serverInfo ?? null,
    toolNames,
    searchValidated: searchText !== null,
  };
}

export async function runSmokeTest({
  endpoint,
  transport = endpoint ? inferTransport(endpoint) : undefined,
  expectedTool = DEFAULT_EXPECTED_TOOL,
  protocolVersion = DEFAULT_PROTOCOL_VERSION,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  search = null,
} = {}) {
  if (!endpoint) {
    throw new Error("An MCP endpoint is required");
  }
  if (!new Set(["sse", "streamable-http"]).has(transport)) {
    throw new Error(`Unsupported MCP transport ${JSON.stringify(transport)}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const options = {
      endpoint,
      expectedTool,
      protocolVersion,
      search,
      signal: controller.signal,
    };
    return transport === "sse"
      ? await runSseTest(options)
      : await runStreamableHttpTest(options);
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
  }
}

async function main() {
  const endpoint =
    process.argv[2] ??
    process.env.DOCS_MCP_ENDPOINT ??
    "https://docs-mcp.genlayer.com/mcp";
  const timeoutMs = parsePositiveInteger(
    process.env.DOCS_MCP_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const expectedTool =
    process.env.DOCS_MCP_EXPECTED_TOOL ?? DEFAULT_EXPECTED_TOOL;
  const skipSearch = process.env.DOCS_MCP_SKIP_SEARCH === "true";
  const search = skipSearch
    ? null
    : {
        ...DEFAULT_SEARCH,
        library: process.env.DOCS_MCP_SEARCH_LIBRARY ?? DEFAULT_SEARCH.library,
        query: process.env.DOCS_MCP_SEARCH_QUERY ?? DEFAULT_SEARCH.query,
        expectedText:
          process.env.DOCS_MCP_SEARCH_EXPECTED_TEXT ?? DEFAULT_SEARCH.expectedText,
        limit: parsePositiveInteger(
          process.env.DOCS_MCP_SEARCH_LIMIT,
          DEFAULT_SEARCH.limit,
        ),
      };

  const result = await runSmokeTest({ endpoint, timeoutMs, search });
  const server = result.serverInfo
    ? `${result.serverInfo.name ?? "unknown"}@${result.serverInfo.version ?? "unknown"}`
    : "unknown";
  console.log(
    `MCP smoke test passed: ${server}; tools: ${result.toolNames.join(", ")}; search: ${
      result.searchValidated ? "validated" : "skipped"
    }`,
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

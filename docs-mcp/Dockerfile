FROM node:22-slim

ARG DOCS_MCP_SERVER_VERSION=3.0.1

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm install -g "@arabold/docs-mcp-server@${DOCS_MCP_SERVER_VERSION}" && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

ARG DOCS_REVISION=unknown

LABEL org.opencontainers.image.source="https://github.com/genlayerlabs/genlayer-docs" \
      org.opencontainers.image.revision="${DOCS_REVISION}" \
      org.genlayer.docs-mcp.server-version="${DOCS_MCP_SERVER_VERSION}"

ENV PORT=8080
ENV DOCS_URL=https://docs.genlayer.com
ENV SDK_URL=https://sdk.genlayer.com/main/
ENV DOCS_MCP_SERVER_HEARTBEAT_MS=10000
ENV DOCS_REVISION=${DOCS_REVISION}

EXPOSE 8080

COPY entrypoint.sh /entrypoint.sh
COPY smoke-test.mjs /opt/docs-mcp/smoke-test.mjs
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

#!/bin/sh
set -e

STORE_PATH="${STORE_PATH:-/data}"

# Initial index if database doesn't exist
if [ ! -f "$STORE_PATH/documents.db" ]; then
  echo "First boot — indexing documentation..."
  docs-mcp-server scrape genlayer-docs "$DOCS_URL" --store-path "$STORE_PATH" --scope hostname --scrape-mode fetch
  docs-mcp-server scrape genlayer-sdk "$SDK_URL" --store-path "$STORE_PATH" --scope hostname --scrape-mode fetch
  echo "Initial indexing complete."
else
  echo "Existing index found at $STORE_PATH/documents.db"
fi

echo "Starting docs-mcp-server..."
exec docs-mcp-server server \
  --port "$PORT" \
  --host 0.0.0.0 \
  --store-path "$STORE_PATH" \
  --protocol http

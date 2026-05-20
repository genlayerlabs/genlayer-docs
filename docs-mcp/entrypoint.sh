#!/bin/sh
set -e

STORE_PATH="${STORE_PATH:-/data}"
MAX_PAGES="${MAX_PAGES:-1000}"
MAX_DEPTH="${MAX_DEPTH:-8}"

index_docs() {
  echo "Indexing documentation..."
  docs-mcp-server scrape genlayer-docs "$DOCS_URL" \
    --store-path "$STORE_PATH" \
    --scope hostname \
    --scrape-mode fetch \
    --max-pages "$MAX_PAGES" \
    --max-depth "$MAX_DEPTH" \
    --exclude-pattern '/full-documentation\.txt/' \
    --exclude-pattern '/developers/intelligent-contracts/?$/' \
    --exclude-pattern '/understand-genlayer-protocol/consensus/?$/' \
    --exclude-pattern '/validators/?$/'
  docs-mcp-server scrape genlayer-sdk "$SDK_URL" \
    --store-path "$STORE_PATH" \
    --scope hostname \
    --scrape-mode fetch \
    --max-pages "$MAX_PAGES" \
    --max-depth "$MAX_DEPTH"
}

index_is_usable() {
  docs-mcp-server --quiet find-version genlayer-docs --store-path "$STORE_PATH" >/dev/null 2>&1 &&
    docs-mcp-server --quiet find-version genlayer-sdk --store-path "$STORE_PATH" >/dev/null 2>&1
}

if [ ! -f "$STORE_PATH/documents.db" ]; then
  echo "No index found at $STORE_PATH/documents.db"
  index_docs
elif ! index_is_usable; then
  echo "Existing index at $STORE_PATH/documents.db is not usable; rebuilding..."
  index_docs
else
  echo "Usable index found at $STORE_PATH/documents.db"
fi

echo "Verifying index..."
if ! index_is_usable; then
  echo "Index verification failed." >&2
  exit 1
fi
echo "Index verification complete."

echo "Starting docs-mcp-server..."
exec docs-mcp-server mcp \
  --port "$PORT" \
  --host 0.0.0.0 \
  --store-path "$STORE_PATH" \
  --protocol http \
  --read-only

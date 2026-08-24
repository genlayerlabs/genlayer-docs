#!/bin/sh
set -e

STORE_PATH="${STORE_PATH:-/data}"
MAX_PAGES="${MAX_PAGES:-1000}"
MAX_DEPTH="${MAX_DEPTH:-8}"
MAX_CONCURRENCY="${MAX_CONCURRENCY:-4}"
MODE="${MODE:-all}"

if [ -z "$STORE_PATH" ] || [ "$STORE_PATH" = "/" ]; then
  echo "STORE_PATH must point to a dedicated data directory." >&2
  exit 1
fi

mkdir -p "$STORE_PATH"

index_docs() {
  echo "Indexing documentation..."
  docs-mcp-server scrape genlayer-docs "$DOCS_URL" \
    --store-path "$STORE_PATH" \
    --scope hostname \
    --scrape-mode fetch \
    --max-pages "$MAX_PAGES" \
    --max-depth "$MAX_DEPTH" \
    --max-concurrency "$MAX_CONCURRENCY" \
    --exclude-pattern '/full-documentation\.txt/' \
    --exclude-pattern '/\.md(?:\?.*)?$/' \
    --exclude-pattern '/developers/intelligent-contracts/?$/' \
    --exclude-pattern '/understand-genlayer-protocol/consensus/?$/' \
    --exclude-pattern '/validators/?$/'
  docs-mcp-server scrape genlayer-sdk "$SDK_URL" \
    --store-path "$STORE_PATH" \
    --scope hostname \
    --scrape-mode fetch \
    --max-pages "$MAX_PAGES" \
    --max-depth "$MAX_DEPTH" \
    --max-concurrency "$MAX_CONCURRENCY"
}

index_is_usable() {
  docs-mcp-server --quiet find-version genlayer-docs --store-path "$STORE_PATH" >/dev/null 2>&1 &&
    docs-mcp-server --quiet find-version genlayer-sdk --store-path "$STORE_PATH" >/dev/null 2>&1
}

explain_index_failure() {
  echo "Index diagnostics:"
  docs-mcp-server find-version genlayer-docs --store-path "$STORE_PATH" || true
  docs-mcp-server find-version genlayer-sdk --store-path "$STORE_PATH" || true
}

reset_index() {
  echo "Removing unusable derived index files before rebuilding..."
  rm -f \
    "$STORE_PATH/documents.db" \
    "$STORE_PATH/documents.db-shm" \
    "$STORE_PATH/documents.db-wal"
  index_docs
}

verify_index() {
  echo "Verifying index..."
  if ! index_is_usable; then
    echo "Index verification failed." >&2
    explain_index_failure >&2
    exit 1
  fi
  echo "Index verification complete."
}

ensure_index() {
  if [ ! -f "$STORE_PATH/documents.db" ]; then
    echo "No index found at $STORE_PATH/documents.db"
    index_docs
  elif ! index_is_usable; then
    echo "Existing index at $STORE_PATH/documents.db is not usable."
    explain_index_failure
    reset_index
  else
    echo "Usable index found at $STORE_PATH/documents.db"
  fi
  verify_index
}

serve() {
  verify_index
  echo "Starting docs-mcp-server from docs revision ${DOCS_REVISION:-unknown}..."
  exec docs-mcp-server mcp \
    --port "$PORT" \
    --host 0.0.0.0 \
    --store-path "$STORE_PATH" \
    --protocol http \
    --read-only
}

case "$MODE" in
  index)
    reset_index
    verify_index
    ;;
  serve)
    serve
    ;;
  all)
    ensure_index
    serve
    ;;
  *)
    echo "Unsupported MODE '$MODE'; expected index, serve, or all." >&2
    exit 1
    ;;
esac

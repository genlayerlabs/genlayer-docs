#!/bin/bash
set -euo pipefail

# Local run of the "Sync Documentation from Node Repository" workflow.
#
# Copies every synced node file into this checkout exactly as the workflow does
# (same file list, sanitizers and sync script), runs every doc generator, then
# runs the sync checks. Afterwards `git status` shows what a CI sync of the same
# node commit will change. Commit the result, and a CI run of that commit
# reports "No changes detected".
#
# Usage: scripts/simulate-node-sync.sh <node-ref>
#   <node-ref>  tag, branch or commit in the node repo (e.g. v0.6.0-rc.2, origin/v0.6-dev)
# Environment:
#   NODE_REPO   local genlayer-node clone (default: ../genlayer-node); fetch it first.
#
# Needs: git, node, and for the sync step GNU sed + yq v4 + perl. Where those are
# missing (macOS), the sync step runs in a debian:bookworm-slim container.

REF="${1:?Usage: $0 <node-ref>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_REPO="${NODE_REPO:-$ROOT/../genlayer-node}"
cd "$ROOT"

COMMIT=$(git -C "$NODE_REPO" rev-parse --verify "$REF^{commit}")
echo "Node commit: $COMMIT ($REF)"

SNAPSHOT=$(mktemp -d)
trap 'rm -rf "$SNAPSHOT"' EXIT
# shellcheck disable=SC2046
git -C "$NODE_REPO" archive "$COMMIT" $(bash .github/scripts/node-sync-params.sh --sources) | tar -x -C "$SNAPSHOT"

if sed --version >/dev/null 2>&1 && yq --version 2>/dev/null | grep -q 'version v4'; then
  bash .github/scripts/run-sync-matrix.sh "$SNAPSHOT"
else
  echo "GNU sed or yq v4 not found: running the sync step in a container"
  docker run --rm -v "$ROOT:/docs" -v "$SNAPSHOT:/src:ro" -w /docs debian:bookworm-slim bash -c '
    set -e
    apt-get -qq update >/dev/null
    apt-get -qq install -y wget ca-certificates perl >/dev/null
    wget -qO /usr/local/bin/yq "https://github.com/mikefarah/yq/releases/latest/download/yq_linux_$(dpkg --print-architecture)"
    chmod +x /usr/local/bin/yq
    bash .github/scripts/run-sync-matrix.sh /src
    chown -R '"$(id -u):$(id -g)"' content pages'
fi

bash .github/scripts/doc-generator.sh
node scripts/check-node-sync.js

echo
echo "Synced from node $COMMIT. Changes:"
git status --short -- content pages

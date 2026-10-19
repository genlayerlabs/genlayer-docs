#!/bin/bash
set -euo pipefail

# Runs every sync type of .github/scripts/node-sync-params.sh against a node
# snapshot, with the same prepare and sync scripts as the CI matrix.
# Writes into the current directory (the docs repo root).
#
# Usage: run-sync-matrix.sh <node_snapshot_dir>
# Needs: bash, perl, GNU sed, yq v4.

SNAPSHOT="$1"
SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC="$SCRIPTS/../actions/sync-files/sync.sh"
export GITHUB_OUTPUT
GITHUB_OUTPUT=$(mktemp)

failed=0
for type in $(bash "$SCRIPTS/node-sync-params.sh" --list); do
  params=$(SOURCE_ROOT="$SNAPSHOT" bash "$SCRIPTS/node-sync-params.sh" "$type")
  title=$(sed -n 's/^title=//p' <<< "$params")
  source_path=$(sed -n 's/^source_path=//p' <<< "$params")
  target_path=$(sed -n 's/^target_path=//p' <<< "$params")
  filter=$(sed -n 's/^filter_pattern=//p' <<< "$params")

  echo "::: $type"
  if ! src=$(bash "$SCRIPTS/prepare-sync-source.sh" "$type" "$source_path"); then
    failed=1
    continue
  fi
  bash "$SYNC" "$type" "$title" "$src" "$target_path" "$filter" "README,CHANGELOG,.gitignore,.gitkeep" \
    | grep -E '^(Added|Updated|Deleted):' || true
done

# sync.sh leaves per-type report artifacts for the CI upload step.
rm -rf artifacts "$GITHUB_OUTPUT"
exit "$failed"

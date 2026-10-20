#!/bin/bash
set -euo pipefail

# The one list of files synced from genlayer-node. The sync workflow and
# scripts/simulate-node-sync.sh both read it, so a local run copies exactly
# what CI copies.
#
# Usage:
#   node-sync-params.sh --list         sync types, one per line
#   node-sync-params.sh --sources      node repo paths to fetch, one per line
#   node-sync-params.sh <sync_type>    title=, source_path=, target_path=,
#                                      filter_pattern= lines (GITHUB_OUTPUT format)
#
# Environment:
#   SOURCE_ROOT       where the node snapshot is checked out (default: source-repo)
#   CHANGELOG_PATH, API_GEN_PATH, API_DEBUG_PATH, API_OPS_PATH,
#   API_GEN_REGEX, API_DEBUG_REGEX: the workflow_dispatch overrides
#   SYNC_TYPES        optional space-separated subset of sync types for --list
#                     and --sources (local runs only, e.g. to pin some files to
#                     an older node tag); default: all types

SOURCE_ROOT="${SOURCE_ROOT:-source-repo}"
CHANGELOG_PATH="${CHANGELOG_PATH:-docs/changelog}"
API_GEN_PATH="${API_GEN_PATH:-docs/api/rpc}"
API_DEBUG_PATH="${API_DEBUG_PATH:-docs/api/rpc}"
API_OPS_PATH="${API_OPS_PATH:-docs/api/ops}"
API_GEN_REGEX="${API_GEN_REGEX:-gen_(?!dbg_).*}"
API_DEBUG_REGEX="${API_DEBUG_REGEX:-gen_dbg_(?!load_test).*}"

# type|title|node path|docs target|filter
TABLE="changelog|Changelog|${CHANGELOG_PATH}|content/validators/changelog|.*
config|Config File|configs/node/config.yaml.example|content/validators/config.yaml|.*
config_bradbury|Config File (Bradbury)|configs/node/bradbury.yaml.example|content/validators/bradbury.yaml|.*
config_bradbury_manifest|Protocol Manifest (Bradbury)|configs/node/bradbury.protocol-manifest.json|content/validators/bradbury.protocol-manifest.json|.*
docker_compose|Docker Compose File|release/docker-compose.yaml|content/validators/docker-compose.yaml|.*
docker_compose_monitoring|Docker Compose File (Monitoring)|release/docker-compose.yaml|content/validators/docker-compose-monitoring.yaml|.*
env_example|Environment File (.env.example)|release/.env.example|content/validators/env.example|.*
alloy_config|Alloy Config File|release/alloy-config.river|content/validators/alloy-config.river|.*
greybox_setup|Greybox Setup Guide|release/greybox-setup-guide.md|content/validators/greybox-setup-guide.md|.*
api_gen|API Gen Methods|${API_GEN_PATH}|pages/api-references/genlayer-node/gen|${API_GEN_REGEX}
api_debug|API Debug Methods|${API_DEBUG_PATH}|pages/api-references/genlayer-node/debug|${API_DEBUG_REGEX}
api_ops|API Ops Methods|${API_OPS_PATH}|pages/api-references/genlayer-node/ops|.*"

# Rows of the selected types (all rows when SYNC_TYPES is unset).
selected() {
  if [[ -z "${SYNC_TYPES:-}" ]]; then
    printf '%s\n' "$TABLE"
    return
  fi
  local t
  for t in $SYNC_TYPES; do
    awk -F'|' -v t="$t" '$1 == t' <<< "$TABLE" | grep . || { echo "Unknown sync type: $t" >&2; exit 1; }
  done
}

case "${1:-}" in
  --list)
    selected | cut -d'|' -f1
    ;;
  --sources)
    selected | cut -d'|' -f3 | sort -u
    ;;
  "")
    echo "Usage: $0 --list | --sources | <sync_type>" >&2
    exit 1
    ;;
  *)
    row=$(awk -F'|' -v t="$1" '$1 == t' <<< "$TABLE")
    if [[ -z "$row" ]]; then
      echo "Unknown sync type: $1" >&2
      exit 1
    fi
    IFS='|' read -r _ title src target filter <<< "$row"
    echo "title=$title"
    echo "source_path=$SOURCE_ROOT/$src"
    echo "target_path=$target"
    echo "filter_pattern=$filter"
    ;;
esac

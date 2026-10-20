#!/bin/bash
set -euo pipefail

# Prints the path to sync from for one sync type. Types whose node file must be
# cleaned before it is published (config, docker_compose) get a sanitized copy in
# a temp directory; every other type syncs the node path as is.
# Used by .github/actions/sync-files and scripts/simulate-node-sync.sh.
#
# Usage: prepare-sync-source.sh <sync_type> <source_path>

TYPE="$1"
SOURCE="$2"
SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -e "$SOURCE" ]]; then
  echo "Source not found: $SOURCE" >&2
  exit 1
fi

case "$TYPE" in
  config)
    dir=$(mktemp -d)
    cp "$SOURCE" "$dir/config.yaml"
    bash "$SCRIPTS/sanitize-config.sh" "$dir/config.yaml" >&2
    echo "$dir/config.yaml"
    ;;
  docker_compose)
    dir=$(mktemp -d)
    cp "$SOURCE" "$dir/docker-compose.yaml"
    bash "$SCRIPTS/sanitize-docker-compose.sh" "$dir/docker-compose.yaml" >&2
    echo "$dir/docker-compose.yaml"
    ;;
  *)
    echo "$SOURCE"
    ;;
esac

#!/bin/bash
set -e

# Sanitize docker-compose.yaml for documentation
# Removes the alloy service and volumes section
# Usage: sanitize-docker-compose.sh <docker_compose_file>

DOCKER_COMPOSE_FILE="$1"

if [[ -z "$DOCKER_COMPOSE_FILE" ]]; then
    echo "Usage: $0 <docker_compose_file>" >&2
    exit 1
fi

if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    echo "File not found: $DOCKER_COMPOSE_FILE" >&2
    exit 1
fi

echo "Sanitizing docker-compose file: $DOCKER_COMPOSE_FILE"

# Use yq to remove alloy service and volumes section
yq -i 'del(.services.alloy) | del(.volumes)' "$DOCKER_COMPOSE_FILE"

# Remove leftover comments about alloy (yq preserves them)
sed -i '/# Grafana Alloy/,/^[^ #]/{ /^[^ #]/!d }' "$DOCKER_COMPOSE_FILE"
sed -i '/^$/N;/^\n$/d' "$DOCKER_COMPOSE_FILE"

echo "Docker-compose sanitization completed"

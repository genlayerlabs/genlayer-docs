#!/bin/bash
set -e

# Sanitize docker-compose.yaml for documentation
# Removes the alloy service, its comments, and volumes section
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

# Remove everything from "# Grafana Alloy" comment to end of file
# This includes the alloy service comments, the service itself, and the volumes section
sed -i '/# Grafana Alloy/,$d' "$DOCKER_COMPOSE_FILE"

echo "Docker-compose sanitization completed"

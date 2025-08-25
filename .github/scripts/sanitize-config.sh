#!/bin/bash
set -e

# Sanitize GenLayer config file for documentation
# Usage: sanitize-config.sh <config_file>

CONFIG_FILE="$1"

if [[ -z "$CONFIG_FILE" ]]; then
    echo "Usage: $0 <config_file>" >&2
    exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "File not found: $CONFIG_FILE" >&2
    exit 1
fi

echo "Sanitizing config file: $CONFIG_FILE"

# Replace URLs with TODO placeholders (only on non-commented lines; preserve indent)
sed -i.bak -E '/^[[:space:]]*#/! s|^([[:space:]]*)zksyncurl:[[:space:]]*".*"|\1zksyncurl: "TODO: Set your GenLayer Chain ZKSync HTTP RPC URL here"|' "$CONFIG_FILE"
sed -i.bak -E '/^[[:space:]]*#/! s|^([[:space:]]*)zksyncwebsocketurl:[[:space:]]*".*"|\1zksyncwebsocketurl: "TODO: Set your GenLayer Chain ZKSync WebSocket RPC URL here"|' "$CONFIG_FILE"
rm -f "${CONFIG_FILE}.bak"

# Remove node.dev sections using Python script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/sanitize-config.py" ]]; then
    python3 "$SCRIPT_DIR/sanitize-config.py" "$CONFIG_FILE"
else
    echo "Warning: sanitize-config.py not found, skipping Python sanitization"
fi

echo "Config sanitization completed"
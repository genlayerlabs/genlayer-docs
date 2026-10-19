#!/bin/bash
set -e

# Sanitize config.yaml for documentation
# Replaces RPC URLs with placeholders and removes dev section
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

# Use yq to:
# Replace RPC URLs / provider with TODO placeholders
yq -i '
  .rollup.genlayerchainrpcurl = "TODO: Set your GenLayer Chain Orbit HTTP RPC URL here" |
  .rollup.genlayerchainwebsocketurl = "TODO: Set your GenLayer Chain Orbit WebSocket RPC URL here" |
  .rollup.provider = "TODO: Set your GenLayer Chain Orbit provider"
' "$CONFIG_FILE"

echo "Config sanitization completed"

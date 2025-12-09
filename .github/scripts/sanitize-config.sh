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
# 1. Replace RPC URLs with TODO placeholders
# 2. Delete node.dev section
yq -i '
  .rollup.genlayerchainrpcurl = "TODO: Set your GenLayer Chain ZKSync HTTP RPC URL here" |
  .rollup.genlayerchainwebsocketurl = "TODO: Set your GenLayer Chain ZKSync WebSocket RPC URL here" |
  del(.node.dev)
' "$CONFIG_FILE"

echo "Config sanitization completed"

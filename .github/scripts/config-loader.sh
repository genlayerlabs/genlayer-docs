#!/bin/bash
set -euo pipefail

# Configuration loading utilities
# Loads and validates the centralized sync configuration

# Load sync configuration from YAML file
load_sync_config() {
    local config_file=".github/config/sync-config.yml"
    
    if [[ ! -f "$config_file" ]]; then
        echo "::error::Sync configuration file not found: $config_file"
        return 1
    fi
    
    echo "📋 Loading sync configuration from $config_file"
    
    # Convert YAML to JSON for easier parsing in GitHub Actions
    local config_json
    config_json=$(python3 -c "
import yaml, json, sys
try:
    with open('$config_file', 'r') as f:
        config = yaml.safe_load(f)
    print(json.dumps(config))
except Exception as e:
    print(f'Error loading config: {e}', file=sys.stderr)
    sys.exit(1)
")
    
    if [[ $? -ne 0 ]]; then
        echo "::error::Failed to parse sync configuration"
        return 1
    fi
    
    # Output the config for use in other jobs
    echo "config<<EOF" >> "$GITHUB_OUTPUT"
    echo "$config_json" >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"
    
    echo "✅ Sync configuration loaded successfully"
    return 0
}
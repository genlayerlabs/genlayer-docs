#!/usr/bin/env python3
"""
Sanitize GenLayer node configuration by removing dev and admin sections.

This script is used by the GitHub Actions workflow to prepare the config
for documentation by removing sensitive sections.
"""

import sys
import yaml


def sanitize_config(config_file_path):
    """Remove node.dev and node.admin sections from config file."""
    # Read the YAML file
    with open(config_file_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Remove node.dev and node.admin if they exist
    if 'node' in config:
        if 'dev' in config['node']:
            del config['node']['dev']
        if 'admin' in config['node']:
            del config['node']['admin']
    
    # Write back to file preserving the structure
    with open(config_file_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False, allow_unicode=True)


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <config_file_path>", file=sys.stderr)
        sys.exit(1)
    
    config_file_path = sys.argv[1]
    
    try:
        sanitize_config(config_file_path)
    except Exception as e:
        print(f"Error sanitizing config: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Sanitize GenLayer node configuration by removing dev and admin sections.

This script is used by the GitHub Actions workflow to prepare the config
for documentation by removing sensitive sections.
"""

import sys
import re


def sanitize_config(config_file_path):
    """Remove node.dev and node.admin sections from config file using regex."""
    print(f"Sanitizing config file: {config_file_path}")
    
    # Read the YAML file
    with open(config_file_path, 'r') as f:
        content = f.read()
    
    print(f"Original file size: {len(content)} bytes")
    
    # Remove node.admin section
    # This regex matches the admin: line and all indented content that follows
    admin_pattern = r'(\n\s+admin:\s*\n(?:\s+(?:port:\s*\d+|\S.*)\s*\n)*)'
    if re.search(admin_pattern, content):
        content = re.sub(admin_pattern, '\n', content)
        print("Removed node.admin section")
    
    # Remove node.dev section
    # This regex matches the dev: line and all indented content that follows
    dev_pattern = r'(\n\s+dev:\s*\n(?:\s+\S.*\s*\n)*)'
    if re.search(dev_pattern, content):
        content = re.sub(dev_pattern, '\n', content)
        print("Removed node.dev section")
    
    # Write back to file
    with open(config_file_path, 'w') as f:
        f.write(content)
    
    print(f"Sanitized file size: {len(content)} bytes")
    print("Config sanitization completed")


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
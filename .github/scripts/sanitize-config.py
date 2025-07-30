#!/usr/bin/env python3
"""
Sanitize GenLayer node configuration by removing dev and admin sections.

This script is used by the GitHub Actions workflow to prepare the config
for documentation by removing sensitive sections.
"""

import sys


def find_section_end(lines, start_idx, base_indent):
    """Find the end of a YAML section based on indentation."""
    idx = start_idx + 1
    while idx < len(lines):
        line = lines[idx]
        # Skip empty lines and comments
        if line.strip() == '' or line.strip().startswith('#'):
            idx += 1
            continue
        
        # Get the indentation of the current line
        current_indent = len(line) - len(line.lstrip())
        
        # If we find a line with same or less indentation than the section header,
        # the section has ended
        if current_indent <= base_indent:
            return idx
        
        idx += 1
    
    # If we reach the end of file, return the length
    return len(lines)


def sanitize_config(config_file_path):
    """Remove node.dev and node.admin sections from config file."""
    print(f"Sanitizing config file: {config_file_path}")
    
    # Read the YAML file
    with open(config_file_path, 'r') as f:
        content = f.read()
    
    print(f"Original file size: {len(content)} bytes")
    
    # Split into lines for easier processing
    lines = content.splitlines(keepends=True)
    
    # Track lines to remove
    lines_to_remove = set()
    
    # Find and mark node.admin and node.dev sections
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if this is an admin: or dev: line under node:
        if stripped in ['admin:', 'dev:']:
            # Get the indentation of this line
            indent = len(line) - len(line.lstrip())
            
            # Make sure this is under a node: section by checking previous lines
            # Look for 'node:' at a lower indentation level
            is_under_node = False
            for j in range(i-1, -1, -1):
                prev_line = lines[j].strip()
                if prev_line == '':
                    continue
                prev_indent = len(lines[j]) - len(lines[j].lstrip())
                if prev_indent < indent and prev_line.startswith('node:'):
                    is_under_node = True
                    break
                elif prev_indent < indent:
                    # Found a different section at lower indent
                    break
            
            if is_under_node:
                # Find the end of this section
                section_end = find_section_end(lines, i, indent)
                
                # Mark all lines in this section for removal
                for idx in range(i, section_end):
                    lines_to_remove.add(idx)
                
                print(f"Removed node.{stripped[:-1]} section (lines {i+1}-{section_end})")
                
                # Skip to the end of this section
                i = section_end - 1
        
        i += 1
    
    # Remove marked lines
    new_lines = [line for idx, line in enumerate(lines) if idx not in lines_to_remove]
    
    # Write back to file
    with open(config_file_path, 'w') as f:
        f.writelines(new_lines)
    
    print(f"Sanitized file size: {sum(len(line) for line in new_lines)} bytes")
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
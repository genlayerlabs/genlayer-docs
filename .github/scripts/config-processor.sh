#!/bin/bash
set -euo pipefail

# Configuration file processing utilities
# Extracted from the complex config processing logic in the workflow

# Process and sanitize config file
process_config_file() {
    local source_config="$1"
    local dest_config="$2"
    local report_file="$3"
    
    echo "" >> "$report_file"
    echo "## Config File Sync" >> "$report_file"
    echo "" >> "$report_file"
    
    if [[ ! -f "$source_config" ]]; then
        printf -- "- Source config file not found at: \`%s\`\n" "${source_config#source-repo/}" >> "$report_file"
        echo "config_updated=0" >> "$GITHUB_OUTPUT"
        echo "::warning::Config file not found: $source_config"
        return 0
    fi
    
    echo "✓ Found config file at: $source_config"
    mkdir -p "$(dirname "$dest_config")"
    
    # Create a temporary file for sanitized config
    local temp_config
    temp_config=$(mktemp)
    
    # Copy and sanitize the config
    cp "$source_config" "$temp_config"
    
    echo "🔧 Sanitizing config file..."
    
    # Replace actual URLs with TODO placeholders
    sed -i.bak 's|zksyncurl: *"[^"]*"|zksyncurl: "TODO: Set your GenLayer Chain ZKSync HTTP RPC URL here"|' "$temp_config"
    sed -i.bak 's|zksyncwebsocketurl: *"[^"]*"|zksyncwebsocketurl: "TODO: Set your GenLayer Chain ZKSync WebSocket RPC URL here"|' "$temp_config"
    
    # Remove backup files
    rm -f "${temp_config}.bak"
    
    # Remove node.dev sections using Python for reliable YAML parsing
    if [[ -f ".github/scripts/sanitize-config.py" ]]; then
        echo "🐍 Running Python sanitization script..."
        python3 .github/scripts/sanitize-config.py "$temp_config"
        local sanitize_exit_code=$?
        
        if [[ $sanitize_exit_code -ne 0 ]]; then
            echo "::error::Config sanitization failed!"
            rm -f "$temp_config"
            return 1
        fi
    else
        echo "::warning::Sanitization script not found, skipping dev section removal"
    fi
    
    # Check if the config has changed
    if [[ -f "$dest_config" ]]; then
        if ! cmp -s "$temp_config" "$dest_config"; then
            cp "$temp_config" "$dest_config"
            echo "- Updated: \`config.yaml\` (sanitized)" >> "$report_file"
            echo "config_updated=1" >> "$GITHUB_OUTPUT"
            echo "✅ Config file was updated"
            
            # Output standard metrics for workflow
            echo "added=0" >> "$GITHUB_OUTPUT"
            echo "updated=1" >> "$GITHUB_OUTPUT"
            echo "deleted=0" >> "$GITHUB_OUTPUT"
            echo "total=1" >> "$GITHUB_OUTPUT"
            echo "1" > "${RUNNER_TEMP}/changes_config.txt"
        else
            echo "- No changes to \`config.yaml\`" >> "$report_file"
            echo "config_updated=0" >> "$GITHUB_OUTPUT"
            echo "ℹ️ Config file unchanged"
            
            # Output zero metrics
            echo "added=0" >> "$GITHUB_OUTPUT"
            echo "updated=0" >> "$GITHUB_OUTPUT"
            echo "deleted=0" >> "$GITHUB_OUTPUT"
            echo "total=0" >> "$GITHUB_OUTPUT"
            echo "0" > "${RUNNER_TEMP}/changes_config.txt"
        fi
    else
        cp "$temp_config" "$dest_config"
        echo "- Added: \`config.yaml\` (sanitized)" >> "$report_file"
        echo "config_updated=1" >> "$GITHUB_OUTPUT"
        echo "✅ Config file was created"
        
        # Output standard metrics for workflow
        echo "added=1" >> "$GITHUB_OUTPUT"
        echo "updated=0" >> "$GITHUB_OUTPUT"
        echo "deleted=0" >> "$GITHUB_OUTPUT"
        echo "total=1" >> "$GITHUB_OUTPUT"
        echo "1" > "${RUNNER_TEMP}/changes_config.txt"
    fi
    
    # Verify final config structure
    verify_config_structure "$dest_config"
    
    # Clean up temp file
    rm -f "$temp_config"
}

# Verify config file has expected structure
verify_config_structure() {
    local config_file="$1"
    
    echo "🔍 Verifying config structure..."
    
    local missing_sections=()
    
    if ! grep -q "^node:" "$config_file"; then
        missing_sections+=("node")
    fi
    
    if ! grep -q "^consensus:" "$config_file"; then
        missing_sections+=("consensus")
    fi
    
    if ! grep -q "^genvm:" "$config_file"; then
        missing_sections+=("genvm")
    fi
    
    if ! grep -q "^metrics:" "$config_file"; then
        missing_sections+=("metrics")
    fi
    
    if [[ ${#missing_sections[@]} -gt 0 ]]; then
        echo "::warning::Missing config sections: ${missing_sections[*]}"
    else
        echo "✅ All expected config sections found"
    fi
    
    # Check for sensitive sections that should be removed
    if grep -q "^\s*dev:" "$config_file"; then
        echo "::error::Dev section still present in config!"
        return 1
    fi
    
    # Check for TODO placeholders
    if grep -q "TODO:" "$config_file"; then
        echo "✅ TODO placeholders found in config"
    else
        echo "::warning::No TODO placeholders found in config"
    fi
    
    echo "📊 Config file size: $(wc -c < "$config_file") bytes"
}
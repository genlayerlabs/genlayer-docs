#!/bin/bash
set -euo pipefail

# Documentation generation utilities
# Runs the post-sync documentation generation scripts

# Run all documentation generation scripts
run_doc_generation_scripts() {
    local config_json="$1"
    local report_file="${2:-${RUNNER_TEMP}/doc_generation_report.md}"
    
    echo "## Documentation Generation" >> "$report_file"
    echo "" >> "$report_file"
    
    # Extract scripts from config
    local scripts
    scripts=$(echo "$config_json" | jq -r '.scripts.post_sync[] | @base64')
    
    local success_count=0
    local total_count=0
    
    # Run each script
    while IFS= read -r script_b64; do
        [[ -n "$script_b64" ]] || continue
        
        local script_info
        script_info=$(echo "$script_b64" | base64 --decode)
        
        local script_name
        script_name=$(echo "$script_info" | jq -r '.name')
        
        local script_command
        script_command=$(echo "$script_info" | jq -r '.command')
        
        local script_description
        script_description=$(echo "$script_info" | jq -r '.description')
        
        ((total_count++))
        
        echo "🔧 Running: $script_name"
        echo "   Command: $script_command"
        echo "   Description: $script_description"
        
        if eval "$script_command"; then
            echo "- ✅ $script_name" >> "$report_file"
            ((success_count++))
            echo "   ✅ Success"
        else
            echo "- ❌ $script_name (failed)" >> "$report_file"
            echo "   ❌ Failed"
            echo "::error::Documentation generation script failed: $script_name"
        fi
        
        echo ""
    done <<< "$scripts"
    
    # Summary
    echo "" >> "$report_file"
    echo "Summary: $success_count/$total_count scripts completed successfully" >> "$report_file"
    
    if [[ $success_count -eq $total_count ]]; then
        echo "✅ All documentation generation scripts completed successfully"
        return 0
    else
        echo "::error::$((total_count - success_count)) documentation generation scripts failed"
        return 1
    fi
}

# Verify final config after generation
verify_final_config() {
    local config_path="content/validators/config.yaml"
    
    echo "🔍 Final config.yaml verification"
    
    if [[ ! -f "$config_path" ]]; then
        echo "::error::Config file not found at $config_path"
        return 1
    fi
    
    echo "✅ Config file exists at: $config_path"
    echo "📊 File size: $(wc -c < "$config_path") bytes"
    
    # Check for sensitive sections
    if grep -E "^\s*dev:" "$config_path" >/dev/null 2>&1; then
        echo "::error::Dev section found in final config!"
        return 1
    else
        echo "✅ No dev section found"
    fi
    
    # Check for TODO placeholders
    if grep -i "TODO:" "$config_path" >/dev/null 2>&1; then
        echo "✅ TODO placeholders found in config"
    else
        echo "::warning::No TODO placeholders found in config"
    fi
    
    return 0
}
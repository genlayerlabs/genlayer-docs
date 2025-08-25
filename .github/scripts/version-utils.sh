#!/bin/bash
set -euo pipefail

# Version detection and handling utilities

# Detect latest version from repository
detect_latest_version() {
    local token="${1:-$GITHUB_TOKEN}"
    local temp_dir="/tmp/source-repo-temp-$$"
    
    # Clone source repo (minimal, just for tags) with token if available
    if [[ -n "${token:-}" ]]; then
        git clone --depth 1 --no-checkout \
          "https://${token}@github.com/genlayerlabs/genlayer-node.git" "$temp_dir" 2>/dev/null || \
        git clone --depth 1 --no-checkout \
          "https://github.com/genlayerlabs/genlayer-node.git" "$temp_dir"
    else
        git clone --depth 1 --no-checkout \
          "https://github.com/genlayerlabs/genlayer-node.git" "$temp_dir"
    fi
    
    cd "$temp_dir"
    
    # Fetch all tags
    git fetch --tags
    
    # Get latest stable version tag
    local latest_tag
    latest_tag=$(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)
    
    # Cleanup
    cd /
    rm -rf "$temp_dir"
    
    if [[ -z "$latest_tag" ]]; then
        echo "::error::No version tags found in source repository" >&2
        exit 1
    fi
    
    echo "$latest_tag"
}

# Version validation
validate_version() {
    local version="$1"
    
    if [[ ! "$version" =~ ^(latest|v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?)$ ]]; then
        echo "::error::Invalid version format: $version"
        echo "Expected: 'latest' or 'vX.Y.Z' (e.g., 'v1.2.3')"
        return 1
    fi
    
    echo "✓ Version format is valid: $version"
    return 0
}

# Extract sync parameters from workflow inputs
extract_sync_parameters() {
    local event_name="${1:-}"
    local version="${2:-latest}"
    local changelog_path="${3:-docs/changelog}"
    local api_gen_path="${4:-docs/api/rpc}"
    local api_debug_path="${5:-docs/api/rpc}"
    local api_gen_regex="${6:-gen_(?!dbg_).*}"
    local api_debug_regex="${7:-gen_dbg_.*}"
    
    echo "📋 Extracting sync parameters for event: $event_name"
    
    # Output extracted parameters
    echo "changelog_path=$changelog_path" >> "$GITHUB_OUTPUT"
    echo "api_gen_path=$api_gen_path" >> "$GITHUB_OUTPUT"
    echo "api_debug_path=$api_debug_path" >> "$GITHUB_OUTPUT"
    echo "api_gen_regex=$api_gen_regex" >> "$GITHUB_OUTPUT"
    echo "api_debug_regex=$api_debug_regex" >> "$GITHUB_OUTPUT"
    
    # Validate and output the requested version
    validate_version "$version"
    echo "requested_version=$version" >> "$GITHUB_OUTPUT"
    echo "Extracted version: $version"
}

# Detect and validate final version to use
detect_and_validate_version() {
    local requested_version="$1"
    local final_version=""
    
    if [[ "$requested_version" == "latest" || -z "$requested_version" ]]; then
        final_version=$(detect_latest_version "source-repo")
    else
        final_version="$requested_version"
    fi
    
    # Final validation
    validate_version "$final_version"
    
    echo "final_version=$final_version" >> "$GITHUB_OUTPUT"
    echo "✅ Using version: $final_version"
}
#!/bin/bash
set -euo pipefail

# Version detection and handling utilities
# Extracted from the complex version logic in the workflow

# Detect latest version from repository tags
detect_latest_version() {
    local repo_path="$1"
    cd "$repo_path"
    
    # Get the latest tag that's not a pre-release
    local latest_tag
    latest_tag=$(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)
    
    if [[ -z "$latest_tag" ]]; then
        echo "::error::No tags found in repository"
        return 1
    fi
    
    echo "Detected latest tag: $latest_tag"
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
        echo "🔍 Detecting latest version from source repository..."
        final_version=$(detect_latest_version "source-repo")
    else
        final_version="$requested_version"
    fi
    
    # Final validation
    validate_version "$final_version"
    
    echo "final_version=$final_version" >> "$GITHUB_OUTPUT"
    echo "✅ Using version: $final_version"
}
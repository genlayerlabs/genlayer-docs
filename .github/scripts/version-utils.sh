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
    local version=""
    
    if [[ "${{ github.event_name }}" == "repository_dispatch" ]]; then
        # Extract from repository_dispatch payload
        version="${{ github.event.client_payload.version }}"
        if [[ -z "$version" ]]; then
            version="latest"
        fi
        
        echo "changelog_path=${{ github.event.client_payload.changelog_path || 'docs/changelog' }}" >> "$GITHUB_OUTPUT"
        echo "api_gen_path=${{ github.event.client_payload.api_gen_path || 'docs/api/rpc' }}" >> "$GITHUB_OUTPUT"
        echo "api_debug_path=${{ github.event.client_payload.api_debug_path || 'docs/api/rpc' }}" >> "$GITHUB_OUTPUT"
        echo "api_gen_regex=${{ github.event.client_payload.api_gen_regex || 'gen_(?!dbg_).*' }}" >> "$GITHUB_OUTPUT"
        echo "api_debug_regex=${{ github.event.client_payload.api_debug_regex || 'gen_dbg_.*' }}" >> "$GITHUB_OUTPUT"
    else
        # Extract from workflow_dispatch inputs
        version="${{ github.event.inputs.version }}"
        
        echo "changelog_path=docs/changelog" >> "$GITHUB_OUTPUT"
        echo "api_gen_path=${{ github.event.inputs.api_gen_path || 'docs/api/rpc' }}" >> "$GITHUB_OUTPUT"
        echo "api_debug_path=${{ github.event.inputs.api_debug_path || 'docs/api/rpc' }}" >> "$GITHUB_OUTPUT"
        echo "api_gen_regex=${{ github.event.inputs.api_gen_regex || 'gen_(?!dbg_).*' }}" >> "$GITHUB_OUTPUT"
        echo "api_debug_regex=${{ github.event.inputs.api_debug_regex || 'gen_dbg_.*' }}" >> "$GITHUB_OUTPUT"
    fi
    
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
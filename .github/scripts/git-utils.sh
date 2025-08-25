#!/bin/bash
set -euo pipefail

# Git utilities for branch management and PR creation
# Extracted from the complex git operations in the workflow

# Create sync branch with proper naming
create_sync_branch() {
    local version="$1"
    
    # Sanitize version string for use in branch name
    local safe_version
    safe_version=$(echo "$version" | sed 's/\//-/g')
    local branch_name="docs/node/${safe_version}"
    
    echo "🌿 Creating sync branch: $branch_name" >&2
    
    # Check if branch exists on remote
    if git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
        echo "⚠️ Branch $branch_name already exists on remote, will force update" >&2
        git fetch origin "$branch_name"
    fi
    
    # Create/recreate branch from current HEAD (main)
    git switch --force-create "$branch_name"
    
    # Export for use in subsequent steps and return for local use
    echo "BRANCH_NAME=$branch_name" >> "$GITHUB_ENV"
    echo "✅ Created branch: $branch_name" >&2
    
    # Return only the branch name for capture
    echo "$branch_name"
}

# Commit and push changes
commit_and_push_changes() {
    local version="$1"
    local total_changes="$2"
    local total_added="$3"
    local total_updated="$4"
    local total_deleted="$5"
    local branch_name="$6"
    
    echo "Committing changes..."
    
    # Add relevant directories (including deletions)
    git add --all content/validators pages/api-references pages/validators
    
    # Check what's staged
    echo "📋 Files staged for commit:"
    git status --porcelain
    
    # Create commit with detailed message
    git commit -m "$(cat <<EOF
docs: Sync documentation from node repository $version

- Source: genlayerlabs/genlayer-node@$version
- Version: $version
- Total changes: $total_changes
- Added: $total_added files
- Updated: $total_updated files
- Deleted: $total_deleted files
EOF
)"
    
    echo "🚀 Pushing changes..."
    git push --force-with-lease origin "$branch_name"
    
    echo "✅ Changes committed and pushed to $branch_name"
}

# Check for any changes
check_for_changes() {
    if [[ -n "$(git status --porcelain)" ]]; then
        echo "has_changes=true" >> "$GITHUB_OUTPUT"
        echo "✅ Changes detected"
        return 0
    else
        echo "has_changes=false" >> "$GITHUB_OUTPUT"
        echo "ℹ️ No changes detected"
        return 1
    fi
}
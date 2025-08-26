#!/bin/bash
set -e

# Sync artifact files to the repository
# Usage: sync-artifact-files.sh <source_root> <target_root> <paths...>
# Example: sync-artifact-files.sh temp-merged . "content/validators" "pages/api-references/genlayer-node"

SOURCE_ROOT="$1"
TARGET_ROOT="$2"
shift 2
SYNC_PATHS=("$@")

if [[ -z "$SOURCE_ROOT" || -z "$TARGET_ROOT" || ${#SYNC_PATHS[@]} -eq 0 ]]; then
    echo "Usage: $0 <source_root> <target_root> <paths...>" >&2
    echo "Example: $0 temp-merged . 'content/validators' 'pages/api-references/genlayer-node'" >&2
    exit 1
fi

if [[ ! -d "$SOURCE_ROOT" ]]; then
    echo "Source root directory not found: $SOURCE_ROOT" >&2
    exit 1
fi

echo "Syncing artifact files from $SOURCE_ROOT to $TARGET_ROOT"
echo "Paths to sync: ${SYNC_PATHS[*]}"

total_synced=0

# Sync each specified path
for path in "${SYNC_PATHS[@]}"; do
    source_path="$SOURCE_ROOT/$path"
    target_path="$TARGET_ROOT/$path"
    
    if [[ -d "$source_path" ]]; then
        echo ""
        echo "Syncing $path..."
        
        # Create parent directory if needed
        mkdir -p "$(dirname "$target_path")"
        
        # Count files in this path
        file_count=$(find "$source_path" -type f | wc -l)
        echo "  Found $file_count files in $path"
        
        # Always run rsync with delete to ensure stale files are removed even when source is empty
        rsync -av --delete "$source_path/" "$target_path/"
        total_synced=$((total_synced + file_count))
        
        if [[ $file_count -gt 0 ]]; then
            echo "  ✅ Synced $path ($file_count files)"
        else
            echo "  ✅ Synced $path (cleaned - no files in source)"
        fi
    else
        echo "  ⏭️ Skipping $path (not found in source)"
    fi
done

echo ""
if [[ $total_synced -gt 0 ]]; then
    echo "✅ Successfully synced $total_synced files"
else
    echo "⚠️ No files were synced"
fi
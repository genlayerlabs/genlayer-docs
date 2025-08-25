#!/bin/bash
set -e

# File/directory synchronization script for documentation
# Syncs .md and .mdx files with pattern filtering

# Get parameters
TYPE="$1"
TITLE="$2"
SOURCE_PATH="$3"
TARGET_PATH="$4"
FILTER_PATTERN="${5:-.*}"
EXCLUDE_FILES="${6:-README,CHANGELOG,.gitignore,.gitkeep}"

# Initialize metrics and lists
added=0
updated=0
deleted=0
added_files=()
updated_files=()
deleted_files=()

# Convert exclusions to array
IFS=',' read -ra EXCLUSIONS <<< "$EXCLUDE_FILES"

# Check if file should be excluded
is_excluded() {
    local filename="$1"
    for excluded in "${EXCLUSIONS[@]}"; do
        [[ "$filename" == "$excluded" ]] && return 0
    done
    return 1
}

# Check if filename matches pattern
matches_pattern() {
    local filename="$1"
    local pattern="$2"
    
    # Try perl first (supports PCRE including negative lookahead)
    if command -v perl >/dev/null 2>&1; then
        echo "$filename" | perl -ne "exit 0 if /^($pattern)\$/; exit 1"
        return $?
    fi
    
    # Fallback to grep -E (doesn't support negative lookahead)
    echo "$filename" | grep -E "^($pattern)$" >/dev/null 2>&1
    return $?
}

# Handle single file sync
if [[ -f "$SOURCE_PATH" ]]; then
    echo "Syncing file: $SOURCE_PATH -> $TARGET_PATH"
    mkdir -p "$(dirname "$TARGET_PATH")"
    
    if [[ -f "$TARGET_PATH" ]]; then
        if ! cmp -s "$SOURCE_PATH" "$TARGET_PATH"; then
            cp "$SOURCE_PATH" "$TARGET_PATH"
            updated=1
            updated_files+=("$(basename "$TARGET_PATH")")
            echo "Updated: $(basename "$TARGET_PATH")"
        fi
    else
        cp "$SOURCE_PATH" "$TARGET_PATH"
        added=1
        added_files+=("$(basename "$TARGET_PATH")")
        echo "Added: $(basename "$TARGET_PATH")"
    fi

# Handle directory sync
elif [[ -d "$SOURCE_PATH" ]]; then
    echo "Syncing directory: $SOURCE_PATH -> $TARGET_PATH"
    echo "Filter pattern: $FILTER_PATTERN"
    echo "Exclude files: $EXCLUDE_FILES"
    
    # Check if source directory has any files
    if [[ -z "$(ls -A "$SOURCE_PATH" 2>/dev/null)" ]]; then
        echo "Warning: Source directory is empty: $SOURCE_PATH"
        # Create empty target to ensure it exists
        mkdir -p "$TARGET_PATH"
        added=0
        updated=0
        deleted=0
    else
        mkdir -p "$TARGET_PATH"
    
    # Create temp directory with normalized source files
    TEMP_SOURCE=$(mktemp -d)
    trap "rm -rf $TEMP_SOURCE" EXIT
    
    echo "Preparing source files..."
    
    # Count source files
    source_count=0
    
    # Process and filter source files into temp directory
    shopt -s nullglob  # Handle case when no .md or .mdx files exist
    for file in "$SOURCE_PATH"/*.md "$SOURCE_PATH"/*.mdx; do
        [[ ! -f "$file" ]] && continue
        
        basename_file=$(basename "$file")
        basename_no_ext="${basename_file%.*}"
        
        # Skip excluded files
        is_excluded "$basename_no_ext" && continue
        
        # Skip if doesn't match pattern
        matches_pattern "$basename_no_ext" "$FILTER_PATTERN" || continue
        
        # Copy to temp with .mdx extension
        cp "$file" "$TEMP_SOURCE/${basename_no_ext}.mdx"
        source_count=$((source_count + 1))
        echo "  Processing: $basename_file"
    done
    shopt -u nullglob
    
    echo "Processed $source_count source files"
    
    # Track existing target files (using simple array for compatibility)
    existing_files=()
    if [[ -d "$TARGET_PATH" ]]; then
        while IFS= read -r file; do
            [[ -n "$file" ]] && existing_files+=("$file")
        done < <(find "$TARGET_PATH" -type f -name "*.mdx" 2>/dev/null)
    fi
    
    # Sync from temp source to target
    for source_file in "$TEMP_SOURCE"/*.mdx; do
        [[ ! -f "$source_file" ]] && continue
        
        basename_file=$(basename "$source_file")
        target_file="$TARGET_PATH/$basename_file"
        
        if [[ -f "$target_file" ]]; then
            if ! cmp -s "$source_file" "$target_file"; then
                cp "$source_file" "$target_file"
                updated=$((updated + 1))
                updated_files+=("$basename_file")
                echo "Updated: $basename_file"
            fi
            # Remove from existing files array
            new_existing=()
            for ef in "${existing_files[@]}"; do
                [[ "$(basename "$ef")" != "$basename_file" ]] && new_existing+=("$ef")
            done
            existing_files=("${new_existing[@]}")
        else
            cp "$source_file" "$target_file"
            added=$((added + 1))
            added_files+=("$basename_file")
            echo "Added: $basename_file"
        fi
    done
    
    # Delete orphaned files (preserve _meta.json)
    for target_file in "${existing_files[@]}"; do
        if [[ -f "$target_file" && "$(basename "$target_file")" != "_meta.json" ]]; then
            rm "$target_file"
            deleted=$((deleted + 1))
            deleted_files+=("$(basename "$target_file")")
            echo "Deleted: $(basename "$target_file")"
        fi
    done
    fi  # End of non-empty directory check
else
    echo "Source not found: $SOURCE_PATH"
    exit 1
fi

# Output metrics
total=$((added + updated + deleted))
echo "added=$added" >> "$GITHUB_OUTPUT"
echo "updated=$updated" >> "$GITHUB_OUTPUT"
echo "deleted=$deleted" >> "$GITHUB_OUTPUT"
echo "total=$total" >> "$GITHUB_OUTPUT"

# Create artifact directory with report and synced files
mkdir -p artifacts

# Create summary report at root of artifacts
REPORT_FILE="artifacts/sync_report_${TYPE}.md"
cat > "$REPORT_FILE" <<EOF
## ${TITLE}

### Summary
- **Added**: $added files
- **Updated**: $updated files  
- **Deleted**: $deleted files
- **Total changes**: $total

### Synced Files Location
Path: \`${TARGET_PATH}\`
EOF

# Add file lists to report
if [[ ${#added_files[@]} -gt 0 ]]; then
    echo "" >> "$REPORT_FILE"
    echo "### Added Files" >> "$REPORT_FILE"
    for file in "${added_files[@]}"; do
        echo "- $file" >> "$REPORT_FILE"
    done
fi

if [[ ${#updated_files[@]} -gt 0 ]]; then
    echo "" >> "$REPORT_FILE"
    echo "### Updated Files" >> "$REPORT_FILE"
    for file in "${updated_files[@]}"; do
        echo "- $file" >> "$REPORT_FILE"
    done
fi

if [[ ${#deleted_files[@]} -gt 0 ]]; then
    echo "" >> "$REPORT_FILE"
    echo "### Deleted Files" >> "$REPORT_FILE"
    for file in "${deleted_files[@]}"; do
        echo "- $file" >> "$REPORT_FILE"
    done
fi

# Copy whatever is in target to artifacts
if [[ -f "$TARGET_PATH" ]]; then
    # Single file
    mkdir -p "artifacts/$(dirname "$TARGET_PATH")"
    cp "$TARGET_PATH" "artifacts/${TARGET_PATH}"
    
elif [[ -d "$TARGET_PATH" ]]; then
    # Directory - just copy everything
    mkdir -p "artifacts/${TARGET_PATH}"
    cp -r "$TARGET_PATH"/* "artifacts/${TARGET_PATH}/" 2>/dev/null || true
fi

echo "Sync completed: $total changes"
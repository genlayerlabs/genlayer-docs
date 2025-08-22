#!/bin/bash
set -e

echo "🔍 SYNC SCRIPT STARTED"
echo "🔍 Script: $0"
echo "🔍 Args: $*"
echo "🔍 Arg count: $#"
echo "🔍 PWD: $(pwd)"
echo "🔍 RUNNER_TEMP: ${RUNNER_TEMP:-not set}"
echo "🔍 GITHUB_OUTPUT: ${GITHUB_OUTPUT:-not set}"
echo "🔍 Bash version: $BASH_VERSION"
echo "🔍 Shell: $0"

# Unified file synchronization script
# Handles all sync types: changelog, config, api_gen, api_debug, api_ops
# Can be used as a library (sourced) or executed directly with arguments

# Set default temp directory if RUNNER_TEMP is not available (for local testing)
if [[ -z "${RUNNER_TEMP:-}" ]]; then
    RUNNER_TEMP="${TMPDIR:-/tmp}"
    echo "🔍 Set RUNNER_TEMP to: $RUNNER_TEMP"
fi

# Set default output file if GITHUB_OUTPUT is not available (for local testing)
if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
    GITHUB_OUTPUT="${TMPDIR:-/tmp}/github_output.txt"
    # Create the file if it doesn't exist
    touch "$GITHUB_OUTPUT"
    echo "🔍 Set GITHUB_OUTPUT to: $GITHUB_OUTPUT"
fi

# Pattern matching function (supports both perl and grep fallback)
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

# Generic file synchronization function
sync_files() {
    echo "🔍 SYNC_FILES FUNCTION STARTED"
    echo "🔍 sync_files args: $*"
    
    local source_path="$1"
    local dest_path="$2"
    local file_filter="$3"
    local sync_type="$4"
    local report_file="$5"
    
    echo "🔍 source_path: $source_path"
    echo "🔍 dest_path: $dest_path"
    echo "🔍 file_filter: $file_filter"
    echo "🔍 sync_type: $sync_type"
    echo "🔍 report_file: $report_file"
    
    # Get proper title for sync type
    echo "🔍 Getting sync title for: $sync_type"
    local sync_title
    case "$sync_type" in
        "changelog") sync_title="Changelog" ;;
        "config") sync_title="Config File" ;;
        "api_gen") sync_title="API Gen Methods" ;;
        "api_debug") sync_title="API Debug Methods" ;;
        "api_ops") sync_title="API Ops Methods" ;;
        *) sync_title="$(echo "$sync_type" | tr '[:lower:]' '[:upper:]')" ;;
    esac
    echo "🔍 sync_title resolved to: $sync_title"
    echo "🔍 Writing to report_file: $report_file"
    echo "## ${sync_title} Sync" >> "$report_file"
    echo "🔍 Successfully wrote title to report file"
    echo "🔍 Checking file_filter: $file_filter"
    if [[ "$file_filter" != ".*" ]]; then
        echo "🔍 Writing filter info to report"
        printf "Using regex filter: \`%s\`\n" "$file_filter" >> "$report_file"
        echo "🔍 Filter info written"
    else
        echo "🔍 No filter info needed (filter is .*)"
    fi
    echo "🔍 Adding empty line to report"
    echo "" >> "$report_file"
    echo "🔍 Empty line added"
    
    echo "🔍 Checking if source directory exists: $source_path"
    echo "🔍 Testing directory with simple test command"
    test -d "$source_path"
    echo "🔍 Test result: $?"
    echo "🔍 About to run if statement: [ ! -d \"$source_path\" ]"
    
    if [ ! -d "$source_path" ]; then
        echo "🔍 BRANCH: Source directory does not exist"
        # Use simpler path substitution to avoid parameter expansion issues
        local short_path=$(echo "$source_path" | sed 's|^source-repo/||')
        echo "- Source directory not found: \`$short_path\`" >> "$report_file"
        echo "added=0" >> "$GITHUB_OUTPUT"
        echo "updated=0" >> "$GITHUB_OUTPUT"
        echo "deleted=0" >> "$GITHUB_OUTPUT"
        echo "total=0" >> "$GITHUB_OUTPUT"
        echo "🔍 Returning from missing directory branch"
        return 0
    else
        echo "🔍 BRANCH: Source directory EXISTS - proceeding with sync"
    fi
    
    echo "🔍 Creating destination directory: $dest_path"
    mkdir -p "$dest_path"
    echo "🔍 Destination directory created"
    
    # Track existing files before sync
    echo "🔍 About to declare associative array"
    declare -A existing_files
    echo "🔍 Associative array declared successfully"
    echo "🔍 Finding existing files in: $dest_path"
    
    # Use temporary file to avoid process substitution issues
    local temp_file="${RUNNER_TEMP}/existing_files_$$"
    if [ -d "$dest_path" ]; then
        find "$dest_path" -name "*.mdx" -type f 2>/dev/null > "$temp_file" || true
        echo "🔍 Found files written to temp file"
        
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                existing_files["$(basename "$file")"]="$file"
                echo "🔍 Tracked existing file: $(basename "$file")"
            fi
        done < "$temp_file"
        
        rm -f "$temp_file"
    fi
    echo "🔍 Finished tracking existing files"
    echo "🔍 DEBUG: About to initialize counters"
    
    # Track what we'll be syncing
    echo "🔍 Initializing counters"
    echo "🔍 DEBUG: Declaring local variables"
    local added=0
    echo "🔍 DEBUG: added variable declared"
    local updated=0
    echo "🔍 DEBUG: updated variable declared"
    local deleted=0
    echo "🔍 DEBUG: deleted variable declared"
    echo "🔍 Counters initialized: added=$added updated=$updated deleted=$deleted"
    echo "🔍 DEBUG: About to start file processing loop"
    echo "🔍 DEBUG: Will look for files in: $source_path"
    echo "🔍 DEBUG: Expanding glob patterns: $source_path/*.mdx $source_path/*.md"
    
    # Process all source files that match the filter
    echo "🔍 DEBUG: Starting for loop"
    for file in "$source_path"/*.mdx "$source_path"/*.md; do
        echo "🔍 DEBUG: Processing file: $file"
        [ ! -f "$file" ] && echo "🔍 DEBUG: File does not exist, continuing" && continue
        echo "🔍 DEBUG: File exists, proceeding with processing"
        
        echo "🔍 DEBUG: About to extract basename without extension"
        local basename_no_ext
        basename_no_ext=$(basename "$file" | sed 's/\.[^.]*$//')
        echo "🔍 DEBUG: basename_no_ext=$basename_no_ext"
        
        echo "🔍 DEBUG: About to check if filename matches filter"
        echo "🔍 DEBUG: Calling matches_pattern with args: '$basename_no_ext' '$file_filter'"
        # Check if filename matches the filter
        if matches_pattern "$basename_no_ext" "$file_filter"; then
            echo "🔍 DEBUG: File matches filter, proceeding"
            echo "🔍 DEBUG: Line 173 reached"
            local dest_filename="${basename_no_ext}.mdx"
            echo "🔍 DEBUG: Line 175 reached - dest_filename=$dest_filename"
            local dest_file_path="$dest_path/$dest_filename"
            echo "🔍 DEBUG: Line 177 reached - dest_file_path=$dest_file_path"
            
            echo "🔍 DEBUG: Line 179 reached - about to check if file exists"
            if [ -f "$dest_file_path" ]; then
                echo "🔍 DEBUG: Line 181 reached - file exists, checking differences"
                # File exists - check if it's different
                if ! cmp -s "$file" "$dest_file_path"; then
                    echo "🔍 DEBUG: Line 184 reached - files different, copying"
                    cp "$file" "$dest_file_path"
                    echo "🔍 DEBUG: Line 186 reached - copy complete, updating report"
                    echo "- Updated: \`$dest_filename\`" >> "$report_file"
                    echo "🔍 DEBUG: Line 188 reached - report updated, incrementing counter"
                    updated=$((updated + 1))
                    echo "🔍 DEBUG: Line 190 reached - counter incremented"
                fi
                echo "🔍 DEBUG: Line 192 reached - removing from tracking"
                # Remove from tracking to identify deletions later
                unset existing_files["$dest_filename"]
                echo "🔍 DEBUG: Line 195 reached - removed from tracking"
            else
                echo "🔍 DEBUG: Line 197 reached - new file, copying"
                # New file
                cp "$file" "$dest_file_path"
                echo "🔍 DEBUG: Line 200 reached - copy complete, updating report"
                echo "- Added: \`$dest_filename\`" >> "$report_file"
                echo "🔍 DEBUG: Line 202 reached - report updated, incrementing counter"
                added=$((added + 1))
                echo "🔍 DEBUG: Line 204 reached - counter incremented"
            fi
            echo "🔍 DEBUG: Line 206 reached - end of if block"
        fi
        echo "🔍 DEBUG: End of file processing iteration"
    done
    echo "🔍 DEBUG: Completed for loop - all files processed"
    
    echo "🔍 DEBUG: About to skip _meta.json handling"
    # Skip _meta.json handling - it should not be touched
    unset existing_files["_meta.json"]
    echo "🔍 DEBUG: Skipped _meta.json handling"
    
    echo "🔍 DEBUG: About to start deletion loop"
    echo "🔍 DEBUG: Checking if existing_files array has elements"
    
    # Remove files that no longer exist in source or don't match the filter
    # Check if array has elements first to avoid expansion issues
    if [ ${#existing_files[@]} -gt 0 ]; then
        echo "🔍 DEBUG: Array has ${#existing_files[@]} elements, starting iteration"
        for dest_file in "${existing_files[@]}"; do
            echo "🔍 DEBUG: Processing existing file for potential deletion: $dest_file"
        if [ -f "$dest_file" ]; then
            local dest_basename_no_ext
            dest_basename_no_ext=$(basename "$dest_file" | sed 's/\.[^.]*$//')
            
            # Check if the file should still exist based on source and filter
            local source_exists=false
            if [ -f "$source_path/${dest_basename_no_ext}.mdx" ] || [ -f "$source_path/${dest_basename_no_ext}.md" ]; then
                # Source exists, check if it matches the filter
                if matches_pattern "$dest_basename_no_ext" "$file_filter"; then
                    source_exists=true
                fi
            fi
            
            if [ "$source_exists" = "false" ]; then
                rm "$dest_file"
                printf -- "- Deleted: \`%s\`\n" "$(basename "$dest_file")" >> "$report_file"
                deleted=$((deleted + 1))
            fi
        fi
        done
        echo "🔍 DEBUG: Completed deletion loop iteration"
    else
        echo "🔍 DEBUG: No existing files to process for deletion"
    fi
    echo "🔍 DEBUG: Completed deletion loop processing"
    
    # Summary
    local total=$((added + updated + deleted))
    if [ $total -eq 0 ]; then
        echo "- No ${sync_type} updates found" >> "$report_file"
    else
        echo "" >> "$report_file"
        echo "Summary: $added added, $updated updated, $deleted deleted" >> "$report_file"
    fi
    
    # Output metrics to GitHub Actions
    echo "added=$added" >> "$GITHUB_OUTPUT"
    echo "updated=$updated" >> "$GITHUB_OUTPUT"
    echo "deleted=$deleted" >> "$GITHUB_OUTPUT"
    echo "total=$total" >> "$GITHUB_OUTPUT"
    
    # Store total changes for aggregation
    echo "$total" > "${RUNNER_TEMP}/changes_${sync_type}.txt"
}

# Main orchestrator function to handle different sync types
main() {
    echo "🔍 MAIN FUNCTION STARTED"
    echo "🔍 Received args: $*"
    
    local sync_type="$1"
    local version="$2"
    local sync_report="${RUNNER_TEMP}/sync_report_${sync_type}.md"
    
    echo "🔍 sync_type: $sync_type"
    echo "🔍 version: $version"
    echo "🔍 sync_report: $sync_report"
    
    # Get input parameters (with defaults)
    local changelog_path="${3:-docs/changelog}"
    local api_gen_path="${4:-docs/api/rpc}"
    local api_debug_path="${5:-docs/api/rpc}"
    local api_ops_path="${6:-docs/api/ops}"
    local api_gen_regex="${7:-gen_(?!dbg_).*}"
    local api_debug_regex="${8:-gen_dbg_.*}"
    
    echo "🔍 Starting case statement for sync_type: $sync_type"
    
    case "$sync_type" in
        "changelog")
            echo "🔍 Processing changelog sync"
            sync_changelog "$changelog_path" "$sync_report"
            ;;
        "config")
            echo "🔍 Processing config sync"
            sync_config "$sync_report"
            ;;
        "api_gen")
            echo "🔍 Processing api_gen sync"
            sync_files "source-repo/$api_gen_path" "pages/api-references/genlayer-node/gen" "$api_gen_regex" "api_gen" "$sync_report"
            ;;
        "api_debug")
            echo "🔍 Processing api_debug sync"
            sync_files "source-repo/$api_debug_path" "pages/api-references/genlayer-node/debug" "$api_debug_regex" "api_debug" "$sync_report"
            ;;
        "api_ops")
            echo "🔍 Processing api_ops sync"
            sync_files "source-repo/$api_ops_path" "pages/api-references/genlayer-node/ops" ".*" "api_ops" "$sync_report"
            ;;
        *)
            echo "::error::Unknown sync type: $sync_type"
            exit 1
            ;;
    esac
    
    echo "🔍 Case statement completed"
    
    # Create artifacts
    create_sync_artifacts "$sync_type" "$sync_report"
}

# Changelog sync function
sync_changelog() {
    local changelog_path="$1"
    local sync_report="$2"
    
    sync_files "source-repo/$changelog_path" "content/validators/changelog" ".*" "changelog" "$sync_report"
}

# Config sync function
sync_config() {
    local sync_report="$1"
    local source_file="source-repo/configs/node/config.yaml.example"
    local dest_file="content/validators/config.yaml"
    
    echo "## Config Sync" >> "$sync_report"
    echo "" >> "$sync_report"
    
    if [[ -f "$source_file" ]]; then
        mkdir -p "$(dirname "$dest_file")"
        
        if [ -f "$dest_file" ]; then
            if ! cmp -s "$source_file" "$dest_file"; then
                cp "$source_file" "$dest_file"
                echo "- Updated: \`config.yaml\`" >> "$sync_report"
                echo "added=0" >> "$GITHUB_OUTPUT"
                echo "updated=1" >> "$GITHUB_OUTPUT"
                echo "deleted=0" >> "$GITHUB_OUTPUT"
                echo "total=1" >> "$GITHUB_OUTPUT"
                echo "1" > "${RUNNER_TEMP}/changes_config.txt"
            else
                echo "- No config updates needed" >> "$sync_report"
                echo "added=0" >> "$GITHUB_OUTPUT"
                echo "updated=0" >> "$GITHUB_OUTPUT"
                echo "deleted=0" >> "$GITHUB_OUTPUT"
                echo "total=0" >> "$GITHUB_OUTPUT"
                echo "0" > "${RUNNER_TEMP}/changes_config.txt"
            fi
        else
            cp "$source_file" "$dest_file"
            echo "- Added: \`config.yaml\`" >> "$sync_report"
            echo "added=1" >> "$GITHUB_OUTPUT"
            echo "updated=0" >> "$GITHUB_OUTPUT"
            echo "deleted=0" >> "$GITHUB_OUTPUT"
            echo "total=1" >> "$GITHUB_OUTPUT"
            echo "1" > "${RUNNER_TEMP}/changes_config.txt"
        fi
    else
        echo "- Source config file not found: $source_file" >> "$sync_report"
        echo "added=0" >> "$GITHUB_OUTPUT"
        echo "updated=0" >> "$GITHUB_OUTPUT"
        echo "deleted=0" >> "$GITHUB_OUTPUT"
        echo "total=0" >> "$GITHUB_OUTPUT"
        echo "0" > "${RUNNER_TEMP}/changes_config.txt"
    fi
}

# Create sync artifacts
create_sync_artifacts() {
    local sync_type="$1"
    local report_file="$2"
    
    if [[ -f "$report_file" ]]; then
        # Create artifacts directory
        mkdir -p artifacts
        cp "$report_file" "artifacts/sync_report_${sync_type}.md"
        echo "📄 Created artifact: artifacts/sync_report_${sync_type}.md"
    else
        echo "⚠️ Report file not found, creating empty artifact"
        mkdir -p artifacts
        local sync_title
        case "$sync_type" in
            "changelog") sync_title="Changelog" ;;
            "config") sync_title="Config File" ;;
            "api_gen") sync_title="API Gen Methods" ;;
            "api_debug") sync_title="API Debug Methods" ;;
            "api_ops") sync_title="API Ops Methods" ;;
            *) sync_title="$(echo "$sync_type" | tr '[:lower:]' '[:upper:]')" ;;
        esac
        echo "## ${sync_title} Sync" > "artifacts/sync_report_${sync_type}.md"
        echo "" >> "artifacts/sync_report_${sync_type}.md"
        echo "No sync operations performed." >> "artifacts/sync_report_${sync_type}.md"
    fi
}

# If script is called directly (not sourced), run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
#!/bin/bash
set -eo pipefail

echo "🔍 SYNC SCRIPT STARTED"
echo "🔍 Script: $0"
echo "🔍 Args: $*"
echo "🔍 Arg count: $#"
echo "🔍 PWD: $(pwd)"
echo "🔍 RUNNER_TEMP: ${RUNNER_TEMP:-not set}"
echo "🔍 GITHUB_OUTPUT: ${GITHUB_OUTPUT:-not set}"

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
    if [ ! -d "$source_path" ]; then
        echo "🔍 Source directory does not exist"
        echo "- Source directory not found: \`${source_path#source-repo/}\`" >> "$report_file"
        echo "added=0" >> "$GITHUB_OUTPUT"
        echo "updated=0" >> "$GITHUB_OUTPUT"
        echo "deleted=0" >> "$GITHUB_OUTPUT"
        echo "total=0" >> "$GITHUB_OUTPUT"
        return 0
    fi
    
    mkdir -p "$dest_path"
    
    # Track existing files before sync
    declare -A existing_files
    while IFS= read -r file; do
        [[ -n "$file" ]] && existing_files["$(basename "$file")"]="$file"
    done < <(find "$dest_path" -name "*.mdx" -type f 2>/dev/null || true)
    
    # Track what we'll be syncing
    local added=0 updated=0 deleted=0
    
    # Process all source files that match the filter
    for file in "$source_path"/*.mdx "$source_path"/*.md; do
        [ ! -f "$file" ] && continue
        
        local basename_no_ext
        basename_no_ext=$(basename "$file" | sed 's/\.[^.]*$//')
        
        # Check if filename matches the filter
        if matches_pattern "$basename_no_ext" "$file_filter"; then
            local dest_filename="${basename_no_ext}.mdx"
            local dest_file_path="$dest_path/$dest_filename"
            
            if [ -f "$dest_file_path" ]; then
                # File exists - check if it's different
                if ! cmp -s "$file" "$dest_file_path"; then
                    cp "$file" "$dest_file_path"
                    echo "- Updated: \`$dest_filename\`" >> "$report_file"
                    ((updated++))
                fi
                # Remove from tracking to identify deletions later
                unset existing_files["$dest_filename"]
            else
                # New file
                cp "$file" "$dest_file_path"
                echo "- Added: \`$dest_filename\`" >> "$report_file"
                ((added++))
            fi
        fi
    done
    
    # Skip _meta.json handling - it should not be touched
    unset existing_files["_meta.json"]
    
    # Remove files that no longer exist in source or don't match the filter
    for dest_file in "${existing_files[@]}"; do
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
                ((deleted++))
            fi
        fi
    done
    
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
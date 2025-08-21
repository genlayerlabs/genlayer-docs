#!/bin/bash
set -euo pipefail

# Aggregate sync reports and calculate totals
# Used by the GitHub Actions workflow to process sync results

# Set default output file if GITHUB_OUTPUT is not available (for local testing)
if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
    GITHUB_OUTPUT="${TMPDIR:-/tmp}/github_output.txt"
    # Create the file if it doesn't exist
    touch "$GITHUB_OUTPUT"
fi

aggregate_sync_reports() {
    # Initialize counters
    local TOTAL_CHANGES=0
    local TOTAL_ADDED=0
    local TOTAL_UPDATED=0
    local TOTAL_DELETED=0
    
    # Collect all reports
    local ALL_REPORTS=""
    
    echo "🔍 Looking for sync reports..."
    if [[ -d "sync-reports" ]]; then
        echo "📁 sync-reports directory exists"
        ls -la sync-reports/ || echo "Directory is empty"
        
        for report_file in sync-reports/sync_report_*.md; do
            if [[ -f "$report_file" ]]; then
                echo "📄 Processing: $(basename "$report_file")"
                
                # Extract metrics from report content
                local REPORT_CONTENT
                REPORT_CONTENT=$(cat "$report_file")
                
                # Look for summary line: "Summary: X added, Y updated, Z deleted"
                if echo "$REPORT_CONTENT" | grep -q "Summary:"; then
                    local SUMMARY_LINE
                    SUMMARY_LINE=$(echo "$REPORT_CONTENT" | grep "Summary:" | head -1)
                    echo "📊 Found summary: $SUMMARY_LINE"
                    
                    # Extract numbers using regex
                    local ADDED UPDATED DELETED
                    ADDED=$(echo "$SUMMARY_LINE" | grep -o '[0-9]\+ added' | grep -o '[0-9]\+' || echo "0")
                    UPDATED=$(echo "$SUMMARY_LINE" | grep -o '[0-9]\+ updated' | grep -o '[0-9]\+' || echo "0")
                    DELETED=$(echo "$SUMMARY_LINE" | grep -o '[0-9]\+ deleted' | grep -o '[0-9]\+' || echo "0")
                    
                    # Add to totals
                    TOTAL_ADDED=$((TOTAL_ADDED + ADDED))
                    TOTAL_UPDATED=$((TOTAL_UPDATED + UPDATED))
                    TOTAL_DELETED=$((TOTAL_DELETED + DELETED))
                    
                    local REPORT_TOTAL=$((ADDED + UPDATED + DELETED))
                    TOTAL_CHANGES=$((TOTAL_CHANGES + REPORT_TOTAL))
                    
                    echo "📈 Report metrics: $ADDED added, $UPDATED updated, $DELETED deleted (total: $REPORT_TOTAL)"
                elif echo "$REPORT_CONTENT" | grep -q "No.*updates found"; then
                    echo "📝 No changes in this sync type"
                    # Don't add anything to totals
                else
                    echo "⚠️ Could not parse metrics from report, assuming 1 change"
                    TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
                fi
                
                # Append report content
                if [[ -n "$ALL_REPORTS" ]]; then
                    ALL_REPORTS="$ALL_REPORTS"$'\n\n---\n\n'
                fi
                ALL_REPORTS="$ALL_REPORTS$REPORT_CONTENT"
            else
                echo "⚠️ No report files found matching pattern"
            fi
        done
    else
        echo "⚠️ sync-reports directory not found, using simple aggregation"
        # Simple fallback - assume basic operation succeeded
        ALL_REPORTS="## Sync Results"$'\n\nDocumentation sync completed successfully.\n\n'
    fi
    
    # Output results to GitHub Actions
    echo "total_changes=$TOTAL_CHANGES" >> "$GITHUB_OUTPUT"
    echo "total_added=$TOTAL_ADDED" >> "$GITHUB_OUTPUT" 
    echo "total_updated=$TOTAL_UPDATED" >> "$GITHUB_OUTPUT"
    echo "total_deleted=$TOTAL_DELETED" >> "$GITHUB_OUTPUT"
    
    # Handle multiline output for reports
    echo "all_reports<<EOF" >> "$GITHUB_OUTPUT"
    echo "$ALL_REPORTS" >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"
    
    echo "📊 Aggregated totals: $TOTAL_CHANGES changes ($TOTAL_ADDED added, $TOTAL_UPDATED updated, $TOTAL_DELETED deleted)"
}

# Run the aggregation
aggregate_sync_reports
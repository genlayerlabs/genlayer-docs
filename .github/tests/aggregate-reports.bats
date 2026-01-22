#!/usr/bin/env bats

# Unit tests for aggregate-reports.sh

setup() {
    export TEST_DIR=$(mktemp -d)
    export SCRIPT_PATH="$BATS_TEST_DIRNAME/../scripts/aggregate-reports.sh"
    export GITHUB_OUTPUT=$(mktemp)
    
    # Create sync-reports directory
    mkdir -p "$TEST_DIR/sync-reports"
    
    # Change to test directory
    cd "$TEST_DIR"
}

teardown() {
    rm -rf "$TEST_DIR"
    rm -f "$GITHUB_OUTPUT"
}

# ============================================
# Tests for aggregate_sync_reports()
# ============================================

@test "aggregate-reports: calculates totals from single report" {
    cat > "$TEST_DIR/sync-reports/sync_report_changelog.md" <<EOF
## Changelog

### Summary
- **Added**: 3 files
- **Updated**: 2 files
- **Deleted**: 1 files
- **Total changes**: 6
EOF
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Check totals
    run grep "total_changes=6" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_added=3" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_updated=2" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_deleted=1" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: aggregates multiple reports" {
    cat > "$TEST_DIR/sync-reports/sync_report_changelog.md" <<EOF
## Changelog

### Summary
- **Added**: 2 files
- **Updated**: 1 files
- **Deleted**: 0 files
- **Total changes**: 3
EOF

    cat > "$TEST_DIR/sync-reports/sync_report_api_gen.md" <<EOF
## API Gen

### Summary
- **Added**: 5 files
- **Updated**: 3 files
- **Deleted**: 2 files
- **Total changes**: 10
EOF
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Check aggregated totals (2+5=7 added, 1+3=4 updated, 0+2=2 deleted, 3+10=13 total)
    run grep "total_changes=13" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_added=7" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_updated=4" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_deleted=2" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: handles report with no changes" {
    cat > "$TEST_DIR/sync-reports/sync_report_config.md" <<EOF
## Config

### Summary
- **Added**: 0 files
- **Updated**: 0 files
- **Deleted**: 0 files
- **Total changes**: 0
EOF
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    run grep "total_changes=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: handles missing sync-reports directory" {
    rm -rf "$TEST_DIR/sync-reports"
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Should output zeros
    run grep "total_changes=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: handles empty sync-reports directory" {
    # Directory exists but is empty
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    run grep "total_changes=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: handles report with 'No updates found' message" {
    cat > "$TEST_DIR/sync-reports/sync_report_config.md" <<EOF
## Config

No config updates found
EOF
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Should not count this as a change
    run grep "total_changes=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: outputs all_reports multiline content" {
    cat > "$TEST_DIR/sync-reports/sync_report_test.md" <<EOF
## Test Report

### Summary
- **Added**: 1 files
- **Updated**: 0 files
- **Deleted**: 0 files
- **Total changes**: 1

### Added Files
- test_file.mdx
EOF
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Check that all_reports is in the output
    run grep "all_reports<<EOF" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "aggregate-reports: handles all six sync types" {
    for sync_type in changelog config docker_compose api_gen api_debug api_ops; do
        cat > "$TEST_DIR/sync-reports/sync_report_${sync_type}.md" <<EOF
## ${sync_type}

### Summary
- **Added**: 1 files
- **Updated**: 1 files
- **Deleted**: 0 files
- **Total changes**: 2
EOF
    done
    
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    
    # Total should be 6 types * 2 changes each = 12
    run grep "total_changes=12" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_added=6" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    
    run grep "total_updated=6" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

#!/usr/bin/env bats

# Unit tests for sync.sh (the core file synchronization script)

setup() {
    export TEST_DIR=$(mktemp -d)
    export SCRIPT_PATH="$BATS_TEST_DIRNAME/../actions/sync-files/sync.sh"
    export GITHUB_OUTPUT=$(mktemp)
    
    # Create source and target directories
    mkdir -p "$TEST_DIR/source"
    mkdir -p "$TEST_DIR/target"
    mkdir -p "$TEST_DIR/artifacts"
}

teardown() {
    rm -rf "$TEST_DIR"
    rm -f "$GITHUB_OUTPUT"
}

# ============================================
# Tests for single file sync
# ============================================

@test "sync: adds new single file" {
    echo "content" > "$TEST_DIR/source/file.yaml"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source/file.yaml" "$TEST_DIR/target/file.yaml" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check file was copied
    [ -f "$TEST_DIR/target/file.yaml" ]
    
    # Check metrics
    run grep "added=1" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: updates existing single file when content differs" {
    echo "old content" > "$TEST_DIR/target/file.yaml"
    echo "new content" > "$TEST_DIR/source/file.yaml"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source/file.yaml" "$TEST_DIR/target/file.yaml" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check file was updated
    run cat "$TEST_DIR/target/file.yaml"
    [ "$output" = "new content" ]
    
    # Check metrics
    run grep "updated=1" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: does not update file when content is same" {
    echo "same content" > "$TEST_DIR/source/file.yaml"
    echo "same content" > "$TEST_DIR/target/file.yaml"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source/file.yaml" "$TEST_DIR/target/file.yaml" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check metrics show no changes
    run grep "updated=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
    run grep "added=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

# ============================================
# Tests for directory sync
# ============================================

@test "sync: adds new files from directory" {
    echo "content1" > "$TEST_DIR/source/file1.mdx"
    echo "content2" > "$TEST_DIR/source/file2.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check files were copied
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ -f "$TEST_DIR/target/file2.mdx" ]
    
    # Check metrics
    run grep "added=2" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: updates changed files in directory" {
    echo "old content" > "$TEST_DIR/target/file1.mdx"
    echo "new content" > "$TEST_DIR/source/file1.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check file was updated
    run cat "$TEST_DIR/target/file1.mdx"
    [ "$output" = "new content" ]
    
    # Check metrics
    run grep "updated=1" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: deletes orphaned files from target" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    echo "orphan" > "$TEST_DIR/target/orphan.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check orphan was deleted
    [ ! -f "$TEST_DIR/target/orphan.mdx" ]
    
    # Check metrics
    run grep "deleted=1" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: preserves _meta.json file" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    echo '{"file1": "File 1"}' > "$TEST_DIR/target/_meta.json"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check _meta.json was preserved
    [ -f "$TEST_DIR/target/_meta.json" ]
}

# ============================================
# Tests for pattern filtering
# ============================================

@test "sync: filters files by pattern - includes matching" {
    echo "gen content" > "$TEST_DIR/source/gen_method.mdx"
    echo "other content" > "$TEST_DIR/source/other_method.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" "gen_.*" ""
    [ "$status" -eq 0 ]
    
    # Check only matching file was copied
    [ -f "$TEST_DIR/target/gen_method.mdx" ]
    [ ! -f "$TEST_DIR/target/other_method.mdx" ]
}

@test "sync: filters files by pattern - excludes non-matching" {
    echo "content1" > "$TEST_DIR/source/gen_call.mdx"
    echo "content2" > "$TEST_DIR/source/gen_send.mdx"
    echo "content3" > "$TEST_DIR/source/eth_call.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" "gen_.*" ""
    [ "$status" -eq 0 ]
    
    # Check only gen_ files were copied
    [ -f "$TEST_DIR/target/gen_call.mdx" ]
    [ -f "$TEST_DIR/target/gen_send.mdx" ]
    [ ! -f "$TEST_DIR/target/eth_call.mdx" ]
}

@test "sync: handles .* pattern (match all)" {
    echo "content1" > "$TEST_DIR/source/file1.mdx"
    echo "content2" > "$TEST_DIR/source/file2.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check all files were copied
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ -f "$TEST_DIR/target/file2.mdx" ]
}

# ============================================
# Tests for file exclusions
# ============================================

@test "sync: excludes README files" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    echo "readme" > "$TEST_DIR/source/README.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" "README"
    [ "$status" -eq 0 ]
    
    # Check README was excluded
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ ! -f "$TEST_DIR/target/README.mdx" ]
}

@test "sync: excludes multiple files" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    echo "readme" > "$TEST_DIR/source/README.mdx"
    echo "changelog" > "$TEST_DIR/source/CHANGELOG.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" "README,CHANGELOG"
    [ "$status" -eq 0 ]
    
    # Check excluded files were not copied
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ ! -f "$TEST_DIR/target/README.mdx" ]
    [ ! -f "$TEST_DIR/target/CHANGELOG.mdx" ]
}

@test "sync: default exclusions work" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    echo "readme" > "$TEST_DIR/source/README.mdx"
    echo "changelog" > "$TEST_DIR/source/CHANGELOG.mdx"
    echo "gitignore" > "$TEST_DIR/source/.gitignore.mdx"
    
    # Use default exclusions
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" "README,CHANGELOG,.gitignore,.gitkeep"
    [ "$status" -eq 0 ]
    
    # Check only file1 was copied
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ ! -f "$TEST_DIR/target/README.mdx" ]
    [ ! -f "$TEST_DIR/target/CHANGELOG.mdx" ]
}

# ============================================
# Tests for .md to .mdx conversion
# ============================================

@test "sync: converts .md files to .mdx" {
    echo "markdown content" > "$TEST_DIR/source/file.md"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check file was converted to .mdx
    [ -f "$TEST_DIR/target/file.mdx" ]
    [ ! -f "$TEST_DIR/target/file.md" ]
}

@test "sync: handles mixed .md and .mdx files" {
    echo "md content" > "$TEST_DIR/source/file1.md"
    echo "mdx content" > "$TEST_DIR/source/file2.mdx"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check both files exist as .mdx
    [ -f "$TEST_DIR/target/file1.mdx" ]
    [ -f "$TEST_DIR/target/file2.mdx" ]
}

# ============================================
# Tests for report generation
# ============================================

@test "sync: generates sync report" {
    echo "content" > "$TEST_DIR/source/file1.mdx"
    
    cd "$TEST_DIR"
    run bash "$SCRIPT_PATH" "test_type" "Test Title" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check report was created
    [ -f "artifacts/sync_report_test_type.md" ]
    
    # Check report contains expected content
    run grep "Test Title" "artifacts/sync_report_test_type.md"
    [ "$status" -eq 0 ]
    
    run grep "Added" "artifacts/sync_report_test_type.md"
    [ "$status" -eq 0 ]
}

# ============================================
# Tests for error handling
# ============================================

@test "sync: fails when source does not exist" {
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/nonexistent" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 1 ]
    [[ "$output" == *"Source not found"* ]]
}

@test "sync: handles empty source directory" {
    # Source directory exists but is empty
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check metrics show no changes
    run grep "total=0" "$GITHUB_OUTPUT"
    [ "$status" -eq 0 ]
}

@test "sync: does not delete when source has no matching files" {
    # Create target file
    echo "existing" > "$TEST_DIR/target/existing.mdx"
    
    # Source has no .md or .mdx files
    echo "not markdown" > "$TEST_DIR/source/file.txt"
    
    run bash "$SCRIPT_PATH" "test" "Test" "$TEST_DIR/source" "$TEST_DIR/target" ".*" ""
    [ "$status" -eq 0 ]
    
    # Check existing file was NOT deleted (safety feature)
    [ -f "$TEST_DIR/target/existing.mdx" ]
}

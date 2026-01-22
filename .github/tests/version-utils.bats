#!/usr/bin/env bats

# Unit tests for version-utils.sh

setup() {
    # Load the script functions
    source "$BATS_TEST_DIRNAME/../scripts/version-utils.sh" 2>/dev/null || true
    
    # Create temp directory for test outputs
    export GITHUB_OUTPUT=$(mktemp)
}

teardown() {
    rm -f "$GITHUB_OUTPUT"
}

# ============================================
# Tests for validate_version()
# ============================================

@test "validate_version: accepts 'latest'" {
    run validate_version "latest"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts simple semver v1.0.0" {
    run validate_version "v1.0.0"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts v0.4.3" {
    run validate_version "v0.4.3"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts v10.20.30" {
    run validate_version "v10.20.30"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts prerelease v1.2.3-rc.1" {
    run validate_version "v1.2.3-rc.1"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts prerelease v1.2.3-alpha.2" {
    run validate_version "v1.2.3-alpha.2"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts prerelease v1.2.3-beta.1" {
    run validate_version "v1.2.3-beta.1"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts build metadata v1.2.3+build.7" {
    run validate_version "v1.2.3+build.7"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts full semver v1.2.3-beta.1+exp.sha.5114f85" {
    run validate_version "v1.2.3-beta.1+exp.sha.5114f85"
    [ "$status" -eq 0 ]
}

@test "validate_version: accepts testnet version v0.4.0-testnet123" {
    run validate_version "v0.4.0-testnet123"
    [ "$status" -eq 0 ]
}

@test "validate_version: rejects version without v prefix" {
    run validate_version "1.0.0"
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects invalid format 'main'" {
    run validate_version "main"
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects invalid format 'release-1.0'" {
    run validate_version "release-1.0"
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects empty string" {
    run validate_version ""
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects version with only two parts v1.0" {
    run validate_version "v1.0"
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects version with four parts v1.0.0.0" {
    run validate_version "v1.0.0.0"
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects version with spaces" {
    run validate_version "v1.0.0 "
    [ "$status" -eq 1 ]
}

@test "validate_version: rejects version with leading space" {
    run validate_version " v1.0.0"
    [ "$status" -eq 1 ]
}

#!/usr/bin/env bats

# Unit tests for sanitize-docker-compose.sh

setup() {
    export TEST_DIR=$(mktemp -d)
    export SCRIPT_PATH="$BATS_TEST_DIRNAME/../scripts/sanitize-docker-compose.sh"
}

teardown() {
    rm -rf "$TEST_DIR"
}

# ============================================
# Tests for sanitize-docker-compose.sh
# ============================================

@test "sanitize-docker-compose: removes alloy service" {
    cat > "$TEST_DIR/docker-compose.yaml" <<EOF
services:
  genlayer-node:
    image: genlayer/node:latest
    ports:
      - "8080:8080"
  alloy:
    image: grafana/alloy:latest
    ports:
      - "9090:9090"
volumes:
  data:
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
    
    # Check that alloy service was removed
    run grep "alloy:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -ne 0 ]
    
    # Check that genlayer-node service still exists
    run grep "genlayer-node:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-docker-compose: removes volumes section" {
    cat > "$TEST_DIR/docker-compose.yaml" <<EOF
services:
  genlayer-node:
    image: genlayer/node:latest
volumes:
  data:
  logs:
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
    
    # Check that volumes section was removed
    run grep "^volumes:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -ne 0 ]
}

@test "sanitize-docker-compose: preserves other services" {
    cat > "$TEST_DIR/docker-compose.yaml" <<EOF
services:
  genlayer-node:
    image: genlayer/node:latest
    environment:
      - NODE_ENV=production
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
  alloy:
    image: grafana/alloy:latest
volumes:
  pgdata:
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
    
    # Check that postgres service still exists
    run grep "postgres:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
    
    # Check that genlayer-node service still exists
    run grep "genlayer-node:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-docker-compose: handles file without alloy service" {
    cat > "$TEST_DIR/docker-compose.yaml" <<EOF
services:
  genlayer-node:
    image: genlayer/node:latest
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
    
    # Check that genlayer-node service still exists
    run grep "genlayer-node:" "$TEST_DIR/docker-compose.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-docker-compose: fails with missing argument" {
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 1 ]
    [[ "$output" == *"Usage:"* ]]
}

@test "sanitize-docker-compose: fails with non-existent file" {
    run bash "$SCRIPT_PATH" "$TEST_DIR/nonexistent.yaml"
    [ "$status" -eq 1 ]
    [[ "$output" == *"File not found"* ]]
}

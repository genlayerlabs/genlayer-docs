#!/usr/bin/env bats

# Unit tests for sanitize-config.sh

setup() {
    export TEST_DIR=$(mktemp -d)
    export SCRIPT_PATH="$BATS_TEST_DIRNAME/../scripts/sanitize-config.sh"
}

teardown() {
    rm -rf "$TEST_DIR"
}

# ============================================
# Tests for sanitize-config.sh
# ============================================

@test "sanitize-config: replaces genlayerchainrpcurl with TODO placeholder" {
    # Create test config
    cat > "$TEST_DIR/config.yaml" <<EOF
rollup:
  genlayerchainrpcurl: "https://secret-rpc.example.com"
  genlayerchainwebsocketurl: "wss://secret-ws.example.com"
  other: "value"
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
    
    # Check that RPC URL was replaced
    run grep "TODO: Set your GenLayer Chain ZKSync HTTP RPC URL here" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-config: replaces genlayerchainwebsocketurl with TODO placeholder" {
    cat > "$TEST_DIR/config.yaml" <<EOF
rollup:
  genlayerchainrpcurl: "https://secret-rpc.example.com"
  genlayerchainwebsocketurl: "wss://secret-ws.example.com"
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
    
    # Check that WebSocket URL was replaced
    run grep "TODO: Set your GenLayer Chain ZKSync WebSocket RPC URL here" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-config: removes node.dev section" {
    cat > "$TEST_DIR/config.yaml" <<EOF
rollup:
  genlayerchainrpcurl: "https://rpc.example.com"
  genlayerchainwebsocketurl: "wss://ws.example.com"
node:
  production: true
  dev:
    debug: true
    verbose: true
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
    
    # Check that dev section was removed
    run grep "dev:" "$TEST_DIR/config.yaml"
    [ "$status" -ne 0 ]
    
    # Check that production section still exists
    run grep "production: true" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-config: preserves other config values" {
    cat > "$TEST_DIR/config.yaml" <<EOF
rollup:
  genlayerchainrpcurl: "https://rpc.example.com"
  genlayerchainwebsocketurl: "wss://ws.example.com"
  chainid: 12345
server:
  port: 8080
  host: "0.0.0.0"
EOF
    
    run bash "$SCRIPT_PATH" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
    
    # Check that other values are preserved
    run grep "chainid: 12345" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
    
    run grep "port: 8080" "$TEST_DIR/config.yaml"
    [ "$status" -eq 0 ]
}

@test "sanitize-config: fails with missing argument" {
    run bash "$SCRIPT_PATH"
    [ "$status" -eq 1 ]
    [[ "$output" == *"Usage:"* ]]
}

@test "sanitize-config: fails with non-existent file" {
    run bash "$SCRIPT_PATH" "$TEST_DIR/nonexistent.yaml"
    [ "$status" -eq 1 ]
    [[ "$output" == *"File not found"* ]]
}

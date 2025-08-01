#!/usr/bin/env python3
"""Test script for sanitize-config.py"""

import os
import sys
import tempfile

# Import sanitize_config function directly
import importlib.util
spec = importlib.util.spec_from_file_location("sanitize_config", 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "sanitize-config.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sanitize_config = module.sanitize_config

def test_sanitize_config():
    """Test that the sanitize_config function removes only dev sections."""
    
    # Test config with admin and dev sections
    test_config = """# node configuration
node:
  # Mode can be "validator" or "archive".
  mode: "validator"
  admin:
    port: 9155
  rpc:
    port: 9151
    endpoints:
      groups:
        genlayer: true
      methods:
        gen_call: true
  ops:
    port: 9153
    endpoints:
      metrics: true
      health: true
  dev:
    disableSubscription: false

# genvm configuration
genvm:
  bin_dir: ./third_party/genvm/bin
  manage_modules: true
"""
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(test_config)
        temp_file = f.name
    
    try:
        # Run sanitize_config
        print("Testing sanitize_config...")
        sanitize_config(temp_file)
        
        # Read the result
        with open(temp_file, 'r') as f:
            result_content = f.read()
        
        # Verify the results by checking the content
        print("\nVerifying results...")
        
        # Check that node section exists
        assert 'node:' in result_content, "node section should exist"
        
        # Check that admin is preserved and dev is removed
        assert 'admin:' in result_content, "admin section should be preserved"
        assert 'port: 9155' in result_content, "admin port should be preserved"
        assert 'dev:' not in result_content, "dev section should be removed"
        assert 'disableSubscription:' not in result_content, "dev content should be removed"
        
        # Check that other sections are preserved
        assert 'rpc:' in result_content, "rpc section should be preserved"
        assert 'ops:' in result_content, "ops section should be preserved"
        assert 'port: 9151' in result_content, "rpc port should be preserved"
        assert 'port: 9153' in result_content, "ops port should be preserved"
        assert 'endpoints:' in result_content, "endpoints should be preserved"
        assert 'groups:' in result_content, "groups should be preserved"
        assert 'methods:' in result_content, "methods should be preserved"
        
        # Check that genvm section is preserved
        assert 'genvm:' in result_content, "genvm section should exist"
        assert 'manage_modules: true' in result_content, "genvm settings should be preserved"
        
        print("✅ All tests passed!")
        
        # Print the sanitized config
        print("\nSanitized config:")
        print(result_content)
        
    finally:
        # Clean up
        os.unlink(temp_file)

if __name__ == "__main__":
    test_sanitize_config()
#!/bin/bash
set -euo pipefail

# Documentation generation wrapper
# Runs all the npm scripts for doc generation with proper error handling

run_doc_generation() {
    echo "Running documentation generation scripts..."
    
    # Track success
    local failed=false
    
    # Run each generation script
    echo "::group::Running node-generate-changelog"
    if npm run node-generate-changelog; then
        echo "✅ Generated changelog"
    else
        echo "❌ node-generate-changelog failed"
        failed=true
    fi
    echo "::endgroup::"
    
    echo "::group::Running node-update-setup-guide"
    if npm run node-update-setup-guide; then
        echo "✅ Updated setup guide versions"
    else
        echo "❌ node-update-setup-guide failed"
        failed=true
    fi
    echo "::endgroup::"
    
    echo "::group::Running node-update-config"
    if npm run node-update-config; then
        echo "✅ Updated config in setup guide"
    else
        echo "❌ node-update-config failed"
        failed=true
    fi
    echo "::endgroup::"
    
    echo "::group::Running node-generate-api-docs"
    if npm run node-generate-api-docs; then
        echo "✅ Generated API documentation"
    else
        echo "❌ node-generate-api-docs failed"
        failed=true
    fi
    echo "::endgroup::"
    
    if [[ "$failed" == "true" ]]; then
        echo "❌ Some documentation generation scripts failed"
        return 1
    fi
    
    echo "✅ All documentation generation scripts completed successfully"
    return 0
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_doc_generation
fi
#!/bin/bash
set -euo pipefail

# Runs every generator that turns synced node files into pages.
# The one list of generators: package.json (dev, build), check-node-docs-sync.yml,
# sync-docs-from-node.yml and scripts/simulate-node-sync.sh all call this script.
# Each generator exits non-zero when it cannot find its source or target block.

GENERATORS=(
  node-generate-changelog
  node-update-setup-guide
  node-update-config
  node-update-docker-compose
  node-update-env
  node-update-monitoring-docker-compose
  node-update-monitoring-alloy-config
  node-update-greybox
  node-publish-manifests
  node-generate-api-docs
)

run_doc_generation() {
    echo "Running documentation generation scripts..."
    local failed=()

    for script in "${GENERATORS[@]}"; do
        echo "::group::Running $script"
        if npm run --silent "$script"; then
            echo "✅ $script"
        else
            echo "❌ $script failed"
            failed+=("$script")
        fi
        echo "::endgroup::"
    done

    if [[ ${#failed[@]} -gt 0 ]]; then
        echo "❌ Failed generators: ${failed[*]}"
        return 1
    fi

    echo "✅ All documentation generation scripts completed successfully"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_doc_generation
fi

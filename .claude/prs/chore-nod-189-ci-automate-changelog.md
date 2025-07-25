chore(workflows): Simplify sync-docs-from-node workflow

## Description

This PR simplifies the sync-docs-from-node workflow by consolidating the `source_branch` and `tag` parameters into a single `version` parameter. The workflow now uses the version/tag directly to checkout the correct release from the genlayer-node repository, eliminating confusion and ensuring documentation always matches the exact version being documented.

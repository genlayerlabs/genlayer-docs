# GitHub Actions Workflows

## sync-docs-from-node.yml

This workflow automatically synchronizes documentation from the `genlayerlabs/genlayer-node` repository to this documentation repository.

### Triggers

1. **Repository Dispatch**: Can be triggered from the genlayer-node repository
2. **Manual Workflow Dispatch**: Can be manually triggered from the Actions tab

### What it does

1. Clones the specified branch from the genlayer-node repository
2. Gets the latest tag from the repository to use in the branch name
3. Copies new or updated files:
   - Changelog files → `content/validators/changelog/`
   - API gen method docs → `pages/api-references/genlayer-node/gen/`
   - API debug method docs → `pages/api-references/genlayer-node/debug/`
   - **Note**: Both `.md` and `.mdx` files are supported. `.md` files are automatically renamed to `.mdx` when copied
4. Runs documentation generation scripts:
   - `generate-changelog.js`
   - `update-setup-guide-versions.js`
   - `generate-api-docs.js`
5. Creates a PR with all changes, using the tag in the branch name (e.g., `sync-node-docs-v0.3.5`)

### Triggering from genlayer-node

Add this to a workflow in the genlayer-node repository:

```yaml
- name: Trigger docs sync
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.DOCS_REPO_TOKEN }}
    repository: genlayerlabs/genlayer-docs
    event-type: sync-docs
    client-payload: |
      {
        "source_branch": "${{ github.ref_name }}",
        "changelog_path": "docs/changelog",
        "api_gen_path": "docs/api/gen",
        "api_debug_path": "docs/api/debug"
      }
```

### Required Secrets

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions, no setup needed. Used for:
  - Repository checkout
  - Creating pull requests via GitHub CLI
  - General workflow authentication
- `NODE_REPO_TOKEN` (optional): Personal Access Token for accessing private genlayer-node repository. Used for:
  - Cloning private genlayer-node repository
  - Falls back to `GITHUB_TOKEN` if not provided
- `DOCS_REPO_TOKEN` (in genlayer-node): Token with `repo` scope for triggering this workflow. Used for:
  - Triggering repository dispatch events from genlayer-node
  - Must have `repo` scope to trigger workflows

### Authentication

The workflow uses the following tokens for authentication:

- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions, used for:
  - Checking out the documentation repository
  - Creating pull requests via GitHub CLI (`gh pr create`)
  - Setting as `GH_TOKEN` environment variable for GitHub CLI commands
  
- **`NODE_REPO_TOKEN`**: Optional, used for:
  - Accessing private genlayer-node repository during checkout
  - Falls back to `GITHUB_TOKEN` if not provided

### Manual Trigger

From the Actions tab:
1. Select "Sync Documentation from Node Repository"
2. Click "Run workflow"
3. Optionally specify:
   - Source branch (default: main)

### File Structure Expected in genlayer-node

```
docs/
├── changelog/
│   ├── v0.3.4.md       # Will be copied as v0.3.4.mdx
│   ├── v0.3.5.mdx      # Will be copied as-is
│   └── ...
├── api/
│   ├── gen/
│   │   ├── gen_call.md              # Will be copied as gen_call.mdx
│   │   ├── gen_getContractSchema.mdx # Will be copied as-is
│   │   └── ...
│   └── debug/
│       ├── gen_dbg_ping.md    # Will be copied as gen_dbg_ping.mdx
│       ├── gen_dbg_trie.mdx   # Will be copied as-is
│       └── ...
```

### Customizing Paths

The source paths can be customized in the event payload:
- `changelog_path`: Path to changelog files (default: `docs/changelog`)
- `api_gen_path`: Path to API gen methods (default: `docs/api/rpc/gen`)
- `api_debug_path`: Path to API debug methods (default: `docs/api/rpc/debug`)
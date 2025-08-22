# GitHub Actions Workflows

## sync-docs-from-node.yml

This workflow automatically synchronizes documentation from the `genlayerlabs/genlayer-node` repository to this documentation repository.

### Triggers

1. **Repository Dispatch**: Can be triggered from the genlayer-node repository
2. **Manual Workflow Dispatch**: Can be manually triggered from the Actions tab

### What it does

1. Detects version from input or automatically finds latest tag
2. Clones the specific version from the genlayer-node repository using sparse checkout
3. Syncs files in parallel using matrix strategy (5 sync types):
   - **Changelog files** → `content/validators/changelog/`
   - **Config file** → `content/validators/config.yaml`
   - **API gen method docs** → `pages/api-references/genlayer-node/gen/` (filtered by regex)
   - **API debug method docs** → `pages/api-references/genlayer-node/debug/` (filtered by regex)
   - **API ops method docs** → `pages/api-references/genlayer-node/ops/`
4. Aggregates sync results and generates detailed reports
5. Runs documentation generation scripts (npm scripts)
6. Creates branch and commits changes (PR creation currently disabled)
7. Generates comprehensive workflow summary with sync details

**Notes**: 
- Both `.md` and `.mdx` files are supported, automatically renamed to `.mdx` when copied
- README files are excluded from sync operations
- Regex filtering applies to API gen/debug files to separate them

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
        "version": "${{ steps.get_version.outputs.version }}",
        "changelog_path": "docs/changelog",
        "api_gen_path": "docs/api/rpc",
        "api_debug_path": "docs/api/rpc",
        "api_ops_path": "docs/api/ops",
        "api_gen_regex": "gen_(?!dbg_).*",
        "api_debug_regex": "gen_dbg_.*"
      }
```

### Tokens and Authentication

#### Built-in Tokens (Automatic)

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions, no setup needed. Used for:
  - Repository checkout
  - Creating pull requests via GitHub CLI (automatically detected by `gh`)
  - General workflow authentication

#### Personal Access Tokens (User-Managed)

- `NODE_REPO_TOKEN` (optional): Personal Access Token for accessing private genlayer-node repository. Used for:
  - Cloning private genlayer-node repository
  - Falls back to `GITHUB_TOKEN` if not provided
  
- `DOCS_REPO_TOKEN` (in genlayer-node): Token with `repo` scope for triggering this workflow. Used for:
  - Triggering repository dispatch events from genlayer-node
  - Must have `repo` scope to trigger workflows
  - Add this as a secret in the genlayer-node repository


### Manual Trigger

From the Actions tab:
1. Select "Sync Documentation from Node Repository"
2. Click "Run workflow"
3. Specify parameters:
   - **Version** (optional, default: `latest`) - Version/tag to sync (e.g., v0.3.5, or "latest" to auto-detect)
   - **Changelog path** (optional, default: `docs/changelog`)
   - **API gen path** (optional, default: `docs/api/rpc`)
   - **API debug path** (optional, default: `docs/api/rpc`) 
   - **API ops path** (optional, default: `docs/api/ops`)
   - **API gen regex** (optional, default: `gen_(?!dbg_).*`)
   - **API debug regex** (optional, default: `gen_dbg_.*`)

### File Structure Expected in genlayer-node

```
docs/
├── changelog/
│   ├── v0.3.4.md       # Will be copied as v0.3.4.mdx
│   ├── v0.3.5.mdx      # Will be copied as-is
│   └── ...
├── api/
│   ├── rpc/
│   │   ├── gen_call.md              # API gen: copied as gen_call.mdx
│   │   ├── gen_getContractSchema.mdx # API gen: copied as-is
│   │   ├── gen_dbg_ping.md          # API debug: copied as gen_dbg_ping.mdx
│   │   └── ...
│   └── ops/
│       ├── health.md       # API ops: copied as health.mdx
│       ├── metrics.mdx     # API ops: copied as-is
│       └── ...
configs/
└── node/
    └── config.yaml.example     # Will be copied to content/validators/config.yaml
```

### Customizing Paths and Filtering

The source paths and filters can be customized via workflow_dispatch inputs:

#### Paths
- `changelog_path`: Path to changelog files (default: `docs/changelog`)
- `api_gen_path`: Path to API gen methods (default: `docs/api/rpc`)
- `api_debug_path`: Path to API debug methods (default: `docs/api/rpc`)
- `api_ops_path`: Path to API ops methods (default: `docs/api/ops`)

#### Regex Filters
- `api_gen_regex`: Regex pattern to filter gen API files (default: `gen_(?!dbg_).*`)
  - This default pattern matches files starting with `gen_` but excludes those starting with `gen_dbg_`
- `api_debug_regex`: Regex pattern to filter debug API files (default: `gen_dbg_.*`)
  - This default pattern matches only files starting with `gen_dbg_`

**Note**: API ops sync includes all files (no regex filtering applied), except README files which are automatically excluded.
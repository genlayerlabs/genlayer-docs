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
   - **Regex Filtering**: API files can be filtered using regex patterns (see Customizing section below)
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
        "api_gen_path": "docs/api/rpc/gen",
        "api_debug_path": "docs/api/rpc/debug",
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
3. Optionally specify:
   - Source branch (default: main)
   - Tag for branch naming (required)
   - API gen regex filter (optional, default: `gen_(?!dbg_).*`)
   - API debug regex filter (optional, default: `gen_dbg_.*`)

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

### Customizing Paths and Filtering

The source paths and filters can be customized in the event payload:

#### Paths
- `changelog_path`: Path to changelog files (default: `docs/changelog`)
- `api_gen_path`: Path to API gen methods (default: `docs/api/rpc/gen`)
- `api_debug_path`: Path to API debug methods (default: `docs/api/rpc/debug`)

#### Regex Filters
- `api_gen_regex`: Regex pattern to filter gen API files (default: `gen_(?!dbg_).*`)
  - This default pattern matches files starting with `gen_` but excludes those starting with `gen_dbg_`
- `api_debug_regex`: Regex pattern to filter debug API files (default: `gen_dbg_.*`)
  - This default pattern matches only files starting with `gen_dbg_`

The regex patterns are applied to the filename (without extension) to determine which files should be synced.
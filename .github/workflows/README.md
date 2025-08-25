# GitHub Actions Workflows

## sync-docs-from-node.yml

This workflow automatically synchronizes documentation from the `genlayerlabs/genlayer-node` repository to this documentation repository.

### Triggers

1. **Repository Dispatch**: Can be triggered from the genlayer-node repository
2. **Manual Workflow Dispatch**: Can be manually triggered from the Actions tab

### What it does

1. **Prepare**: Detects version from input or automatically finds latest tag
2. **Sync Files** (parallel matrix strategy, 5 sync types):
   - **Changelog files** → `content/validators/changelog/`
   - **Config file** → `content/validators/config.yaml` (with sanitization)
   - **API gen method docs** → `pages/api-references/genlayer-node/gen/` (filtered by regex)
   - **API debug method docs** → `pages/api-references/genlayer-node/debug/` (filtered by regex)
   - **API ops method docs** → `pages/api-references/genlayer-node/ops/`
3. **Aggregate Results**: Merges all synced files from parallel jobs into single artifact
4. **Generate Docs**: 
   - Applies synced files to specific directories (avoids deleting unrelated content)
   - Runs documentation generation scripts to create `pages/validators/` files
5. **Create PR**: 
   - Creates branch, commits changes, and creates/updates pull requests
   - Includes detailed summary with file counts
6. **Summary**: Generates comprehensive workflow summary with detailed file lists
7. **Cleanup**: Automatically removes all intermediate artifacts when enabled

**Important Notes**: 
- Both `.md` and `.mdx` files are supported, automatically renamed to `.mdx` when synced
- README and CHANGELOG files are excluded from sync operations
- Regex filtering uses Perl-compatible patterns (supports negative lookahead)
- File deletions are properly handled with `rsync --delete` for each directory

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

## Pipeline Architecture

### Jobs and Dependencies
The workflow uses 7 main jobs with the following dependency chain:

```
prepare (version detection)
    ↓
sync-files (matrix: 5 parallel jobs)
    ↓
aggregate-results (merges artifacts)
    ↓
generate-docs (runs npm scripts)
    ↓
create-pr (commits & creates PR)
    ↓ 
summary (always runs, shows results)
    ↓ 
cleanup (removes all artifacts if enabled)
```

### Global Configuration
The workflow uses environment variables for global settings:
- `CLEANUP_ARTIFACTS: true` - Enables automatic cleanup of intermediate artifacts after successful completion

### Composite Actions
The workflow uses composite actions for code reusability:
- `.github/actions/sync-files/` - Handles all file synchronization types

### Scripts Used
- `.github/actions/sync-files/sync.sh` - Core sync logic with file tracking and deletion support
- `.github/scripts/sync-artifact-files.sh` - Applies synced files to repository with rsync --delete
- `.github/scripts/aggregate-reports.sh` - Aggregates sync metrics from parallel jobs
- `.github/scripts/git-utils.sh` - Branch creation, commit, and push operations
- `.github/scripts/sanitize-config.sh` - Sanitizes config files (URLs and dev sections)
- `.github/scripts/sanitize-config.py` - Python script to remove node.dev sections
- `.github/scripts/version-utils.sh` - Version detection and validation
- `.github/scripts/doc-generator.sh` - Wrapper for npm documentation generation

### Config File Sanitization
The config sync process includes automatic sanitization:
1. **URL Replacement**: Real URLs replaced with TODO placeholders
2. **Dev Section Removal**: `node.dev` sections stripped using Python script
3. **Comparison**: Only sanitized content is compared to detect actual changes

### Branch Naming Convention
Sync branches follow the pattern: `docs/node/{version}`
- Example: `docs/node/v0.3.5`
- Version slashes are replaced with dashes for safety

### Artifact Management
The workflow uses artifacts to pass data between jobs:
- `synced-{type}` - Individual sync results for each type (includes files and reports)
- `synced-merged` - All synced files and reports merged together
- `synced-final` - Final artifact with generated documentation and sync reports

**Artifact Structure**:
- Each artifact contains:
  - `sync_report_{type}.md` - Detailed report with file lists
  - Synced files in their target directory structure
  - `sync-reports/` directory in final artifact for reference

**Deletion Handling**: 
- Uses `rsync --delete` for each specific subdirectory to ensure proper file deletion
- Only affects synced directories (`content/validators/`, `pages/api-references/genlayer-node/`)
- Never deletes unrelated documentation content

**Automatic Cleanup**: 
- All artifacts are automatically deleted when `CLEANUP_ARTIFACTS: true` (default)
- Cleanup only runs after successful PR creation or summary generation

### Pull Request Behavior
- Creates new PR for new versions
- Updates existing open PR for same version  
- Automatically labels with "documentation" and "node"

**PR Description includes**:
- Source repository and version
- API filter patterns used
- Total files changed with breakdown (added/updated/deleted)
- List of npm scripts that were run
- Automated checklist confirming successful sync

### Workflow Summary
The summary job generates a comprehensive report in the GitHub Actions UI:
- **Overall Results**: Version and total change counts
- **Sync Results by Type**: For each sync type shows:
  - Count of added/updated/deleted files
  - Detailed file lists (e.g., "Added: gen_call.mdx")
- **Pull Request Link**: Direct link to created/updated PR

### Documentation Generation Scripts
After syncing files, the workflow runs these npm scripts:
- `npm run node-generate-changelog` - Generates changelog page from synced files
- `npm run node-update-setup-guide` - Updates setup guide with version info
- `npm run node-update-config` - Processes configuration documentation
- `npm run node-generate-api-docs` - Generates API reference pages
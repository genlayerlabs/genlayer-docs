# Pre-Update Validation Checklist

This checklist MUST be executed before starting any validator node update to catch known edge cases proactively.

## Phase 1: Current Node Analysis

### 1.1 Check Current LLM Configuration
**Purpose:** Detect if OpenAI is used but not enabled (edge: openai-backend-disabled)

```bash
# Check which LLM key is set in .env
grep -E '(HEURISTKEY|COMPUT3KEY|IOINTELLIGENCEKEY|OPENAIKEY|LIBERTAI_API_KEY|ANTHROPICKEY|GEMINIKEY)=' /opt/genlayer-node/.env | grep -v '^#' | grep -v '=$'

# For each non-empty key, check if that provider is enabled
# Example for OpenAI:
if grep -q 'OPENAIKEY=' /opt/genlayer-node/.env | grep -v '=$'; then
  grep -A 2 'openai:' /opt/genlayer-node/third_party/genvm/config/genvm-module-llm.yaml | grep 'enabled'
  # If shows "enabled: false" → FLAG FOR FIX
fi
```

**Action if detected:** Note that OpenAI will need to be enabled in new version.

### 1.2 Check Current Database Structure
**Purpose:** Detect if database is not shared between patch versions (edge: database-not-shared-patch-versions)

```bash
# Check if current installation has separate databases
ls -la /opt/genlayer-node/v0.4.*/data/node/genlayer.db 2>/dev/null
readlink /opt/genlayer-node/v0.4.*/data/node/genlayer.db 2>/dev/null

# If both show as directories (not symlinks) → FLAG FOR FIX
```

**Action if detected:** Plan to create shared database structure during update.

### 1.3 Record Current Sync State
**Purpose:** Baseline to verify new version syncs correctly

```bash
# Record current version and sync block
curl -s http://localhost:9153/health | jq -r '.node_version, .checks.validating.error'
curl -s http://localhost:9153/metrics | grep 'genlayer_node_synced_block'
```

**Action:** Save this information to compare after update.

### 1.4 Verify Node is Running
**Purpose:** Confirm we're not stopping a non-running node (edge: high-downtime-update)

```bash
sudo systemctl status genlayer-node --no-pager
```

**Action if NOT running:** Different procedure - no downtime concern, but check why it's not running.

## Phase 2: Pre-Download Preparation

### 2.1 Check Disk Space
**Purpose:** Ensure enough space for new version (edge: not explicitly documented but critical)

```bash
df -h /opt/genlayer-node
# Need at least 5GB free for new version + shared DB growth
```

**Action if low:** Clean up old versions or warn user.

### 2.2 Verify Prerequisites Still Met
**Purpose:** Ensure system hasn't degraded since initial install

```bash
# Python with pip and venv
python3 --version && pip3 --version && python3 -m venv --help

# Docker
docker --version && docker compose version
```

**Action if missing:** Reinstall prerequisites before proceeding.

## Phase 3: Post-Download Validation

### 3.1 Verify GenVM Setup Completion
**Purpose:** Ensure slow GenVM setup completed successfully (edge: setup-py-failed)

```bash
ls -la /opt/genlayer-node/${NEW_VERSION}/third_party/genvm/bin/genvm
ls -la /opt/genlayer-node/${NEW_VERSION}/third_party/genvm/bin/genvm-modules
```

**Action if missing:** Re-run setup.py, don't proceed to switch.

### 3.2 Check LLM Config in New Version
**Purpose:** Proactively fix OpenAI disabled issue BEFORE switching (edge: openai-backend-disabled)

```bash
# If OpenAI key was found in current .env:
grep -A 2 'openai:' /opt/genlayer-node/${NEW_VERSION}/third_party/genvm/config/genvm-module-llm.yaml | grep 'enabled'

# If disabled, enable it NOW before switching:
if [ "$USING_OPENAI" = "true" ]; then
  sed -i '/^  openai:/,/^  / s/enabled: false/enabled: true/' \
    /opt/genlayer-node/${NEW_VERSION}/third_party/genvm/config/genvm-module-llm.yaml
fi
```

**Action:** Fix BEFORE switching versions.

### 3.3 Verify Shared Database Structure
**Purpose:** Ensure new version uses shared DB (edge: database-not-shared-patch-versions)

```bash
# Check that symlink was created correctly
readlink /opt/genlayer-node/${NEW_VERSION}/data/node/genlayer.db
# Should point to /opt/genlayer-node/v0.4/data/node/genlayer.db

# Verify shared DB exists
ls -la /opt/genlayer-node/v0.4/data/node/genlayer.db
```

**Action if wrong:** Fix structure before switching.

## Phase 4: Pre-Switch Final Checks

### 4.1 Verify WebDriver Ready
**Purpose:** Ensure WebDriver won't cause startup failure (edge: webdriver-not-healthy)

```bash
docker inspect --format='{{.State.Health.Status}}' genlayer-node-webdriver
# Should be 'healthy'
```

**Action if not healthy:** Fix before switching.

### 4.2 Doctor Check on New Version (Dry Run)
**Purpose:** Test new version without committing to it

```bash
# Temporarily point to new version (without stopping old node)
cd /opt/genlayer-node/${NEW_VERSION}
source .env
./bin/genlayernode doctor
```

**Action if fails:** Fix issues before switching.

## Phase 5: Post-Switch Validation

### 5.1 Verify Version Switched
```bash
curl -s http://localhost:9153/health | jq -r '.node_version'
# Should show new version
```

### 5.2 Verify Sync Progressing
```bash
# Wait 30 seconds, then check sync increased
sleep 30
curl -s http://localhost:9153/metrics | grep 'genlayer_node_synced_block'
# Should be higher than pre-update baseline
```

### 5.3 Check LLM Module Started
```bash
# Should NOT see "module_failed_to_start" errors
sudo journalctl -u genlayer-node --since '2 minutes ago' --no-pager | grep -i 'llm\|genvm is ready'
# Should see "genvm is ready"
```

## Automation Recommendation

This checklist should be encoded into the skill as mandatory validation steps:

```yaml
# In validations.yaml
pre_update_validations:
  - id: check-llm-provider-enabled
    when: before_version_switch
    check: |
      # Check if LLM provider in use is enabled in new version
    action: Enable if needed

  - id: verify-shared-database
    when: before_version_switch
    check: |
      # Verify new version uses shared DB
    action: Create shared structure if needed

  - id: verify-genvm-setup-complete
    when: before_version_switch
    check: |
      # Ensure GenVM binaries present
    action: Re-run setup.py if missing
```

## Summary

**Current State:**
- Edge cases documented in sharp-edges.yaml
- But not actively checked during execution
- Issues discovered reactively after failure

**Target State:**
- Edge cases checked proactively before each phase
- Issues prevented before they cause failures
- Validation failures stop the process early

**Implementation:**
Each phase of the update should explicitly check relevant edge cases from sharp-edges.yaml before proceeding.
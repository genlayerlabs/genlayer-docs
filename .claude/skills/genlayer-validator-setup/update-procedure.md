# GenLayer Validator Zero-Downtime Update Procedure

## Goal
Minimize validator downtime during updates by preparing the new version while the old version continues running.

## Update Sequence (for v0.4.x patch updates)

### Phase 1: Preparation (Old Version Running)
All preparation steps happen WHILE the validator is actively running and validating:

```bash
# 1. Check current version
curl -s http://localhost:9153/health | jq '.node_version'

# 2. Download new version to /tmp
VERSION=v0.4.5  # or whatever new version
wget https://storage.googleapis.com/gh-af/genlayer-node/bin/amd64/${VERSION}/genlayer-node-linux-amd64-${VERSION}.tar.gz \
  -O /tmp/genlayer-node-${VERSION}.tar.gz

# 3. Create version directory and extract
sudo mkdir -p /opt/genlayer-node/${VERSION}
sudo tar -xzvf /tmp/genlayer-node-${VERSION}.tar.gz \
  -C /opt/genlayer-node/${VERSION} --strip-components=1

# 4. Set permissions
sudo chown -R $USER:$USER /opt/genlayer-node/${VERSION}

# 5. Run GenVM setup (IMPORTANT: This is the slow part - 2+ minutes)
python3 /opt/genlayer-node/${VERSION}/third_party/genvm/bin/setup.py

# 6. Create configs directory
sudo mkdir -p /opt/genlayer-node/${VERSION}/configs/node

# 7. Copy config from current version
sudo cp /opt/genlayer-node/configs/node/config.yaml \
  /opt/genlayer-node/${VERSION}/configs/node/config.yaml

# 8. Copy .env from current version
sudo cp /opt/genlayer-node/.env /opt/genlayer-node/${VERSION}/.env

# 9. Enable OpenAI in GenVM config (if using OpenAI)
sudo sed -i '/^  openai:/,/^  / s/enabled: false/enabled: true/' \
  /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml

# 10. Create data directory structure
sudo mkdir -p /opt/genlayer-node/${VERSION}/data/node

# 11. Create symlinks to shared v0.4 database
ln -s /opt/genlayer-node/v0.4/data/node/genlayer.db \
  /opt/genlayer-node/${VERSION}/data/node/genlayer.db

# 12. Copy keystore from shared location
sudo cp -r /opt/genlayer-node/data/node/keystore \
  /opt/genlayer-node/${VERSION}/data/node/
```

**At this point, everything is ready for the new version.**

### Phase 2: Quick Switch (Minimize Downtime)
Now we do the fastest possible switch:

```bash
# 1. Stop old version
sudo systemctl stop genlayer-node

# 2. Update symlinks (very fast - <1 second)
cd /opt/genlayer-node
ln -sfn /opt/genlayer-node/${VERSION}/bin bin
ln -sfn /opt/genlayer-node/${VERSION}/third_party third_party
ln -sfn /opt/genlayer-node/${VERSION}/data data
ln -sfn /opt/genlayer-node/${VERSION}/configs configs
ln -sfn /opt/genlayer-node/${VERSION}/docker-compose.yaml docker-compose.yaml
ln -sfn /opt/genlayer-node/${VERSION}/.env .env

# 3. Start new version immediately
sudo systemctl start genlayer-node

# Total downtime: 10-15 seconds
```

### Phase 3: Verification
```bash
# Check version
curl -s http://localhost:9153/health | jq '.node_version'

# Check sync status
curl -s http://localhost:9153/health | jq '.checks.validating'

# Monitor logs
sudo journalctl -u genlayer-node -f --no-hostname
```

## For Major Version Updates (e.g., v0.4.x → v0.5.x)

Major version updates may require:
1. New shared storage directory (e.g., `/opt/genlayer-node/v0.5/`)
2. Database migration scripts
3. Configuration format changes

The principle remains: **Prepare everything first, then quick switch.**

## Downtime Comparison

| Method | Downtime | Validation Loss |
|--------|----------|-----------------|
| **Old way (stop first)** | 3-4 minutes | High - missed many validation rounds |
| **New way (prepare first)** | 10-15 seconds | Minimal - maybe 1 validation round |

## Key Principles

1. **Never stop the old node until the new node is 100% ready to start**
2. **GenVM setup is the slowest part** - do it while old node runs
3. **Shared database** - instant access to current sync state
4. **Symlink switching** - takes <1 second
5. **Test the new version setup** - verify files exist before switching

## Rollback Procedure (if new version fails)

If the new version fails to start:

```bash
# 1. Stop failed new version
sudo systemctl stop genlayer-node

# 2. Switch symlinks back to old version
cd /opt/genlayer-node
ln -sfn /opt/genlayer-node/v0.4.3/bin bin
ln -sfn /opt/genlayer-node/v0.4.3/third_party third_party
ln -sfn /opt/genlayer-node/v0.4.3/data data
ln -sfn /opt/genlayer-node/v0.4.3/configs configs
ln -sfn /opt/genlayer-node/v0.4.3/docker-compose.yaml docker-compose.yaml
ln -sfn /opt/genlayer-node/v0.4.3/.env .env

# 3. Start old version
sudo systemctl start genlayer-node

# Total rollback time: 10-15 seconds
```

## Pre-Update Checklist

Before starting any update:

- [ ] Current node is running and synced
- [ ] Disk space available (check with `df -h`)
- [ ] Backup current .env and config.yaml
- [ ] Know the rollback procedure
- [ ] Have monitoring ready to check after switch
- [ ] Note current synced block number
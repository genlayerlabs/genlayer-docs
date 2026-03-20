# Greybox LLM Strategy — Validator Setup Guide

Switch your GenLayer node from random LLM provider selection to deterministic ordered fallback via OpenRouter.

## What is Greybox?

By default, the node picks a random LLM provider for each call. With **greybox**, the node uses a fixed priority chain configured via `meta.greybox` fields in the YAML config.

**Default text chain:** deepseek-v3.2 → qwen3-235b → claude-haiku-4.5 → kimi-k2 → glm-5 → llama-3.3 (heurist) → llama-3.3 (ionet)

**Default image chain:** gpt-5.1-mini → gemini-3-flash → claude-haiku-4.5

Chain order is determined by the `meta.greybox` priority numbers on each model in the YAML. Lower number = higher priority. You can change the order by editing these numbers — no Lua changes needed.

OpenRouter is the primary aggregator. If it fails, the node falls back to direct provider APIs (heurist, ionet).

## Prerequisites

- GenLayer node **v0.5.7+** (tarball must include `genvm-modules-llm-release.yaml` and `genvm-llm-greybox.lua`)
- An **OpenRouter API key** — get one at https://openrouter.ai/keys

## Step-by-Step Setup

### 1. Stop the node

```bash
sudo systemctl stop genlayer-node
```

### 2. Add OpenRouter API key to .env

```bash
# Find your active .env
ENV_FILE="/opt/genlayer-node/.env"

# Add the key (or edit the file manually)
echo "OPENROUTERKEY=sk-or-v1-your-key-here" >> ${ENV_FILE}
```

### 3. Apply the release LLM config

The tarball ships with a unified config that includes all backends (openrouter, morpheus, heurist, ionet, etc.).

```bash
VERSION=$(readlink /opt/genlayer-node/bin | sed 's|/bin||; s|.*/||')

cp /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-modules-llm-release.yaml \
   /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml
```

### 4. Switch to greybox strategy

```bash
sed -i 's/genvm-llm-default\.lua/genvm-llm-greybox.lua/' \
  /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml
```

### 5. Verify the config

```bash
# Check lua script path
grep lua_script_path /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml
# Expected: lua_script_path: ${exeDir}/../config/genvm-llm-greybox.lua

# Check openrouter is present
grep -A2 'openrouter:' /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml
# Expected: enabled: true

# Check the greybox Lua file exists
ls -la /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-llm-greybox.lua
```

### 6. Start the node

```bash
sudo systemctl start genlayer-node
```

### 7. Verify greybox is active

Wait for an LLM transaction to be processed, then check the logs:

```bash
sudo journalctl -u genlayer-node --no-hostname | grep "greybox"
```

You should see entries like:
```
greybox: using text chain    count: 5
greybox: success    provider: openrouter    model: deepseek/deepseek-v3.2    is_primary: true
```

## Switching Back to Default

To revert to random provider selection:

```bash
sudo systemctl stop genlayer-node

sed -i 's/genvm-llm-greybox\.lua/genvm-llm-default.lua/' \
  /opt/genlayer-node/${VERSION}/third_party/genvm/config/genvm-module-llm.yaml

sudo systemctl start genlayer-node
```

## Updating Greybox on a Running Node (No Full Restart)

If you need to update the Lua script or model config without stopping the whole node,
you can restart just the LLM module on each GenVM instance:

```bash
# Find the GenVM manager port (check your config or active ports)
PORT=3999

# Stop the LLM module
curl -X POST "http://127.0.0.1:${PORT}/module/stop" \
  -H 'Content-Type: application/json' \
  -d '{"module_type": "Llm"}'

# Start the LLM module (reloads Lua script and config)
curl -X POST "http://127.0.0.1:${PORT}/module/start" \
  -H 'Content-Type: application/json' \
  -d '{"module_type": "Llm", "config": null}'
```

Repeat for each GenVM instance port. There is no atomic restart — each instance
restarts independently.

## Customizing the Chain Order

The greybox Lua script reads chain membership and priority from `meta.greybox` on each model in the YAML config. Example:

```yaml
models:
  deepseek/deepseek-v3.2:
    supports_json: true
    meta:
      greybox: { text: 1 }        # text chain, priority 1 (primary)
  openai/gpt-5.1-mini:
    supports_json: true
    supports_image: true
    meta:
      greybox: { image: 1 }       # image chain, priority 1
  anthropic/claude-haiku-4.5:
    supports_json: true
    supports_image: true
    meta:
      greybox: { text: 3, image: 3 }  # both chains
```

**Change model order:** Edit the priority numbers. Lower number = tried first.

**Add a model to the chain:** Add `meta: { greybox: { text: N } }` to any model in any enabled backend.

**Remove a model from the chain:** Remove its `meta.greybox` field.

**Disable an entire provider:** Remove its API key from `.env` — all its models drop out automatically.

The YAML config **must** have `meta.greybox` fields on at least some models. If none are found, the LLM module will fail to start with an error.

After editing the YAML, restart the LLM module (see "Updating Greybox on a Running Node" above) or restart the node.

## Troubleshooting

**"module_failed_to_start" error:**
- Check that `genvm-llm-greybox.lua` exists in the config directory
- Check that `OPENROUTERKEY` is set in `.env` and not empty
- Check that the openrouter backend shows `enabled: true` in the YAML

**No "greybox:" entries in logs:**
- The greybox Lua only logs when an LLM call happens. Run a transaction that uses an intelligent contract with LLM calls.
- Verify `lua_script_path` points to `genvm-llm-greybox.lua` (not `default`)

**All models exhausted error:**
- OpenRouter may be down or your key is invalid
- Check your key at https://openrouter.ai/settings/keys
- Fallback providers (heurist, ionet) also need valid keys if you want fallback to work

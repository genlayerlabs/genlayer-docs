# GenLayer Skills

Claude Code skills for GenLayer validator operations and node management.

## Available Skills

### genlayer-validator-setup

Interactive wizard to set up a GenLayer validator node on Linux servers.

**Features:**
- Prerequisites verification (architecture, RAM, dependencies)
- Wallet and staking wizard integration
- Software download with versioned directories
- Configuration generation with sensible defaults
- Operator key management
- LLM provider setup (Anthropic, Google, Heurist, etc.)
- Systemd service creation
- Telemetry/monitoring setup (optional)
- Version upgrades with shared storage

**Version:** 1.3.0

**Documentation:**
- [Full Documentation](./genlayer-validator-setup/SKILL.md)
- [Installation Guide](#installation)

## Installation

### Method 1: Claude Code Plugin (Recommended)

```bash
# Add the plugin marketplace
/plugin marketplace add genlayerlabs/genlayer-docs

# Install the skill
/plugin install genlayer-validator-setup@genlayer-docs
```

### Method 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/genlayerlabs/genlayer-docs.git

# Copy skill to your project
cp -r genlayer-docs/.claude/skills/genlayer-validator-setup \
      your-project/.claude/skills/

# Or symlink it
ln -s $(pwd)/genlayer-docs/.claude/skills/genlayer-validator-setup \
      your-project/.claude/skills/genlayer-validator-setup
```

### Method 3: Direct Usage (If in genlayer-docs repo)

The skill is already available if you're working within the genlayer-docs repository. Just invoke it:

```bash
/genlayer-validator-setup
```

## Usage

Once installed, activate the skill:

```bash
/genlayer-validator-setup
```

Then tell Claude what you want to do:
- "I want to set up a new validator node"
- "Help me upgrade my node from v0.4.3 to v0.4.4"
- "I need to configure a new operator key"

## What's Included

The skill provides:
- **46 documented anti-patterns** - Common mistakes to avoid
- **33 documented sharp edges** - Runtime issues with detection and fixes
- **Complete installation procedure** - Step-by-step guided setup
- **Validation rules** - Ensures correct configuration
- **Collaboration patterns** - Multi-session support

## Support

- **Issues**: [GitHub Issues](https://github.com/genlayerlabs/genlayer-docs/issues)
- **Documentation**: [GenLayer Docs](https://docs.genlayer.com)
- **Discord**: [GenLayer Community](https://discord.gg/genlayer)

## License

Apache 2.0

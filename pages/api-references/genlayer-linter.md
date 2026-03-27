# genvm-linter

Fast validation and schema extraction for GenLayer intelligent contracts.

## Installation

```bash
pip install genvm-linter
```

## Usage

```bash
# Run both lint and validate (default)
genvm-lint check contract.py

# Fast AST safety checks only (~50ms)
genvm-lint lint contract.py

# Full SDK semantic validation (~200ms cached)
genvm-lint validate contract.py

# Extract ABI schema
genvm-lint schema contract.py
genvm-lint schema contract.py --output abi.json

# Pyright type checking with SDK auto-configured
genvm-lint typecheck contract.py
genvm-lint typecheck contract.py --strict      # Strict mode
genvm-lint typecheck contract.py --all         # Show all errors (disable SDK suppressions)

# IDE setup — download SDK and output extraPaths for Pylance
genvm-lint setup                               # Latest version
genvm-lint setup --contract contract.py        # Auto-detect version from header
genvm-lint setup --version v0.2.12             # Specific version
genvm-lint setup --json                        # JSON output for IDE integration

# Pre-download GenVM artifacts
genvm-lint download                    # Latest
genvm-lint download --version v0.2.12  # Specific version
genvm-lint download --list             # Show cached

# JSON output (all commands)
genvm-lint check contract.py --json
```

## How It Works

### Layer 1: AST Lint Checks (Fast)
- Forbidden imports (`random`, `os`, `time`, etc.)
- Non-deterministic patterns (`float()`, `time.time()`)
- Structure validation (dependency header)

### Layer 2: SDK Validation (Accurate)
- Downloads GenVM release artifacts (cached at `~/.cache/genvm-linter/`)
- Loads exact SDK version specified in contract header
- Validates types, decorators, storage fields
- Extracts ABI schema

## Exit Codes

- `0` - All checks passed
- `1` - Lint or validation errors
- `2` - Contract file not found
- `3` - SDK download failed

## IDE Integration

### VS Code Extension

This linter is used by the [GenLayer VS Code Extension](https://github.com/genlayerlabs/vscode-extension) for real-time contract validation.

### Manual Pylance Setup

Use `genvm-lint setup` to configure Pylance with the correct SDK paths. This gives you hover docs, go-to-definition, and type checking without the extension.

```bash
genvm-lint setup --contract contract.py
```

Add the output paths to your VS Code `settings.json`:

```json
{
  "python.analysis.extraPaths": ["<output paths>"],
  "python.analysis.reportMissingModuleSource": "none"
}
```

### Type Checking

`genvm-lint typecheck` runs Pyright with the SDK auto-configured. By default it suppresses SDK-internal noise (dynamic attributes, NewType compat). Use `--all` to see everything, `--strict` for strict mode.

## Development

```bash
git clone https://github.com/genlayerlabs/genvm-linter.git
cd genvm-linter
pip install -e ".[dev]"
pytest
```

## License

MIT

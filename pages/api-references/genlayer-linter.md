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
- Semantic consensus rule (GL-S03)

### Semantic Rules (GL-S)

These rules run as part of Layer 1 and catch common mistakes in GenLayer consensus patterns.

#### GL-S03 — `eq_principle_strict_eq` nondeterminism mismatch (ERROR)

Flags `eq_principle_strict_eq` (all API generations: `gl.eq_principle.strict_eq`,
`eq_principle_strict_eq`, `eq_principle.strict_eq`) wrapping a lambda or function that
**returns raw nondeterministic output directly**. LLM outputs and raw web content vary
across validators, so strict-equality consensus will always fail.

**Detection is conservative** — only flagged when the wrapped function/lambda returns
the nondeterministic value without any transformation. Processed output (boolean comparisons,
`json.loads`, sorted results, etc.) is not flagged.

Nondeterministic calls detected in two forms:

- **Namespace-qualified** (v0.1.0 and v0.1.3+ APIs): `gl.exec_prompt`, `gl.get_webpage`,
  `gl.nondet.exec_prompt`, `gl.nondet.web.render`, and their `genlayer.*` equivalents
- **Bare names** (direct SDK import convention): `exec_prompt`, `get_webpage` — matched
  when called without a namespace prefix, representing
  `from genlayer.std.nondet_fns import exec_prompt` style imports

Flagged patterns:

```python
# Bad — namespace-qualified, LLM output is non-deterministic (v0.1.0 API)
gl.eq_principle.strict_eq(lambda: gl.exec_prompt("What is 2+2?"))

# Bad — namespace-qualified, raw web content varies (v0.1.0 API)
gl.eq_principle.strict_eq(lambda: gl.get_webpage("https://example.com"))

# Bad — namespace-qualified, v0.1.3+ API
gl.eq_principle.strict_eq(lambda: gl.nondet.exec_prompt("What is 2+2?"))
gl.eq_principle.strict_eq(lambda: gl.nondet.web.render("https://example.com"))

# Bad — bare name (direct import: from genlayer.std.nondet_fns import exec_prompt)
gl.eq_principle.strict_eq(lambda: exec_prompt("What is 2+2?"))

# Bad — named function returning raw nondet
def fetch():
    return gl.exec_prompt("What is 2+2?")

gl.eq_principle.strict_eq(fetch)

# Bad — simple passthrough variable
def fetch():
    result = gl.exec_prompt("What is 2+2?")
    return result

gl.eq_principle.strict_eq(fetch)
```

Not flagged (processed output or third-party calls):

```python
# OK — bool is deterministic
gl.eq_principle.strict_eq(lambda: "Paris" in gl.get_webpage("https://example.com"))

# OK — comparison produces deterministic bool
def classify():
    data = gl.exec_prompt("Answer YES or NO")
    return data == "YES"

gl.eq_principle.strict_eq(classify)

# OK — third-party: my_service.exec_prompt is not a GL SDK call
gl.eq_principle.strict_eq(lambda: my_service.exec_prompt("What is 2+2?"))
```

**Alias handling:** GL-S03 matches by name convention, not by import tracking. Bare
names `exec_prompt` and `get_webpage` are flagged when called without a namespace prefix
(representing direct SDK imports such as `from genlayer.std.nondet_fns import exec_prompt`).
Calls through a non-SDK object — e.g. `my_service.exec_prompt()` — are **not** flagged
because `my_service.exec_prompt` is not in the matched name list.

Fix — switch to a comparative principle:

```python
gl.eq_principle.prompt_comparative(
    lambda: gl.exec_prompt("What is 2+2?", response_format=int),
    principle="Return YES if both answers are numerically equal",
)
```

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

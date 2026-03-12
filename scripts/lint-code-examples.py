#!/usr/bin/env python3
"""Extract Python code blocks from MDX files and lint them with genvm-lint.

Extracts complete contracts (those with a Depends header) from documentation,
writes them to temp files, and runs genvm-lint on each.

Usage:
    python scripts/lint-code-examples.py [--fix-version VERSION] [--lint-snippets]

Checks:
    1. Complete contracts must not use "test" or "latest" as runner hash
    2. All complete contracts must pass genvm-lint lint (AST checks)
    3. Runner versions should be consistent across all examples
    4. GenLayer snippets must be valid Python (syntax check)
    5. Method snippets wrapped in contracts must pass lint (--lint-snippets)
"""

import argparse
import ast
import re
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

DOCS_ROOT = Path(__file__).parent.parent / "pages"
DEPENDS_RE = re.compile(r'"Depends"\s*:\s*"([^:]+):([^"]+)"')
CODE_BLOCK_RE = re.compile(r"```py(?:thon)?[^\n]*\n(.*?)```", re.DOTALL)
DISALLOWED_HASHES = {"test", "latest"}

# Old API → new API. Checked in both code blocks and prose.
DEPRECATED_APIS = {
    "gl.eq_principle_strict_eq": "gl.eq_principle.strict_eq",
    "gl.eq_principle_prompt_comparative": "gl.eq_principle.prompt_comparative",
    "gl.eq_principle_prompt_non_comparative": "gl.eq_principle.prompt_non_comparative",
    "gl.get_webpage": "gl.nondet.web.get / gl.nondet.web.render",
    "gl.exec_prompt": "gl.nondet.exec_prompt",
}


def extract_python_blocks(mdx_path: Path) -> list[dict]:
    """Extract Python code blocks from an MDX file.

    Returns list of dicts with 'code', 'line' (1-based), and 'is_contract' keys.
    """
    content = mdx_path.read_text()
    blocks = []

    for match in CODE_BLOCK_RE.finditer(content):
        code = match.group(1)
        # Calculate line number
        line = content[: match.start()].count("\n") + 1

        # Check if this is a complete contract
        has_depends = bool(DEPENDS_RE.search(code))
        has_contract_class = "gl.Contract" in code or "@gl.contract" in code
        has_import = "from genlayer import" in code

        is_contract = has_depends or (has_import and has_contract_class)
        is_genlayer = "gl." in code or "from genlayer" in code

        blocks.append(
            {
                "code": code,
                "line": line,
                "is_contract": is_contract,
                "is_genlayer": is_genlayer and not is_contract,
                "depends": dict(DEPENDS_RE.findall(code)),
            }
        )

    return blocks


def check_runner_versions(blocks: list[tuple[Path, dict]]) -> list[str]:
    """Check that no contract uses test/latest and versions are consistent."""
    errors = []
    runner_versions: dict[str, set[str]] = {}

    for mdx_path, block in blocks:
        rel = mdx_path.relative_to(DOCS_ROOT)
        for name, hash_val in block["depends"].items():
            if hash_val in DISALLOWED_HASHES:
                errors.append(
                    f"{rel}:{block['line']}: {name} uses '{hash_val}' — "
                    f"pin to a specific runner hash"
                )
            else:
                runner_versions.setdefault(name, set()).add(hash_val)

    # Check consistency — all examples should use the same runner version
    for name, versions in runner_versions.items():
        if len(versions) > 1:
            errors.append(
                f"Inconsistent {name} versions across examples: "
                + ", ".join(sorted(versions))
            )

    return errors


def lint_contract(
    code: str,
    mdx_path: Path,
    line: int,
    line_offset: int = 0,
    ignore_codes: set[str] | None = None,
) -> list[str]:
    """Run genvm-lint check on a code block. Returns list of error strings."""
    errors = []
    rel = mdx_path.relative_to(DOCS_ROOT)
    ignore = ignore_codes or set()

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", prefix="doc_example_", delete=False
    ) as f:
        f.write(code)
        tmp_path = Path(f.name)

    try:
        result = subprocess.run(
            ["genvm-lint", "check", str(tmp_path), "--json"],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            import json

            try:
                data = json.loads(result.stdout)
                for w in data.get("warnings", []):
                    code_id = w.get("code", "")
                    if code_id in ignore:
                        continue
                    if code_id.startswith("E"):
                        w_line = w.get("line", "?")
                        if isinstance(w_line, int) and line_offset:
                            w_line = max(1, w_line - line_offset)
                        errors.append(
                            f"{rel}:{line}+{w_line}: [{code_id}] {w.get('msg', '')}"
                        )
            except json.JSONDecodeError:
                errors.append(f"{rel}:{line}: genvm-lint failed: {result.stderr.strip()}")
    except FileNotFoundError:
        errors.append("genvm-lint not found — install with: pipx install genvm-linter")
    except subprocess.TimeoutExpired:
        errors.append(f"{rel}:{line}: genvm-lint timed out")
    finally:
        tmp_path.unlink(missing_ok=True)

    return errors


def classify_snippet(code: str) -> str:
    """Classify a GenLayer snippet as 'method', 'function', or 'statement'."""
    stripped = code.strip()
    lines = stripped.split("\n")
    first_line = lines[0].strip()

    # Method: has @gl.public decorator or def with self
    if first_line.startswith("@gl.public") or first_line.startswith("@gl.evm"):
        return "method"
    for line in lines:
        line_s = line.strip()
        if line_s.startswith("def ") and "(self" in line_s:
            return "method"

    # Function: starts with def
    if first_line.startswith("def ") or (
        first_line.startswith("@") and any(l.strip().startswith("def ") for l in lines)
    ):
        return "function"

    # Class definition
    if first_line.startswith("class "):
        return "class-def"

    return "statement"


def wrap_snippet(code: str, snippet_type: str, runner_hash: str) -> str:
    """Wrap a snippet in a minimal contract shell for linting."""
    header = (
        "# {\n"
        '#   "Seq": [\n'
        f'#     {{ "Depends": "py-genlayer:{runner_hash}" }}\n'
        "#   ]\n"
        "# }\n"
        "from genlayer import *\n"
        "import json\n\n"
    )

    if snippet_type == "method":
        indented = textwrap.indent(code, "    ")
        return header + "@gl.contract\nclass _DocSnippet(gl.Contract):\n" + indented

    if snippet_type == "class-def":
        return header + code + "\n\n@gl.contract\nclass _DocSnippet(gl.Contract):\n    pass\n"

    if snippet_type == "function":
        return header + code + "\n\n@gl.contract\nclass _DocSnippet(gl.Contract):\n    pass\n"

    # statement — wrap inside a method
    indented = textwrap.indent(code, "        ")
    return (
        header
        + "@gl.contract\nclass _DocSnippet(gl.Contract):\n"
        + "    @gl.public.view\n"
        + "    def _check(self):\n"
        + indented
    )


def syntax_check(code: str) -> str | None:
    """Check if code is valid Python. Returns error message or None."""
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return f"line {e.lineno}: {e.msg}"


SNIPPET_IGNORE_CODES = {
    "E010",  # nondet outside eq_principle — snippets show functions in isolation
    "E011",  # multiple contracts in module — wrapper adds a second contract class
    "E020",  # view methods need return type — wrapper artifact
}


def lint_snippet(code: str, snippet_type: str, runner_hash: str, mdx_path: Path, line: int) -> list[str]:
    """Wrap a snippet and lint it. Returns error strings."""
    wrapped = wrap_snippet(code, snippet_type, runner_hash)
    # Calculate wrapper line offset (lines added before the snippet code)
    wrapper_lines = wrapped.split("\n")
    first_code_line = code.strip().split("\n")[0].strip()
    offset = 0
    for i, wl in enumerate(wrapper_lines):
        if first_code_line in wl:
            offset = i
            break

    return lint_contract(
        wrapped, mdx_path, line, line_offset=offset, ignore_codes=SNIPPET_IGNORE_CODES
    )


def check_deprecated_apis(mdx_path: Path) -> list[str]:
    """Check for deprecated API usage in both code blocks and prose."""
    errors = []
    rel = mdx_path.relative_to(DOCS_ROOT)
    content = mdx_path.read_text()

    for i, line_text in enumerate(content.split("\n"), 1):
        for old_api, new_api in DEPRECATED_APIS.items():
            if old_api in line_text:
                errors.append(
                    f"{rel}:{i}: deprecated API '{old_api}' → use '{new_api}'"
                )

    return errors


def fix_versions(version_hash: str, blocks: list[tuple[Path, dict]]):
    """Replace test/latest hashes with a specific version in MDX files."""
    files_to_fix: dict[Path, list[tuple[str, str]]] = {}

    for mdx_path, block in blocks:
        for name, hash_val in block["depends"].items():
            if hash_val in DISALLOWED_HASHES:
                files_to_fix.setdefault(mdx_path, []).append((name, hash_val))

    for mdx_path, replacements in files_to_fix.items():
        content = mdx_path.read_text()
        for name, old_hash in replacements:
            content = content.replace(f'"{name}:{old_hash}"', f'"{name}:{version_hash}"')
        mdx_path.write_text(content)
        rel = mdx_path.relative_to(DOCS_ROOT)
        print(f"  Fixed {rel}: {len(replacements)} hash(es) → {version_hash}")


def main():
    parser = argparse.ArgumentParser(description="Lint Python code examples in docs")
    parser.add_argument(
        "--fix-version",
        help="Replace test/latest hashes with this version (e.g., the latest runner hash)",
    )
    parser.add_argument(
        "--check-versions-only",
        action="store_true",
        help="Only check runner versions, skip AST lint",
    )
    parser.add_argument(
        "--lint-snippets",
        action="store_true",
        help="Also lint GenLayer snippets (wrapped in fake contracts)",
    )
    args = parser.parse_args()

    # Collect all code blocks
    all_contracts: list[tuple[Path, dict]] = []
    all_snippets: list[tuple[Path, dict]] = []
    total_blocks = 0

    for mdx_file in sorted(DOCS_ROOT.rglob("*.mdx")):
        # Skip unmigrated advanced examples
        if "/_advanced/" in str(mdx_file) or "/_" in mdx_file.name:
            continue

        blocks = extract_python_blocks(mdx_file)
        total_blocks += len(blocks)

        for block in blocks:
            if block["is_contract"]:
                all_contracts.append((mdx_file, block))
            elif block["is_genlayer"]:
                all_snippets.append((mdx_file, block))

    print(
        f"Found {total_blocks} Python code blocks, "
        f"{len(all_contracts)} complete contracts, "
        f"{len(all_snippets)} GenLayer snippets"
    )
    print()

    # Fix versions if requested
    if args.fix_version:
        print(f"Fixing runner hashes to: {args.fix_version}")
        fix_versions(args.fix_version, all_contracts)
        print()

        # Re-parse after fixing
        all_contracts = []
        for mdx_file in sorted(DOCS_ROOT.rglob("*.mdx")):
            if "/_advanced/" in str(mdx_file) or "/_" in mdx_file.name:
                continue
            for block in extract_python_blocks(mdx_file):
                if block["is_contract"]:
                    all_contracts.append((mdx_file, block))

    errors = []

    # Check runner versions
    print("Checking runner versions...")
    version_errors = check_runner_versions(all_contracts)
    errors.extend(version_errors)
    for e in version_errors:
        print(f"  ✗ {e}")
    if not version_errors:
        print("  ✓ All runner versions OK")
    print()

    # Check for deprecated API usage
    print("Checking for deprecated APIs...")
    deprecated_files = set()
    for mdx_file in sorted(DOCS_ROOT.rglob("*.mdx")):
        if "/_advanced/" in str(mdx_file) or "/_" in mdx_file.name:
            continue
        dep_errors = check_deprecated_apis(mdx_file)
        if dep_errors:
            deprecated_files.add(mdx_file)
            for e in dep_errors:
                print(f"  ✗ {e}")
            errors.extend(dep_errors)
    if not deprecated_files:
        print("  ✓ No deprecated APIs found")
    print()

    # Lint contracts
    if not args.check_versions_only:
        print("Running AST lint on complete contracts...")
        for mdx_path, block in all_contracts:
            rel = mdx_path.relative_to(DOCS_ROOT)
            lint_errors = lint_contract(block["code"], mdx_path, block["line"])
            if lint_errors:
                for e in lint_errors:
                    print(f"  ✗ {e}")
                errors.extend(lint_errors)
            else:
                print(f"  ✓ {rel}:{block['line']}")
        print()

    # Syntax-check GenLayer snippets
    if all_snippets:
        print("Syntax-checking GenLayer snippets...")
        syntax_errors = 0
        for mdx_path, block in all_snippets:
            rel = mdx_path.relative_to(DOCS_ROOT)
            err = syntax_check(block["code"])
            if err:
                msg = f"{rel}:{block['line']}: syntax error: {err}"
                print(f"  ✗ {msg}")
                errors.append(msg)
                syntax_errors += 1
        if not syntax_errors:
            print(f"  ✓ All {len(all_snippets)} snippets parse OK")
        print()

    # Lint wrapped snippets
    if args.lint_snippets and all_snippets and not args.check_versions_only:
        # Get runner hash from first contract for the wrapper
        runner_hash = "test"
        for _, block in all_contracts:
            if block["depends"].get("py-genlayer"):
                runner_hash = block["depends"]["py-genlayer"]
                break

        print("Linting wrapped GenLayer snippets...")
        snippet_warnings = 0
        for mdx_path, block in all_snippets:
            rel = mdx_path.relative_to(DOCS_ROOT)
            snippet_type = classify_snippet(block["code"])
            lint_errors = lint_snippet(
                block["code"], snippet_type, runner_hash, mdx_path, block["line"]
            )
            if lint_errors:
                for e in lint_errors:
                    print(f"  ⚠ {e}")
                snippet_warnings += 1
                # Don't add to errors — these are advisory for now
            else:
                print(f"  ✓ {rel}:{block['line']} ({snippet_type})")
        if snippet_warnings:
            print(f"  {snippet_warnings} snippet(s) had lint issues (advisory)")
        print()

    if errors:
        print(f"✗ {len(errors)} issue(s) found")
        sys.exit(1)
    else:
        print("✓ All checks passed")


if __name__ == "__main__":
    main()

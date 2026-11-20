#!/usr/bin/env python3
"""Behavioural regression tests for contracts on the Code Snippets docs page.

The snippets are extracted from the MDX source and executed against a minimal
mock of the `genlayer` module, so the tests check the code readers copy.

Usage:
    python scripts/test-snippets.py
"""

import re
import sys
import types
from pathlib import Path

SNIPPETS_MDX = (
    Path(__file__).parent.parent
    / "pages/developers/intelligent-contracts/examples/snippets.mdx"
)
CODE_BLOCK_RE = re.compile(r"```python\n(.*?)```", re.DOTALL)


def extract_contract(class_name: str) -> str:
    for code in CODE_BLOCK_RE.findall(SNIPPETS_MDX.read_text()):
        if f"class {class_name}(" in code:
            return code
    raise AssertionError(f"{class_name} snippet not found in {SNIPPETS_MDX}")


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class UserError(Exception):
    pass


class ConsensusRejected(Exception):
    pass


def make_genlayer(llm_responses: list):
    """Mock genlayer module. `llm_responses` is consumed in call order."""

    def exec_prompt(prompt, **kwargs):
        assert kwargs.get("response_format") == "json"
        return llm_responses.pop(0)

    def run_nondet_unsafe(leader_fn, validator_fn):
        try:
            leader_result = Return(leader_fn())
        except UserError as e:
            leader_result = e
        if not validator_fn(leader_result):
            raise ConsensusRejected(leader_result)
        if isinstance(leader_result, UserError):
            raise leader_result
        return leader_result.calldata

    page = types.SimpleNamespace(body=b"<html>some page</html>")
    identity = lambda f: f  # noqa: E731
    gl = types.SimpleNamespace(
        Contract=object,
        public=types.SimpleNamespace(write=identity, view=identity),
        nondet=types.SimpleNamespace(
            web=types.SimpleNamespace(get=lambda url: page),
            exec_prompt=exec_prompt,
        ),
        vm=types.SimpleNamespace(
            Return=Return, UserError=UserError, run_nondet_unsafe=run_nondet_unsafe
        ),
    )
    module = types.ModuleType("genlayer")
    module.gl = gl
    module.TreeMap = dict
    module.__all__ = ["gl", "TreeMap"]
    return module


def run_classifier(leader_response, validator_response):
    code = extract_contract("PageClassifier")
    sys.modules["genlayer"] = make_genlayer([leader_response, validator_response])
    namespace: dict = {}
    exec(compile(code, str(SNIPPETS_MDX), "exec"), namespace)
    contract = namespace["PageClassifier"]()
    contract.labels = {}
    contract.classify("https://example.com/")
    return contract.get_label("https://example.com/")


def expect_rejected(leader_response, validator_response):
    try:
        label = run_classifier(leader_response, validator_response)
    except (UserError, ConsensusRejected):
        return
    raise AssertionError(
        f"expected rejection for leader={leader_response!r} "
        f"validator={validator_response!r}, but stored {label!r}"
    )


def test_valid_label_is_stored():
    assert run_classifier({"label": "sports"}, {"label": "sports"}) == "sports"


def test_out_of_set_label_is_rejected_even_if_validators_agree():
    expect_rejected({"label": "hacked"}, {"label": "hacked"})


def test_validator_rejects_out_of_set_leader_value():
    code = extract_contract("PageClassifier")
    sys.modules["genlayer"] = make_genlayer([{"label": "hacked"}])
    namespace: dict = {}
    exec(compile(code, str(SNIPPETS_MDX), "exec"), namespace)
    gl = sys.modules["genlayer"].gl
    captured = {}

    def capture(leader_fn, validator_fn):
        captured["validator_fn"] = validator_fn
        return "unused"

    gl.vm.run_nondet_unsafe = capture
    contract = namespace["PageClassifier"]()
    contract.labels = {}
    contract.classify("https://example.com/")
    # A malicious leader bypasses its own check and returns an off-list label.
    assert captured["validator_fn"](Return("hacked")) is False


def test_malformed_responses_are_rejected():
    expect_rejected({}, {"label": "sports"})
    expect_rejected(["sports"], {"label": "sports"})
    expect_rejected({"label": None}, {"label": None})


def test_disagreeing_validator_rejects():
    expect_rejected({"label": "sports"}, {"label": "finance"})


def main() -> int:
    tests = [(n, f) for n, f in globals().items() if n.startswith("test_")]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  ✓ {name}")
        except Exception as e:  # noqa: BLE001 - report every failure
            failed += 1
            print(f"  ✗ {name}: {e}")
    print(f"\n{len(tests) - failed}/{len(tests)} snippet tests passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

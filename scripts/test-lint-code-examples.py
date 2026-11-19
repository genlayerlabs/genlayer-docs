"""Regression checks for required documentation snippets."""

import contextlib
import importlib.util
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location(
    "lint_examples", Path(__file__).with_name("lint-code-examples.py")
)
lint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lint)


class RequiredSnippetTests(unittest.TestCase):
    def setUp(self):
        self.page = lint.DOCS_ROOT / "developers/intelligent-contracts/features/image-processing.mdx"
        self.blocks = lint.extract_python_blocks(self.page)
        self.example = next(block for block in self.blocks if "def compare_images(" in block["code"])

    def test_only_comparison_is_required(self):
        self.assertEqual([b for b in self.blocks if b["lint_required"]], [self.example])

    def test_invalid_error_namespace_is_rejected(self):
        code = self.example["code"].replace("gl.vm.UserError", "gl.UserError")
        errors = lint.lint_snippet(code, "function", "test", self.page, self.example["line"])
        self.assertTrue(any("invalid API gl.UserError" in error for error in errors))

    def test_valid_namespace_reaches_sdk_linter(self):
        with patch.object(lint, "lint_contract", return_value=[]) as check:
            self.assertEqual(lint.lint_snippet(
                self.example["code"], "function", "test", self.page, self.example["line"]
            ), [])
        self.assertIn('raise gl.vm.UserError(', check.call_args.args[0])

    def test_required_lint_failure_fails_default_command(self):
        with (
            patch("sys.argv", ["lint-code-examples.py"]),
            patch.object(Path, "rglob", return_value=[self.page]),
            patch.object(lint, "lint_contract", return_value=[]),
            patch.object(lint, "lint_snippet", return_value=["required snippet failure"]) as check,
            contextlib.redirect_stdout(io.StringIO()),
            self.assertRaises(SystemExit) as result,
        ):
            lint.main()
        self.assertEqual(result.exception.code, 1)
        check.assert_called_once()
        self.assertEqual(check.call_args.args[0], self.example["code"])


if __name__ == "__main__":
    unittest.main()

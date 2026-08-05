#!/usr/bin/env python3

import os
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.package_skill import package_skill, should_exclude
from scripts.quick_validate import validate_skill


class QuickValidateTests(unittest.TestCase):
    def write_skill(self, parent: Path, directory: str, name: str, description: str) -> Path:
        skill = parent / directory
        skill.mkdir()
        (skill / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: {description}\n---\n\n# Test\n",
            encoding="utf8",
        )
        return skill

    def test_valid_skill_returns_budget(self):
        with tempfile.TemporaryDirectory() as temp:
            skill = self.write_skill(Path(temp), "valid-skill", "valid-skill", "Use for validation tests.")
            result = validate_skill(skill)
            self.assertTrue(result[0])
            self.assertEqual(len(result), 3)
            self.assertIn("body_estimated_tokens", result[2])

    def test_rejects_empty_required_fields(self):
        with tempfile.TemporaryDirectory() as temp:
            skill = self.write_skill(Path(temp), "empty-name", "''", "Use for validation tests.")
            self.assertEqual(validate_skill(skill)[:2], (False, "Name must not be empty"))

    def test_rejects_name_directory_mismatch(self):
        with tempfile.TemporaryDirectory() as temp:
            skill = self.write_skill(Path(temp), "actual-name", "different-name", "Use for validation tests.")
            valid, message = validate_skill(skill)[:2]
            self.assertFalse(valid)
            self.assertIn("must match parent directory", message)

    def test_packager_excludes_private_config_and_development_files(self):
        self.assertTrue(should_exclude(Path("attribution/references/attribution-config.md")))
        self.assertTrue(should_exclude(Path("brain/evals/evals.json")))
        self.assertFalse(should_exclude(Path("brain/scripts/audit-vault.test.ts")))
        self.assertFalse(should_exclude(Path("brain/references/vault-contract.md")))
        self.assertFalse(should_exclude(Path("brain/references/brain-config.example.json")))

    def test_packager_does_not_include_its_own_output(self):
        with tempfile.TemporaryDirectory() as temp:
            skill = self.write_skill(Path(temp), "inside-output", "inside-output", "Use for packaging tests.")
            previous = Path.cwd()
            try:
                os.chdir(skill)
                archive = package_skill(skill)
            finally:
                os.chdir(previous)
            self.assertIsNotNone(archive)
            with zipfile.ZipFile(archive) as package:
                self.assertNotIn("inside-output/inside-output.skill", package.namelist())


if __name__ == "__main__":
    unittest.main()

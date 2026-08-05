import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateSuite } from "./validate-suite.js";

test("the repository brain suite is internally complete", () => {
  const skillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  assert.deepEqual(validateSuite(skillsRoot), []);
});

test("reports missing, mismatched, and legacy skills", () => {
  const root = mkdtempSync(join(tmpdir(), "brain-suite-"));
  try {
    const manifest = {
      suiteVersion: 2,
      contractVersion: 2,
      foundation: "brain",
      skills: ["brain", "brain-recall"],
    };
    const manifestPath = join(root, "brain/references/suite-manifest.json");
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
    writeFileSync(join(root, "brain/SKILL.md"), "---\nname: brain\ndescription: x\n---\n", "utf8");
    mkdirSync(join(root, "deep-dive"), { recursive: true });
    writeFileSync(join(root, "deep-dive/SKILL.md"), "---\nname: deep-dive\ndescription: x\n---\n", "utf8");
    const codes = new Set(validateSuite(root).map((finding) => finding.code));
    assert.ok(codes.has("missing-evals"));
    assert.ok(codes.has("missing-skill"));
    assert.ok(codes.has("legacy-skill"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

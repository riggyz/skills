import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { reportPatterns } from "./report-patterns.js";

function writeRecord(
  vault: string,
  owner: string,
  slug: string,
  fields: Partial<Record<string, string | string[] | boolean>> = {},
): string {
  const [kind, ownerSlug] = owner.split("/");
  const directory = kind === "global" ? "gotchas" : `${kind}s/${ownerSlug}/gotchas`;
  const path = join(vault, directory, `${slug}.md`);
  mkdirSync(dirname(path), { recursive: true });
  const values: Record<string, string | string[] | boolean> = {
    brain_schema: "pattern-record/v1",
    brain_id: `gotcha/${owner}/${slug}`,
    brain_lane: "gotcha",
    brain_owner: owner,
    brain_pattern: "cache/generated-state-must-be-invalidated",
    brain_status: "verified",
    brain_stance: "supports",
    brain_occurrence: `incident/${owner}/${slug}`,
    brain_primary_evidence: [`repo:${owner}@${slug}`],
    brain_derived_from: [],
    brain_provenance_complete: true,
    brain_applies_to: ["tool/build-systems"],
    ...fields,
  };
  const yaml = Object.entries(values).map(([key, value]) => {
    if (Array.isArray(value)) return `${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    return `${key}: ${typeof value === "string" ? JSON.stringify(value) : value}`;
  }).join("\n");
  writeFileSync(path, `---\n${yaml}\n---\n\n# ${slug}\n\nSource edits did not invalidate derived state.\n`, "utf8");
  return path;
}

test("three independent structured gotchas become eligible", () => {
  const vault = mkdtempSync(join(tmpdir(), "brain-patterns-"));
  try {
    writeRecord(vault, "project/one", "one");
    writeRecord(vault, "project/two", "two");
    writeRecord(vault, "project/three", "three");
    const report = reportPatterns(vault);
    assert.equal(report.candidates.length, 1);
    assert.equal(report.candidates[0].target, "tool/build-systems");
    assert.equal(report.candidates[0].eligibleForAutomaticPromotion, true);
    assert.equal(report.candidates[0].counts.independentOccurrences, 3);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("copies of one occurrence do not qualify", () => {
  const vault = mkdtempSync(join(tmpdir(), "brain-patterns-copy-"));
  try {
    for (const owner of ["project/one", "project/two", "workspace/hub"]) {
      writeRecord(vault, owner, owner.replace("/", "-"), {
        brain_occurrence: "incident/shared/one",
        brain_primary_evidence: ["repo:shared@abc"],
      });
    }
    const candidate = reportPatterns(vault).candidates[0];
    assert.equal(candidate.eligibleForAutomaticPromotion, false);
    assert.equal(candidate.counts.independentOccurrences, 1);
    assert.ok(candidate.blockers.includes("fewer-than-three-independent-occurrences"));
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("normative records require authority", () => {
  const vault = mkdtempSync(join(tmpdir(), "brain-patterns-decision-"));
  try {
    for (const owner of ["project/one", "project/two", "project/three"]) {
      writeRecord(vault, owner, owner.replace("/", "-"), {
        brain_lane: "decision",
        brain_id: `decision/${owner}/choice`,
      });
    }
    const candidate = reportPatterns(vault).candidates[0];
    assert.equal(candidate.eligibleForAutomaticPromotion, false);
    assert.ok(candidate.blockers.includes("missing-decision-authority"));
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("reporting is deterministic and read-only", () => {
  const vault = mkdtempSync(join(tmpdir(), "brain-patterns-stable-"));
  try {
    const path = writeRecord(vault, "project/one", "one");
    const before = readFileSync(path, "utf8");
    const mtime = statSync(path).mtimeMs;
    assert.deepEqual(reportPatterns(vault), reportPatterns(vault));
    assert.equal(readFileSync(path, "utf8"), before);
    assert.equal(statSync(path).mtimeMs, mtime);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

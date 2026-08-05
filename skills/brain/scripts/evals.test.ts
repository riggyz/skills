import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

interface EvalFile {
  skill_name: string;
  evals: Array<{
    id: number;
    prompt: string;
    expected_output: string;
    files: unknown[];
    expectations: string[];
  }>;
}

const suite = [
  "brain",
  "brain-contextualize",
  "brain-recall",
  "brain-remember",
  "brain-consolidate",
  "brain-synthesize",
  "brain-build",
] as const;

test("brain suite eval corpora cover every operator and near-miss boundary", () => {
  const skillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const prompts: string[] = [];
  for (const skill of suite) {
    const path = resolve(skillsRoot, skill, "evals", "evals.json");
    const payload = JSON.parse(readFileSync(path, "utf8")) as EvalFile;
    assert.equal(payload.skill_name, skill);
    assert.ok(payload.evals.length >= 3, `${skill} needs at least three evals`);
    assert.equal(new Set(payload.evals.map((item) => item.id)).size, payload.evals.length);
    assert.ok(payload.evals.every((item) => item.prompt && item.expected_output && item.expectations.length > 0));
    assert.ok(payload.evals.every((item) => Array.isArray(item.files)));
    prompts.push(...payload.evals.map((item) => item.prompt.toLowerCase()));
  }

  const corpus = prompts.join("\n");
  for (const boundary of [
    "find the auth handler",
    "consolidate these two application modules",
    "synthesize this supplied meeting transcript",
    "run npm build",
    "api token",
  ]) {
    assert.ok(corpus.includes(boundary), `missing near-miss/safety coverage for ${boundary}`);
  }
});

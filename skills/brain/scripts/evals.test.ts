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
    expectations: string[];
  }>;
}

test("brain behavior evals cover the load-bearing trigger families", () => {
  const path = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../evals/evals.json",
  );
  const payload = JSON.parse(readFileSync(path, "utf8")) as EvalFile;
  assert.equal(payload.skill_name, "brain");
  assert.equal(new Set(payload.evals.map((item) => item.id)).size, payload.evals.length);
  assert.ok(payload.evals.every((item) => item.expectations.length > 0));

  const prompts = payload.evals.map((item) => item.prompt.toLowerCase()).join("\n");
  for (const required of [
    "remember this",
    "extract what we learned",
    "generic parent",
    "graph palette",
    "project memory note contains",
    "vault audit",
  ]) {
    assert.ok(prompts.includes(required), `missing eval coverage for ${required}`);
  }
});

# Brain Suite Evaluations

Each operator has `evals/evals.json`. Deterministic tests validate corpus shape and load-bearing near misses; they do not execute a model.

Evaluate routing with all seven descriptions visible. Runs for an operator include the `brain` foundation plus that operator. Compare against the previous monolithic brain snapshot when measuring migration regressions.

Minimum review dimensions:

- exactly one primary workflow per prompt;
- declared helper order only;
- zero mutation from contextualize and recall;
- bounded canonical writes from remember;
- no semantic promotion from consolidate;
- synthesis copy/authority/provenance gates and idempotence;
- `brain-build` near misses for ordinary compilation;
- context tokens, tool calls, latency, and files changed.

Keep model-eval workspaces outside this repository so recursive skill discovery cannot find snapshot `SKILL.md` files.

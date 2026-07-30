# Brain Behavioral Evals

`evals.json` defines behavior-level cases for startup, implicit and explicit capture, checkpointing, project registration, generic-parent ambiguity, trust boundaries, and maintenance.

`npm test` validates that the eval set is well-formed and retains coverage of the load-bearing trigger families. It does **not** execute language-model runs.

To compare a revision:

1. Snapshot the previous `skills/brain/` outside the repository.
2. Use the `skill-creator` workflow to run each selected prompt against the current skill and snapshot in parallel.
3. Grade only observable output/tool/file evidence against `expectations`.
4. Generate the standard eval viewer before deciding whether to retain the revision.

The 2026-07-30 implementation pass ran all eight evals as paired procedure traces:

- revised skill: 35/35 expectations passed;
- pre-edit snapshot: 21/35 expectations passed;
- largest gains: bounded startup, canonical person-note capture, complete Graph registration, exact typed-index/Graph maintenance, and primary-user loading from a generic parent;
- the untrusted-memory and explicit-extract cases passed under both versions, so they verify non-regressions but did not discriminate between prompts.

Procedure traces are useful for instruction coverage but do not replace mutation-level fixture tests. The bundled vault doctor and configuration tests provide deterministic filesystem coverage for structural behavior.

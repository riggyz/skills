---
name: brain-synthesize
description: Find repeated verified mechanisms across brain owners and automatically promote only high-confidence patterns into global or narrower gotcha, decision, code-style, or recurring-improvement records. Use after eligible structured writes and for explicit/scheduled brain-wide pattern passes. Do not use for generic summarization, single-node facts, cleanup, repair, or unsupported inference.
compatibility: Requires the matching brain foundation, brain-recall for evidence, brain-remember write invariants, and vault read/write access.
---

# Brain Synthesize

Turn repeated experience into reusable memory without inflating copies or inventing policy.

## Modes

- **Targeted:** cheap check around newly written structured records; invoked automatically by `brain-remember` and `brain-build`.
- **Full:** explicit or host-scheduled brain-wide prevalence pass.

Run the bundled read-only reporter first. Candidate scores rank review; they never override blockers.

```sh
npx tsx <brain-synthesize-directory>/scripts/report-patterns.ts report \
  --vault-path "<vault-path>" --strict
```

## Evidence Rules

- Count independent occurrences and lineages, not repeated wording.
- A workspace summary and a member project repeating one incident count once.
- Promoted summaries, vendored copies, and derived records are not fresh evidence.
- Legacy prose may produce report-only candidates but cannot auto-promote.
- Contradictions, ambiguous ownership, incomplete provenance, suspicious copies, or a human-authored target collision block automatic writes.
- Choose the narrowest valid scope: project, workspace, wiki, tool, then global.

## Lane Gates

- **Gotcha:** same causal trap, complete provenance, no contradiction, and at least three verified independent occurrences from three independent leaf owners.
- **Decision:** explicit authority covers the target scope. Repeated implementation never creates user intent.
- **Code style:** direct user/org authority or a canonical config explicitly designated for the target scope. Repository-local instructions always override.
- **Recurring improvement:** at least three independent occurrences, common remediation, brain ownership rather than product-tracker ownership, and automatic priority no higher than medium.

## Automatic Apply

When every static and semantic gate passes:

1. Recall bounded source records and any existing target.
2. Confirm mechanism, independence, scope, authority, novelty, and exceptions.
3. Build a plan containing candidate/revision fingerprints and exact source IDs.
4. Revalidate the plan against current vault hashes.
5. Load `brain-remember` and create/update only a synthesis-owned atomic record or stable improvement item.
6. Link the corresponding root/owner router, preserve every source record, and record provenance/fingerprints.
7. Rerun targeted reporting plus structural audit; the result must become promoted/no-op.

Fully automatic means no per-candidate user ceremony after explicit or lifecycle-authorized synthesis invocation. Explicit no-write instructions still win. Never overwrite unrelated human-authored records or delete/merge source evidence.

## Output

Report promoted, already-present, blocked, and skipped candidates concisely. A silent no-op is normal after a targeted check.

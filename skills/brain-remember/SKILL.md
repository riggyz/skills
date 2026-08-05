---
name: brain-remember
description: Persist durable brain memory during normal work, proactively or on explicit remember requests, and checkpoint meaningful milestones or pre-compaction context. Search before writing and update the owning wiki, project, workspace, or tool. Do not use for ephemeral status, structural audits/repairs, destructive forgetting, global pattern promotion itself, or full source onboarding.
compatibility: Requires the matching brain foundation and write access to its configured vault.
---

# Brain Remember

Own normal memory writes. The user should not need magic words.

## Retention Gate

Write only when an item is durable, useful later, grounded or clearly attributed, scoped to a canonical owner, novel, safe, and not better owned by repository docs or a tracker. Reject secrets, transient progress, raw transcripts, vague complaints, and unsupported conclusions.

Signals include preferences/corrections, project or workspace constraints, explicit decisions, verified traps, reusable procedures, source references/artifacts, and concrete agent/tool/vault friction.

## Atomic Capture

1. Load `brain` and the vault contract.
2. Resolve the narrowest owner: wiki, project, workspace, tool, or eligible global collection.
3. Search the owner and relevant global records for duplicates, supersessions, or contradictions.
4. Verify or attribute the fact. Keep hypotheses provisional.
5. Update the current entry/router or create an earned atomic record.
6. Preserve `created:`, set `updated:` to today, maintain owner tags, links, status, and provenance.
7. For synthesis-eligible decision/gotcha/codestyle records, add structured `brain_*` occurrence, evidence, authority, and pattern metadata only when known; never fabricate provenance to qualify promotion.
8. Verify touched files. Explicit remember requests receive one concise destination confirmation; implicit capture is silent unless relevant.
9. Invoke a targeted `brain-synthesize` check after an eligible structured write. A no-op is expected when evidence is insufficient.

## Checkpoint Mode

Use at milestones, wrap-up, meaningful topic switches, and before compaction.

1. Review the session once for uncaptured durable facts, decisions, gotchas, preferences, references, artifacts, improvements, and changed mental models.
2. Deduplicate against existing memory and same-session atomic captures.
3. Batch only necessary canonical writes.
4. Move dated evidence to cold history when it should survive but not remain hot.
5. Run targeted synthesis for newly structured eligible records and report the checkpoint briefly.

## Improvements

Brain improvements are small owner-scoped queues, not product trackers or changelogs. Put tool-specific friction under that tool, project-specific agent friction under the project, workspace-wide friction under the workspace, and brain-wide work under `tools/brain/improvements.md`. Root `improvements.md` only routes queues.

## Artifacts

Read the foundation artifact policy. Copy rather than move source files, record provenance, and link sensitive/large/repository-owned material instead of mirroring it.

## Boundaries

- Do not move, merge, delete, broadly rewrite stale memory, or edit graph configuration.
- Do not create a global decision from repeated implementation or infer code style from incidental formatting.
- Use `brain-build` for substantial new-node onboarding and `brain-consolidate` for structural repair.
- Explicit no-write instructions win.

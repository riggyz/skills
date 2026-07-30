# Guide — Continuous Improvement

Maintain a small backlog of actionable agent/tool/vault friction. This is not a second product issue tracker.

## Scope

- **Root `improvements.md`:** cross-project agent environment, skills, MCPs, tools, vault hygiene, and global workflow friction.
- **Project `projects/<slug>/improvements.md`:** project-specific friction that matters to future agent work but is not accepted product work in the project's tracker.
- **Project tracker:** product bugs, features, code debt, and team-owned work. Link to the tracker from memory only when future-agent context needs the pointer.

A factual gotcha and an actionable improvement can require two records: the gotcha explains current behavior; the backlog records a proposed remediation. Do not duplicate the same prose mechanically.

## Workflow 1 — Opportunistic Capture

### Trigger

Capture without derailing the current task when:

- a skill, MCP, tool, permission, or vault workflow has a concrete defect;
- agent onboarding/retrieval is blocked by missing or stale context;
- the user notes fix-later dissatisfaction with an agent/tool/vault behavior;
- a maintenance check exposes actionable structural debt.

Do not log the current task, vague dislikes, unverified complaints, or work that belongs in the project's tracker.

### Procedure

1. Read the relevant backlog once per session and dedupe.
2. Choose root or project scope using the rules above.
3. Insert one concise item under `## Open` before terminal tags:

   ```markdown
   - [ ] YYYY-MM-DD (low|med|high) — [[target]] — description. (proposed fix, if useful)
   ```

4. Set existing `updated:` frontmatter to today.
5. If creating a project backlog, link it from the project entry point and from the root backlog's per-project index. Preserve `#project/<slug> #improvement` as the final tag line.
6. Remain silent unless the capture affects the current conversation.

Default to low priority. High means the issue is actively causing damage, data loss, security risk, or repeated task failure.

## Workflow 2 — Explicit Improvement Pass

Run a pass only when the user asks to review or work the backlog.

1. Read only the requested scope. For a broad pass, begin at root and use its project-backlog links.
2. Surface grouped open items and recommend an order.
3. Confirm which items are in scope before changing external systems or project code.
4. Work one item at a time. Re-read its target and verify the defect still exists.
5. When fixed, move it in the same file to `## Fixed (recent)` with a concise result. Set `updated:` to today.
6. During maintenance, propose pruning fixed entries older than roughly 30 days; delete them only with the user's confirmation. The backlog is not a changelog, but removal is still irreversible.
7. Report fixed, skipped, stale, and newly discovered items.

Do not mark an item fixed because it was deprioritized. Lower its priority, leave a reason, or propose deletion for confirmation.

## Fresh Project Backlog Template

```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Improvements — <slug>

Agent-relevant project friction that should survive sessions but does not belong in the project tracker.

## Open

- [ ] YYYY-MM-DD (low|med|high) — description.

## Fixed (recent)

_(none yet)_

#project/<slug> #improvement
```

## Maintenance Signals

- More than roughly 10 relevant open items: mention backlog pressure at a natural checkpoint.
- 50+ total open items, many stale items, or checked items outside `Fixed`: run `consolidate/GUIDE.md` when requested.
- Duplicate tracker and brain entries: retain the tracker as authority and keep only a contextual pointer if needed.

## Red Flags

- A normal coding defect is being logged instead of fixed or filed in the tracker.
- Capture causes a context switch away from the current task.
- A backlog file is edited without bumping `updated:`.
- A pass starts fixing unrelated items without user scope confirmation.

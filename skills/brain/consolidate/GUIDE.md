# Guide — Vault Maintenance

Audit and repair existing memory. Use for cleanup, deduplication, stale review, forgetting, archival, project merge/deletion, oversized notes, backlog hygiene, or graph maintenance.

Read `references/vault-contract.md`. Before any graph mutation, read and follow `references/graph-maintenance.md`.

## When To Run

- The user asks to clean, consolidate, audit, forget, archive, merge, or delete memory.
- Orientation exposes obvious duplicates, contradictions, oversized startup notes, or broken navigation.
- A project merge/deletion requires lifecycle cleanup.
- The backlog or companion-note set has accumulated clear maintenance debt.

Do not perform a broad pass every session. Narrow hygiene on a note already being edited is normal; broad scans, moves, merges, pruning, and deletion are maintenance.

## Procedure

### 1. Scan

Use native files plus Obsidian graph-aware checks when available:

```text
Glob **/*.md under <brain-vault-path>
obsidian vault=<brain-vault-name> tags counts sort=count
obsidian vault=<brain-vault-name> orphans
obsidian vault=<brain-vault-name> unresolved
```

Run the bundled read-only doctor when available:

```sh
npx tsx <brain-skill-directory>/scripts/audit-vault.ts --vault-path "<brain-vault-path>"
```

Inspect these independently; no single orphan count proves vault health:

1. **Typed root index:** enumerate root `person-*`, `pref-*`, `tool-*`, `codestyle-*`, `decision-*`, and `gotcha-*` notes and diff them against their exact `index.md` sections. Detect missing, stale, duplicate, and wrong-section links.
2. **Project index:** diff immediate project folders and entry-point statuses against the Active/Dormant/Archived sections.
3. **Companion links:** every useful project note should be reachable from its entry point; incidental backlinks do not replace canonical navigation.
4. **Tags:** ordinary project Markdown has its final project tag; Excalidraw frontmatter tags are the documented exception.
5. **Graph:** diff project folders against exact trailing-slash color groups; detect missing/stale/duplicate/malformed groups and palette integer mismatches.
6. **Staleness/current truth:** find contradictory sections, “body below is stale” warnings, and mutable claims without verification context.
7. **Size:** flag prose-heavy index content, oversized entry points, and large default-read companions.
8. **Backlogs/work logs:** find duplicate/stale improvements, checked items outside `Fixed`, and dated PR/session notes whose durable lessons were already extracted.
9. **Relationships:** verify `depends_on`, reciprocal `used_by`, and prose agree.
10. **Tag hygiene:** find bare issue forms such as `#71/#54` or `#292/PR` that create phantom Obsidian tags.

### 2. Plan

For each finding, classify the operation: link, edit, supersede, split, merge, move, archive, soft-forget, graph change, or delete.

Surface the plan before destructive or semantic-loss operations:

- deleting notes/artifacts;
- merging and deleting the duplicate;
- removing a project or graph group;
- discarding historical material that has not been preserved elsewhere.

Non-destructive metadata/link/tag repairs may proceed without individual confirmation. Graph edits still require the interactive ceremony.

### 3. Execute

**Current truth:** Rewrite stale project sections to match verified reality. Preserve useful rationale in dated decisions/evidence, not contradictory current prose. A comprehensive verified refresh is allowed; avoid unrelated churn.

**Duplicates:** Pick the canonical note, merge unique useful content, repair inbound links, then delete the duplicate only after confirmation.

**Moves:** Prefer Obsidian's `move path=<old> to=<new>` while the app is running so wikilinks update. Otherwise move with native tools and repair links explicitly.

**Index/links/tags:** Repair canonical navigation even when a note has incidental backlinks. Set `updated:` to today on every edited Markdown note. Preserve project terminal tags and the Excalidraw exception.

**Graph:** Apply additions/removals through `references/graph-maintenance.md`. A project merge/delete includes removing its stale group after content and links are preserved.

**Backlog/work-log lifecycle:** Keep tracker authority, remove duplicate brain tasks, move truly fixed items, and propose archive/deletion of temporary notes after durable lessons are captured.

**Forget requests:** Clarify scope if needed. Prefer supersede/archive/soft-forget when the user wants active recall removed but history remains useful. Permanently delete only with confirmation, except urgent secret redaction.

### 4. Verify

Re-run the relevant scan and read modified notes. Confirm:

- links resolve;
- index sections match files/statuses;
- project tags and `updated:` metadata are correct;
- current truth no longer contradicts itself;
- graph JSON is valid and the reload ceremony completed;
- no content was claimed deleted or moved when the operation failed.

### 5. Report

Summarize repairs, destructive actions approved, deferred questions, and any graph reload still pending. Do not dump the entire audit output unless requested.

## Guardrails

- Never delete or irreversibly merge without confirmation.
- Never treat a recent mtime or `updated:` date as factual verification.
- Never preserve known-false current-state prose merely to “preserve history.” Move useful history to the correct dated record.
- Never open/interact with Graph view between editing `graph.json` and the required reload.
- Never create empty companion stubs for completeness.

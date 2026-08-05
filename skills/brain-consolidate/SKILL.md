---
name: brain-consolidate
description: Audit, lint, migrate, deduplicate, repair, archive, forget, or delete the configured brain. Use for explicit vault cleanup/doctor requests and clear structural debt. Audit is read-only by default; repairs are planned and destructive or semantic-loss actions require confirmation. Do not use for ordinary capture, targeted recall, generic code consolidation, semantic pattern promotion, or onboarding.
compatibility: Requires the matching brain foundation and appropriate vault access. Graph mutations require interactive Obsidian coordination.
---

# Brain Consolidate

Own structural correctness and lifecycle maintenance. Do not invent semantic lessons.

## Modes

- **Audit:** run the read-only doctor and report findings.
- **Repair:** fix non-destructive routers, links, metadata, tags, relationships, and malformed records.
- **Migrate:** execute an approved architecture-version transaction with backup, ledger, and postflight checks.
- **Archive/forget/delete:** preserve current truth and evidence according to user intent; irreversible loss requires confirmation.

## Audit

Load `brain` and run:

```sh
npx tsx <brain-foundation-directory>/scripts/audit-vault.ts --vault-path "<vault-path>"
```

Check root routers, node registration/tags, atomic record reachability/provenance, workspace membership, project dependency reciprocity, cold-history isolation, links, note sizes, backlog lifecycle, issue tags, and managed graph groups. Orphans alone never prove health.

## Plan And Apply

Classify each operation as link, metadata repair, split, move, supersede, archive, soft-forget, graph change, or delete. Surface the plan before semantic-loss operations. Preserve snapshots before large migrations.

Prefer Obsidian-aware moves while the app is running. Treat live app-owned files and concurrent agents as competing writers: reread immediately before mutation and never parallelize a vault transaction.

Non-destructive structural repairs may proceed without per-item approval. Deleting notes/artifacts, merging then deleting a duplicate, discarding unpreserved history, and unrelated graph-group deletion require confirmation.

Every graph mutation follows the foundation graph-maintenance ceremony. If Graph views are open or the reload cannot complete, defer graph work rather than claiming success.

## V1 To V2 Migration

Recognize legacy root typed notes, singular `wiki/`, project-classified workspaces, and flat owner mega-notes as migration inputs. Migrate only after the v2 source suite/doctor is installed or available, a recoverable vault backup exists, source-to-destination coverage is complete, and one writer owns the transaction.

Verify routers, owner tags, links, memberships, dependencies, config paths, graph JSON, unresolved links, orphans, and representative recall after migration.

## Boundaries

- Do not capture ordinary facts or run checkpoints.
- Do not promote repeated patterns or rewrite global semantic records based on frequency.
- Do not mark a backlog item fixed without verifying the defect.
- Product work remains in its tracker.
- Explicit no-write and no-delete instructions win.

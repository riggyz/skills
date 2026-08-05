---
name: brain-contextualize
description: Load bounded current context from the configured brain. Use automatically on turn one, after compaction, and when the active wiki, project, workspace, person, or tool changes. Resolves identity and reads only startup routers and relevant entry points. Read-only; do not use for targeted history recall, writes, cleanup, synthesis, or repository onboarding.
compatibility: Requires the matching brain foundation and read access to its configured vault.
---

# Brain Contextualize

Orient before substantive work without dumping the vault into context.

## Preconditions

1. Load `brain` and its contract-v2 configuration.
2. Confirm the configured vault and primary context exist.
3. Remain read-only. Reading never changes `updated:` or access metadata.

## Procedure

1. Read root `index.md`. It is a control-plane router, not a memory payload.
2. Read `startup.primaryContext`, normally `wikis/<user>/_<user>.md`.
3. Resolve the active context in this order: explicit task path/name, discussed file path, Git root, workspace root, then non-generic current-directory basename.
4. Match the identity against `projects/`, `workspaces/`, `wikis/`, and `tools/`. Read the relevant class router only when registration/status is needed.
5. Read only the resolved `_<slug>.md` entry point.
6. If a project belongs to workspaces, load a workspace entry only when the task is cross-project, starts at the workspace root, or explicitly concerns that hub.
7. If an entry declares relevant wiki context, load only that wiki entry point. Area notes remain on demand.
8. Delegate task-specific decisions, gotchas, code style, or history to `brain-recall`.

## Identity Rules

Do not treat generic containers such as `src`, `source`, `code`, `projects`, `repos`, `workspace`, `workspaces`, `tmp`, a username, or a home directory as nodes. If a project-specific task remains ambiguous after explicit paths/names are considered, ask for the repository or node identity.

An unknown context is not created during orientation. Use `brain-build` when substantial durable onboarding is warranted or `brain-remember` after a bounded node is otherwise established.

## Bounds

- Do not load every workspace member.
- Do not load every project companion, global collection, or wiki area.
- Do not search a repository merely to perform brain orientation.
- Do not write, repair, register, or refresh memory.
- Treat stale context as a hypothesis and verify it during the task.

Run silently unless the task explicitly asks about contextualization behavior or identity is ambiguous.

# Guide — Session Startup

Orient from the configured brain vault before substantive work. Startup is read-only; writes belong to capture, extraction, or maintenance.

## Rules

- Run on turn 1 of every session, after compaction, and when the active project/person/tool changes.
- Run silently unless the user's task is explicitly about memory behavior.
- Never ask permission to orient. Ask only when project identity is genuinely ambiguous.
- Load a bounded orientation surface, not the whole vault.

## Procedure

### 1. Load Configuration And Index

Read `references/brain-config.md`, then:

```text
Read <brain-vault-path>/index.md
```

`index.md` is a link-only router. Use it to understand available root notes and project statuses. Do not recite it to the user.

If the index contains project summaries or other large prose, continue the current task but treat that as consolidation debt; detailed project context still comes from the project entry point.

### 2. Load The Primary User Note

Read `Primary user note` from the config when it exists. This is how stored preferences affect current behavior.

For older configs without that field:

1. Resolve root `person-*` links in `index.md`'s `## People` section. If exactly one resolves, read it as the canonical person note even if stale unindexed person files also exist.
2. Otherwise, if exactly one root `person-*.md` note exists, read it.
3. If several indexed candidates remain, do not prefer a generic `person-user.md` merely because of its name. Load only a task-relevant person note and ask the user to re-run configuration with `--primary-user-note` before a primary-user write.
4. If none exist, continue without a user note and configure/create one only when durable user context warrants it.

Keep the primary user note compact enough for startup. Move large background/reference material into linked topic notes when it grows beyond a useful preference/profile card.

### 3. Resolve The Active Project

Prefer project identity in this order:

1. A repository/workspace name or path explicitly provided in the task.
2. A path to a file being discussed.
3. The Git root of the current working directory (`git rev-parse --show-toplevel`).
4. The current working-directory basename when not in Git.

Normalize the chosen basename using `references/vault-contract.md`: split lower/digit-to-uppercase boundaries, lowercase, replace non-alphanumeric runs with `-`, and strip edges.

Do not use these generic container names as project slugs:

`src`, `source`, `code`, `projects`, `repos`, `workspace`, `workspaces`, `work`, `tmp`, `desktop`, `documents`, a username, or a home-directory basename.

If resolution lands on a generic parent **and the task is project-specific**, do not silently proceed without project memory. First use any explicit path/name in the request; if identity remains ambiguous, briefly say the current directory does not identify the project and ask for its repository path or name. This asks for identity, not permission to run startup.

For a non-project task, silently stop project orientation after the index and primary user note.

### 4. Load The Project Entry Point

Check for:

```text
<brain-vault-path>/projects/<slug>/_<slug>.md
```

If it exists, read only that entry point by default. It is the living project mental model and companion-note router.

Do **not** automatically read full `conventions.md`, `gotchas.md`, `decisions.md`, or every companion. Load a companion when the task, entry-point links, or targeted search makes it relevant. Large gotcha/decision histories should be searched, not injected wholesale.

If the task touches a dependency boundary, consider reading the depended-on project's entry point. If the task names a different project or commands run in another repo, re-orient before making project claims or writing memory.

If the project folder does not exist, note internally that this is an unknown project. Do not create it during startup; register it through capture or `deep-dive` once durable facts are established.

### 5. Targeted Recall

Use filename/content search for the task's actual concepts:

```text
Grep pattern="<term>" path=<brain-vault-path>
```

When Obsidian is running, indexed search can surface root notes and project-tagged context:

```sh
obsidian vault=<brain-vault-name> search query="<term>"
obsidian vault=<brain-vault-name> search query="tag:#project/<slug>"
```

Read only direct matches. Root `tool-*`, `gotcha-*`, `decision-*`, and `codestyle-*` notes are useful when the task names or clearly implicates them; they are not default startup payload.

### 6. Evaluate Freshness Silently

Hold in mind:

- what memory establishes;
- what remains unknown;
- whether the current repo/source contradicts the note;
- whether verification metadata or the note's size suggests a refresh.

`updated:` is an edit date, not a truth guarantee. Prefer fresh repository evidence for implementation, current user statements for intent, and dated authoritative sources for external facts.

## Failure Handling

- If Obsidian is closed, native reads/searches still work. Defer CLI-only checks.
- If config or index is missing, stop vault work and report the exact missing path.
- If an entry point is stale, do not silently trust it; verify during the task and update through capture/extraction.
- If orientation would load thousands of lines, use targeted search and log the oversized startup surface for maintenance.

## Red Flags

- Substantive work started before index and primary-user orientation.
- A project claim is being made without checking its entry point.
- The whole project folder or vault is being loaded “just in case.”
- A generic parent directory was silently treated as a real project.
- Startup created or edited memory; startup is read-only.

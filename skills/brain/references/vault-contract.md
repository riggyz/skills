# Vault Contract

This file is the canonical storage contract shared by the `brain` workflows and `deep-dive`. Do not duplicate its templates or invariants in individual guides.

## Layout

```text
<brain-vault-path>/
├── index.md
├── improvements.md
├── person-*.md
├── pref-*.md
├── tool-*.md
├── codestyle-*.md
├── decision-*.md
├── gotcha-*.md
└── projects/<slug>/
    ├── _<slug>.md
    ├── conventions.md       # optional
    ├── decisions.md         # optional
    ├── gotchas.md           # optional
    ├── improvements.md      # optional
    ├── references.md        # optional
    ├── <topic>.md           # optional
    └── <artifacts>          # optional
```

Only `projects/<slug>/_<slug>.md` is mandatory. Keep the project folder flat and create companion notes only when real content earns them.

## Project Slugs

Normalize the repository or workspace basename deterministically:

1. Insert `-` between a lowercase letter/digit and a following uppercase letter.
2. Lowercase.
3. Replace each run of non-alphanumeric characters with `-`.
4. Strip leading and trailing `-`.

Examples: `my.project.core` -> `my-project-core`, `MyProject` -> `my-project`, `api_server` -> `api-server`.

Before creating a project, search the index and `projects/` for an existing canonical slug or alias. Do not create a second folder because a checkout, worktree, or symlink has a different basename.

## Link-Only Index

`index.md` is navigation, not project memory. It may contain frontmatter, headings, single-link bullets, short section instructions, and a terminal index tag. Keep project purpose, stack, relationships, current state, dated history, and commands in project/root notes.

Canonical typed sections:

| Root filename | `index.md` section |
|---|---|
| `person-*` | `## People` |
| `tool-*` | `## Tools` |
| `decision-*` | `## Decisions` |
| `pref-*` | `## Preferences` |
| `codestyle-*` | `## Code style` |
| `gotcha-*` | `## Gotchas` |

Projects live under `## Projects` with `### Active`, `### Dormant`, and `### Archived`. Use a path-qualified entry link such as `[[projects/example/_example|example]]`. Do not duplicate its summary on the bullet.

## Project Entry Point

Use this shape for new projects and full refreshes:

```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
kind: service|library|app|tool|monorepo|workspace|other
stack: [language, runtime, key-frameworks]
status: active|dormant|archived
repository: <local-root-or-canonical-url>
verified_at: YYYY-MM-DD
verified_ref: <commit-or-ref-if-available>
depends_on: []
used_by: []
---

# <slug>

## Purpose
## Architecture
## Tech stack
## Layout
## How to work on it
## Relationships
## Target state
## Gotchas
## Open questions
## Notes for future-you
## Companion notes and references

#project/<slug>
```

`repository`, `verified_at`, and `verified_ref` are optional during atomic capture when evidence is not yet available, but a deep dive should populate them when possible. Use a workspace path for a multi-repo product and explain member repositories in the body.

## Project Tags

Every ordinary Markdown note in `projects/<slug>/` has a final non-empty tag line containing `#project/<slug>`. Additional tags may share that line.

Excalidraw Markdown files may carry the project tag in YAML frontmatter instead of the final line because the plugin owns the file body. Binary attachments carry no tag; their linking note provides scope.

Insert new content into the appropriate section before the terminal tag. Do not blindly append at EOF.

## Update Metadata

If an existing Markdown note contains `updated:`, every body or frontmatter edit sets it to today's date in the same operation. This includes appends, link/tag repairs, typo fixes, backlog changes, index registration, and consolidation.

`updated:` records when the note changed. It does not prove every claim is current. For mutable facts, record a verification date and source/commit near the claim or in frontmatter.

## Source And Truth Rules

- Current implementation: verify in code/config/tests at a known ref.
- User intent and decisions: a direct current user statement outranks an older note; preserve useful rationale in dated decision history.
- External operational facts: cite the source and when it was checked.
- Memory summaries: navigation and hypotheses, never authority over fresher evidence.
- Uncertain claims: attribute them or put them in `Open questions`.

Keep `_<slug>.md` as clean current semantic truth. When architecture changes, rewrite stale current-state sections. Preserve useful history in dated decisions/evidence, not as “the body below is stale” caveats around false prose.

## Obsidian-Safe Issue References

Bare issue and PR numbers can become phantom nested tags when followed by `/`. Prefer a full Markdown link or code-form identifier:

- Good: issue `#292`
- Good: `` `#71` / `#54` ``
- Bad: `#71/#54`
- Bad: `#292/PR`

Do not alter real taxonomy tags such as `#project/<slug>`.

## Scope Mapping

| Information | Canonical target |
|---|---|
| User preference, correction, workflow habit | Configured primary user note |
| Global preference not tied to a person | `pref-<slug>.md` |
| Reusable tool behavior | `tool-<slug>.md` |
| Language/code-format idiom | `codestyle-<slug>.md` |
| Cross-project decision | `decision-<slug>.md` |
| Reusable cross-project trap | `gotcha-<slug>.md` |
| Project mental model | `projects/<slug>/_<slug>.md` |
| Project convention/decision/gotcha | Matching optional companion note |
| Deep project topic | `projects/<slug>/<topic>.md` |
| Project references/artifacts | Relevant topic note or `references.md` |
| Agent/tool/vault improvement | Root `improvements.md` |
| Project-specific agent-working friction | Project `improvements.md` if it should not be in the project tracker |

Repository product work belongs in its issue tracker. The brain may link to that work when future-agent context needs the pointer, but should not become a second tracker.

## Project Registration

A new project is not fully registered until all applicable steps are complete:

1. Create `projects/<slug>/_<slug>.md` from the canonical template.
2. Add its path-qualified link under the matching index status.
3. Link any real companion notes; do not create empty stubs.
4. Record verified `depends_on` relationships and update reciprocal `used_by` when the related project note exists.
5. When a Graph palette note is configured, follow `references/graph-maintenance.md` to assign or verify one exact graph color group. For a plain Markdown vault with no Graph configuration, record this step as not applicable.

When a project is merged, absorbed, archived without a folder, or deleted, update the index, relationships, links, and graph color group as one lifecycle operation. Preserve useful facts in the canonical successor before deleting anything.

## Forgetting And Deletion

- **Supersede:** replace current truth and preserve useful prior rationale/evidence.
- **Archive or soft-forget:** remove from active/startup surfaces while retaining the note or dated evidence.
- **Delete:** irreversible removal; obtain user confirmation except for urgent secret redaction.

Use Obsidian File Recovery or another available history mechanism before destructive maintenance when practical.

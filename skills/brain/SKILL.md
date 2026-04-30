---
name: brain
description: Persistent cross-session memory in a configured Obsidian vault owned by the agent. Load on turn 1 of EVERY session before responding. Also load when durable facts, preferences, links, screenshots, project references, gotchas, or improvement items surface.
---

# Brain — Cross-Session Memory via Obsidian

Your long-term memory lives in the configured Obsidian vault. The vault is the handoff from prior-you to future-you.

## Configuration

The vault name and path are deployment-specific. Read them from `references/brain-config.md` at the start of each session and substitute them wherever this skill or its guides reference `<brain-vault-name>` or `<brain-vault-path>`.

If `references/brain-config.md` is missing, stop before doing any vault work and ask the user to run:

```sh
npx tsx scripts/configure-brain.ts --vault-name "vault-name" --vault-path "/absolute/path/to/vault"
```

After substitution, the rest of this skill and its `*/GUIDE.md` files apply unchanged.

The primary purpose is project understanding: mental models, decisions, gotchas, conventions, links, screenshots, diagrams, external references, and enough context that a fresh agent can resume without re-discovery. Preferences, tool notes, and backlog items support that purpose.

This brain is yours, not the user's. The user should not need to manage it. Write proactively when future-you will benefit.

## First Rules

- **Turn 1 always loads startup.** Read `startup/GUIDE.md` and `index.md` before substantive work. Do not ask permission.
- **Meta turns are allowed to be explicit.** If the user asks about the brain/vault/memory system, still orient first, but discussing the orientation and process openly is fine.
- **Project slugs are lowercase-kebab-case.** Normalize repo/folder basename: lowercase, replace non-alphanumeric runs with `-`, strip edges. Example: `my.project.core` -> `my-project-core`.
- **Path-qualify ambiguous wikilinks.** If a basename exists in multiple places (`improvements.md`, `gotchas.md`, `decisions.md`, `architecture.md`), link with a path and alias: `[[projects/<slug>/improvements|improvements]]`.
- **Read before writing.** Search existing notes first; update in place instead of creating near-duplicates.
- **Verified facts only.** Never store guesses as facts. If uncertain, mark uncertainty or ask.
- **No secrets.** Do not store credentials, API keys, tokens, private env values, or sensitive customer data.

## Vault Layout

```
<brain-vault-name>/
├── index.md                    # Lightweight TOC + project status
├── improvements.md             # Cross-cutting backlog only
├── person-*.md                 # People and preferences
├── pref-*.md                   # Global preferences not tied to a person
├── tool-*.md                   # Tool usage patterns
├── codestyle-*.md              # Language idioms
├── decision-*.md               # Cross-project decisions
├── gotcha-*.md                 # Reusable traps
└── projects/<slug>/
    ├── _<slug>.md              # Required project entry point and living mental model
    ├── conventions.md          # Optional; create when useful
    ├── decisions.md            # Optional; create when useful
    ├── gotchas.md              # Optional; create when useful
    ├── improvements.md         # Optional; create when there are project backlog items
    ├── <topic>.md              # Optional deep topic notes
    └── <attachments>           # Screenshots, diagrams, PDFs, exports, reference files
```

Only `projects/<slug>/_<slug>.md` is mandatory for a project. Other companion files are as-needed; empty stubs are noise.

`index.md` should stay lightweight. It links to projects and important root notes; do not duplicate detailed project summaries that belong in `_<slug>.md`.

The `updated:` frontmatter field is useful but advisory. If stale, trust filesystem mtime and note content over the date.

## Project Entry Point

Use `projects/<slug>/_<slug>.md` as both TOC and mental model. Keep it current when understanding changes.

```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
kind: service|library|app|tool|monorepo|other
stack: [language, runtime, key-frameworks]
status: active|dormant|archived
depends_on: []
used_by: []
---

# <project-slug>

## Purpose
## Architecture
## Tech stack
## Layout
## Relationships
## Target state
## Open questions
## Notes for future-you
## Companion notes and references

#project/<slug>
```

Every project-scoped markdown note must end with `#project/<slug>`.

## What To Remember

Capture normal language, not just explicit commands. The user should not need magic phrases.

- **Person/preferences:** The user says they like/dislike a behavior, corrects interaction style, repeats a workflow habit, or expresses frustration. Update `person-user.md` or `pref-*`.
- **Project facts:** purpose, architecture, deploy, data flow, ownership, target state, current constraints. Update `_<slug>.md` or a topic note.
- **Decisions:** dated choice plus reasoning. Append to `decisions.md` or root `decision-*`.
- **Gotchas:** traps, failed approaches, doc/code drift, non-obvious workarounds. Write `gotchas.md` or root `gotcha-*`.
- **Tool patterns:** reusable CLI/API/GraphQL/auth commands. Write `tool-*`.
- **External references:** URLs, Slack/Teams threads, Figma links, docs, screenshots, PDFs, diagrams, vendor references, issue/PR links. Store or link them where future-you will look.
- **Improvements:** fixable friction that is not the current task. Append one line to root or project `improvements.md`.

Counterexample: "I'm going to run tests now" is not durable. "I prefer `just test` as the canonical test command" is durable.

## External References And Attachments

Project references are first-class memory. When a link, screenshot, document, or external artifact explains a project, preserve it in the project folder.

- **Links:** use normal markdown links with context: `[dashboard runbook](https://...) — source of truth for prod restart steps as of YYYY-MM-DD`.
- **Screenshots/images:** if the file is available locally, copy or move it into `projects/<slug>/` when safe, then embed it from the note with `![[filename.png]]`. Use descriptive lowercase-kebab filenames like `login-error-2026-04-29.png`.
- **PDFs/docs/diagrams:** keep small, load-bearing files next to the note that uses them and link/embed via Obsidian syntax.
- **External-only assets:** do not mirror large or sensitive assets. Link them with a short explanation, owner/source, and why future-you cares.
- **Reference index:** if a project accumulates several external artifacts, create `projects/<slug>/references.md` and link it from `_<slug>.md`.
- **Safety:** never save secrets, private credentials, sensitive customer data, or giant binary dumps. If unsure, ask the user.

## Capture Workflow

1. Classify scope: root or project.
2. Search existing notes with `Grep` / `Glob` before writing.
3. Edit the existing note when possible; create a new note only when the topic earns one.
4. Link new project notes from `_<slug>.md`; link important root notes from `index.md`.
5. If the user explicitly asked to remember something, confirm in one line where it was saved. Otherwise silent capture is fine.

Common target mapping:

- User preference -> `person-user.md`
- Global preference -> `pref-<slug>.md`
- Tool pattern -> `tool-<slug>.md`
- Reusable trap -> `gotcha-<slug>.md`
- Project mental model -> `projects/<slug>/_<slug>.md`
- Project references -> `projects/<slug>/references.md` or the relevant topic note
- Project decision -> `projects/<slug>/decisions.md`
- Project gotcha -> `projects/<slug>/gotchas.md`
- Project improvement -> `projects/<slug>/improvements.md`
- Cross-cutting improvement -> root `improvements.md`

## Extract Workflow

Run at wrap-up, after milestones, before compaction, and after long multi-step stretches.

Checkpoint questions:

- Did the user express a preference, correction, communication style, workflow habit, or recurring frustration? Update `person-user.md`.
- Did the project mental model change? Rewrite `_<slug>.md` in place; do not append stale caveats forever.
- Were links, screenshots, docs, diagrams, issues, PRs, or external references used as evidence? Store/link them under the project.
- Did we learn a reusable tool pattern? Update/create `tool-*`.
- Did new fixable friction appear? Log it in the appropriate `improvements.md`.
- Is the total open backlog roughly over 10 items? Tell the user the backlog is growing and ask whether to run an improvement pass.

Report briefly only when useful: what was extracted and where.

## Improvement Workflow

Capture improvements opportunistically, but do not fix backlog items unless the user asks for a pass.

Format:

```markdown
- [ ] YYYY-MM-DD (low|med|high) — [[target]] — description. (proposed fix, if obvious)
```

During an explicit pass, surface grouped open items and ask what to work through. Fix one item at a time. When fixed, move it to `## Fixed (recent)` in the same file.

## Consolidation Workflow

Run when the user asks for cleanup or obvious duplication/staleness appears.

- Merge duplicates into the canonical note.
- Delete only with user confirmation.
- Rewrite stale project notes in place when architecture materially changed.
- Backfill links and missing `#project/<slug>` tags.
- Do not create empty project companion stubs.

## Tools

Prefer native file tools for CRUD: `Read`, `Grep`, `Glob`, and the available file-editing primitive (`apply_patch`, `Edit`, or `Write`, depending on the host toolset).

Use the configured Obsidian CLI with `vault=<brain-vault-name>` for indexed search, backlinks, unresolved links, tag analytics, graph-aware moves, daily notes, and plugin/app operations. Obsidian must be running for CLI commands.

Useful CLI forms:

- `obsidian vault=<brain-vault-name> search query="terms"`
- `obsidian vault=<brain-vault-name> backlinks path=projects/<slug>/_<slug>.md`
- `obsidian vault=<brain-vault-name> unresolved`
- `obsidian vault=<brain-vault-name> tags counts sort=count`
- `obsidian vault=<brain-vault-name> move path=<old> to=<new>`

Argument names are `path=` for file operations and `query=` for searches; do not use `file=` for project notes.

## When Not To Write

- Ephemeral session state.
- Repo-owned documentation that should live in the repo.
- Unverified assumptions.
- Secrets or sensitive data.
- Large binary archives or screenshots with sensitive contents.

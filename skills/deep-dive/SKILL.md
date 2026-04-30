---
name: deep-dive
description: Populate or refresh a project in the configured brain vault by exploring a repository and writing a durable project mental model. Use when the user asks to "deep dive", "fill your brain", "learn this repo", "onboard onto this project", or when an unfamiliar repo needs lasting memory before substantial work.
---

# Deep Dive

Use this skill to turn repository exploration into durable project memory. It is a companion to the `brain` skill, not a standalone codebase-summary skill.

Primary output: `<brain-vault-path>/projects/<slug>/_<slug>.md`.

Optional output: companion notes such as `conventions.md`, `gotchas.md`, `testing.md`, or `architecture.md` only when the content earns its own file.

## Preconditions

- The `brain` skill is available and its vault placeholders are configured.
- You can read the repository being analyzed.
- You can write to `<brain-vault-path>`.

If any precondition is missing, stop and ask the user for the missing configuration rather than inventing paths.

## When To Use

- The user explicitly asks for a deep dive, onboarding pass, or durable repo understanding.
- The current repo has no matching `projects/<slug>/` folder in the brain vault and upcoming work would benefit from persistent context.
- Existing project notes are stale enough that incremental `brain` capture would leave contradictions.

Do not use this for quick code questions, small bug fixes, or ephemeral summaries. Use normal ad-hoc exploration instead.

## Principles

- **Verified facts only.** Read files before writing claims. Put uncertainty in Open questions.
- **Minimum viable memory first.** A useful `_ <slug>.md` entry point beats a sprawling folder of half-filled notes.
- **Update in place.** If project notes already exist, revise them rather than creating duplicates.
- **Link, don't mirror.** Point to repo docs instead of copying their contents into the brain.
- **Companion notes are earned.** Create extra files only for substantial, reusable topics.
- **No secrets.** Do not store credentials, private data, raw logs, database dumps, or secret-bearing screenshots.

## Workflow

### 1. Identify The Project

1. Determine the repo root.
2. Derive `<slug>` from the repo root folder name using the `brain` skill's kebab-case rules.
3. Check for existing notes at `<brain-vault-path>/projects/<slug>/`.
4. If notes exist, read `_ <slug>.md` first, then any relevant companion files.

Use existing notes as a starting point, not as ground truth when the repo has drifted.

### 2. Explore The Repo

Find enough evidence to answer the project-entry sections below. Prefer reading actual source/config/docs over inferring from filenames.

Minimum exploration checklist:

- Top-level layout and purpose of important directories.
- Languages, runtimes, frameworks, package managers, and build systems.
- Entry points: apps, services, CLIs, libraries, workers, jobs, exports.
- How to run tests, build, lint, and start local development when discoverable.
- Configuration and environment shape, without copying secrets.
- External dependencies and integrations.
- Existing docs: README, architecture docs, ADRs, contributing docs, runbooks.
- Non-obvious conventions, gotchas, or load-bearing weirdness.
- Current target state or active direction if it is clear from docs/code/session context.

For large repos, use subagents or parallel exploration by subsystem. For small repos, direct reads are enough.

### 3. Write The Entry Point

Create or update:

```txt
<brain-vault-path>/projects/<slug>/_<slug>.md
```

Use this shape:

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

Guidance:

- Keep the entry point scannable. It should let future-you regain the project model quickly.
- Include concrete commands only when verified from the repo.
- Use `Open questions` for unresolved or ambiguous facts.
- If repo docs already explain something well, link to the file path and summarize only what future-you needs to know.

### 4. Add Companion Notes Only If Useful

Create companion notes when a topic is too large or important for the entry point.

Common examples:

- `architecture.md` for detailed subsystem/data-flow notes.
- `conventions.md` for stable project-specific coding/test/naming patterns.
- `gotchas.md` for traps future-you is likely to hit.
- `testing.md` for non-obvious test setup or coverage strategy.
- `deploy.md` for release/deployment mechanics.
- `references.md` when several external links or artifacts matter.

Rules:

- Every project-scoped markdown note ends with `#project/<slug>`.
- Link every companion note from `_ <slug>.md`.
- Path-qualify links whose basename is common across projects, e.g. `[[projects/<slug>/gotchas|gotchas]]`.
- Do not create empty stubs for completeness.

### 5. Register The Project

If this is a new project, update `<brain-vault-path>/index.md` with a short link under the appropriate project status section.

If relationships were discovered, update the relevant `depends_on` / `used_by` frontmatter in affected project notes when those notes exist.

### 6. Verify Lightly

Do a lightweight correctness pass:

1. Re-read `_ <slug>.md`.
2. Confirm it answers: what is this, how is it shaped, how do I work on it, what should future-you not miss?
3. Confirm all project-scoped notes have `#project/<slug>`.
4. Confirm links to companion notes resolve by path or unique filename.

Use Obsidian CLI checks only if configured and helpful:

```sh
obsidian vault=<brain-vault-name> unresolved
obsidian vault=<brain-vault-name> backlinks path=projects/<slug>/_<slug>.md
```

Do not block completion on graph colors, attachments, or exhaustive backlink hygiene unless the user explicitly asks for vault maintenance.

## Report Back

Keep the final report concise:

- Project slug and entry note path.
- Companion notes created or updated.
- Important open questions.
- Anything deliberately skipped, such as unconfigured Obsidian CLI checks or missing docs.

## Escalation Paths

- If the repo is too large for one pass, write the entry point with what is verified and list remaining subsystems in Open questions.
- If existing notes conflict with the repo, prefer the repo and update the notes; mention the correction in the report.
- If a topic becomes operationally important during exploration, use normal `brain` capture rules after the deep dive completes.

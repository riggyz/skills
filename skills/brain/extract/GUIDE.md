# Guide — End-of-Session Extraction

Sweep the session for information worth keeping and write it to the configured brain vault at `<brain-vault-path>`.

This is the periodic gardening pass. It is distinct from the remember guide, which captures a single fact on explicit trigger. Extract looks back over the whole session.

## When to run

Infer from context, not specific phrases. Examples of signals:

- The user indicates the session is wrapping up (explicit "we're done", "good stopping point", or implicit — he closes a task, thanks you, says goodbye, switches topic to something unrelated).
- A meaningful milestone landed (feature completed, bug root-caused, design decision made).
- A user-acknowledged checkpoint happened ("looks good", "commit this", "next step") after a multi-step stretch.
- A known compaction or context reset is about to happen.
- Material in any extraction category has accumulated this session and you're approaching end-of-turn without capturing it.

If you're unsure whether a session is "ending," err on extracting — partial extraction is better than missing the window entirely.

## What to extract

Scan the session for:

1. **Decisions made** — architectural choices, tool selections, strategy pivots. Include reasoning.
2. **Conventions discovered** — "this project always does X", repo patterns, build/test/deploy commands.
3. **Gotchas encountered** — traps, footguns, "tried X, doesn't work because Y".
4. **Preferences expressed** — the user's stated preferences about code, workflow, communication, agent behavior, or recurring frustrations.
5. **Tools configured** — new CLIs, env setup, auth patterns that aren't obvious.
6. **People mentioned** — teammates, their roles, and how they interact with the user.
7. **External references** — links, screenshots, diagrams, PDFs, issues/PRs, docs, dashboards, or chat threads used as project evidence.
8. **Outcomes** — what was completed, what remains open.

Do NOT extract:

- Transient state (current file, cursor position, specific line numbers).
- Chat small talk.
- Speculation or unverified guesses. If uncertain, skip it or annotate as uncertain.
- Full transcripts or long quotes. Capture the fact, not the conversation.

## Procedure

### 1. Categorize

Walk the session. For each extractable item, decide:

- **Scope**: cross-cutting (vault root) or project-scoped?
- **Type**: decision / convention / gotcha / preference / tool / person / other?
- **Target file**: use the mapping from the remember guide.

### 2. Dedupe against the vault

Prefer native `Grep`:

```
Grep pattern="<keywords>" path=<brain-vault-path>
```

For prose search, use the CLI:

```
obsidian vault=<brain-vault-name> search query="<keywords>"
```

If already recorded, skip it. If partially recorded, plan to update the existing note.

### 3. Write in one pass

Use native `Write` / `Edit`. Batch by target file to avoid re-reading:

- Project decisions → append dated block to `projects/<slug>/decisions.md`
- Project gotchas → append to `projects/<slug>/gotchas.md`
- Project conventions → update `projects/<slug>/conventions.md` (edit in place; do not append duplicates)
- Project mental model changes → edit `projects/<slug>/_<slug>.md` in place (Purpose/Architecture/Tech stack/Layout/Target state/Open questions sections)
- Deep topics that deserve their own note → create `projects/<slug>/<topic>.md` and link from `_<slug>.md`
- Project links/screenshots/external references → add to the relevant project note, or create/update `projects/<slug>/references.md` when several references accumulate
- **New or changed project-to-project relationships** → update the `depends_on` / `used_by` frontmatter in each affected `_<slug>.md` and keep the prose Relationships sections accurate
- Cross-cutting → create or update the appropriate root note (`person-*`, `tool-*`, etc.)

Every project-scoped note you create or edit in this pass must end with `#project/<slug>`. If a note is missing the tag, add it.

Before writing, run a person-note checkpoint: did the user express a preference, correction, communication style, workflow habit, or repeated frustration? If yes, update `person-user.md`; do not wait for explicit "remember this" phrasing.

If a project materially changed, prefer an overwrite-in-place pass across existing notes to appending caveats. Keep what is still true, remove stale claims, and mark reversals when useful.

If the total open backlog across root + relevant project files is roughly over 10 items, surface that the brain backlog is growing and ask whether the user wants an improvement pass.

Append format for dated logs:

```
## YYYY-MM-DD — <short title>
<body>
```

### 4. Link new notes

If any new note should be discoverable from an index:

- New cross-cutting topic → add a link from `index.md`.
- New project → ensure `projects/<slug>/_<slug>.md` exists and register the project in the Projects section of `index.md`.

### 5. Report briefly

Tell the user what was extracted and where, in at most a few lines. Example:

> Extracted to the brain:
> - `projects/example-project/decisions.md` — chose a new storage backend (reasoning included)
> - `projects/example-project/gotchas.md` — `test` hangs when stdin is a TTY
> - `person-user.md` — prefers one task runner over another

Do not read notes back in full.

## Quality bar

- **Fact, not narrative.** "Chose X because Y" beats "We spent an hour debating X vs Y and eventually settled on X".
- **Specific, not generic.** "Deploy runs `example deploy --env prod` from `ops/` directory" beats "There is a deploy process".
- **Verified, not assumed.** Only record what was actually established in the session.
- **Dated.** Especially for decisions and gotchas — future-you needs to know when a claim was valid.

## Edge cases

- **Nothing durable came up**: say so in one line and skip writing. Not every session produces vault content.
- **Contradicts an existing note**: update the existing note, bump `updated:`, briefly note the reversal.
- **New project with no folder**: create `projects/<slug>/_<slug>.md` using the skeleton, register the project in `index.md`, then write the extracted facts into the right files within the folder.
- **Screenshot/link with unclear sensitivity**: ask before saving or mirroring it. Linking with context is safer than copying sensitive assets into the vault.
- **Obsidian not running**: proceed with native `Write`/`Edit`. Skip CLI-only steps (indexed search, backlinks).

## Red flags

- You're about to create a note that duplicates an existing one. Search first.
- You're extracting everything. Be selective — landfill is the failure mode.
- You're writing unverified claims. If the user hasn't confirmed or you haven't verified, either check or don't write.

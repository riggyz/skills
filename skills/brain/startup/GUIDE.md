# Guide — Session Startup

Orient using the configured Obsidian brain vault before doing real work. Treat `<brain-vault-name>` and `<brain-vault-path>` as deployment-specific values.

This is for your benefit, not the user's. You are reading your own notes from prior sessions so current-you doesn't start from zero. The vault exists because instances of you don't share memory natively; this is the workaround.

## Rules of engagement

- **Run on turn 1 of every session, unconditionally.** Not just when the user asks a "real" task. Meta-questions count. Casual greetings count. The orientation happens first, regardless.
- **Run silently by default.** Do not announce routine orientation. Exception: if the user's first turn is explicitly about the brain, memory, vault structure, or skill behavior, orientation still happens first, but discussing what you read and how the system works is allowed.
- **Never ask permission.** Do not say "want me to run the startup procedure?" The answer is always yes; asking wastes a turn and signals you weren't going to do your job automatically. Just do it.
- **Orientation is not a deliverable.** The user doesn't need to see the results of orientation. They need your subsequent answers to reflect that you did it.

## When to run

1. **Turn 1 of every session.** Unconditional. Happens before your first response.
2. The first time the user names a specific project, person, or tool in a session that you haven't already oriented on.
3. After a long context compaction, as a refresh.

## How the user typically signals a project

The user may not say "let's work on project X." They may just open the agent while `cd`'d into the project directory. **Detect the project from the environment, don't wait to be told.**

## Procedure

### 1. Load the index

```
Read filePath=<brain-vault-path>/index.md
```

`index.md` is the vault TOC and curated project list/state. Read it every session so you have the current project landscape in mind before you dive in. Do not dump it back to the user; this is internal orientation.

### 2. Auto-detect the project from the environment

At session start, the system prompt includes a `<env>` block with:

- `Working directory: <path>`
- `Is directory a git repo: yes|no`

Derive the project slug:

1. If the repo flag is `yes`, run `git rev-parse --show-toplevel` and take the `basename` of the result. Else, take the `basename` of the working directory.
2. **Normalize to kebab-case:** lowercase everything, replace any run of non-alphanumerics with a single `-`, strip leading/trailing `-`.
   - `my.project.core` -> `my-project-core`
   - `MyProject` → `my-project`
   - `api_server` → `api-server`
   - `some-repo` → `some-repo`
3. **Sanity-check the slug.** Skip project orientation if the normalized slug matches any of:
    - A home-dir marker: `users`, a username, or a home-directory basename
   - A generic parent: `-src`, `src`, `code`, `projects`, `repos`, `work`, `tmp`, `desktop`, `documents` (match after normalization)
   - Any path that looks like it's not actually inside a real project

If the slug is valid, check for `projects/<slug>/` in the vault. Use `Glob` to keep it quick:

```
Glob pattern="projects/<slug>/*.md" path=<brain-vault-path>
```

If the folder exists, go to step 3 and load its contents. If it doesn't, note that this is a project you haven't written about yet — plan to create `projects/<slug>/_<slug>.md` as soon as durable facts emerge.

### 3. Orient to the active project

Whether detected automatically or named by the user, read the entry point first:

```
Read filePath=<brain-vault-path>/projects/<slug>/_<slug>.md
```

`_<slug>.md` is the project's entry-point note — a living TOC + mental model. It has a YAML frontmatter block (kind, stack, depends_on, used_by, status) and structured body sections. Read it first and treat it as the handoff from prior-you.

Then read useful companion files if they exist. `conventions.md` and `gotchas.md` are high-value defaults, but project companion files are optional; missing files are not a problem.

```
Read filePath=<brain-vault-path>/projects/<slug>/conventions.md
Read filePath=<brain-vault-path>/projects/<slug>/gotchas.md
```

Read `decisions.md` only if it exists and the task suggests decision history matters.

**Ad-hoc topic files:** `_<slug>.md` will have a "Companion notes in this folder" section wikilinking to any ad-hoc topic notes (`architecture.md`, `data-model.md`, etc.). Load the ones relevant to the current task. For a quick scan of everything the folder contains:

```
Glob pattern="*.md" path=<brain-vault-path>/projects/<slug>
```

**Depended-on projects:** if `_<slug>.md` frontmatter lists `depends_on`, and the task touches the boundary (API, shared types, deploy), consider loading the dependency's `_<other-slug>.md` too so you understand both sides.

**Cross-referenced notes at root:** every project-scoped note carries `#project/<slug>`. If the task might touch cross-cutting concerns that reference this project, scan the tag:

```
obsidian vault=<brain-vault-name> search query="tag:#project/<slug>"
```

That surfaces root-level notes (e.g., a `decision-<slug>.md` or a `tool-<slug>.md`) that live outside the project folder but still concern it.

If the task suggests your mental model has drifted or evolved, plan to update `_<slug>.md` in place.

Missing files are fine — note which exist.

If the user names a **different** project mid-session, or a person / tool, orient to that topic:

- Person: load the relevant `person-*.md` at the vault root.
- Tool: load the relevant `tool-*.md` at the vault root.

If a user's task mentions a different project than the initial cwd, or you run commands in a different repo root, re-orient to that project before making claims about it.

### 4. Targeted search for anything else

For casual grep over filenames or content:

```
Grep pattern="<term>" path=<brain-vault-path>
```

For Obsidian's indexed search (better for prose, respects frontmatter):

```
obsidian vault=<brain-vault-name> search query="<term>"
```

Read only the notes that directly match. Do not pre-load speculatively.

### 5. Summarize silently

Hold in mind: what is known, what is not, what contradictions (if any) exist with the current task. Do not narrate this to the user unless they ask. If they didn't ask about orientation, don't bring it up — just answer their actual question with the orientation internalized.

### 6. Flag gaps

If the task references a project (detected or named) and there is no `projects/<slug>/` folder, plan to create it (see the remember guide) as soon as you learn durable facts about it.

## Failure modes to avoid

- **Do not dump the entire vault** into context. Load only what's relevant.
- **Do not skip orientation** "just this once" because the task seems simple.
- **Do not treat stale notes as authoritative.** Check `updated:` in frontmatter; if a note is months old and the codebase has moved, prefer fresh evidence from the repo.
- **Do not write during startup.** This phase is read-only. Writes belong in the remember or extract guides.

## If Obsidian is not running

Native file tools still work — Read/Grep/Glob don't need Obsidian. Only the indexed-search / orphans / backlinks operations require the app. Fall back to `Grep` + `Read` for orientation; defer anything that needs the live app until Obsidian is reopened.

## Red flags

- You started editing code or answering a substantive question without reading `index.md` first. Stop, orient, then continue.
- You're about to assert a fact about "how this project works" without having consulted `projects/<slug>/`. Check first.
- **You asked the user "should I load the brain / run startup?"** You should not have asked. Do it, don't ask.
- **You recited the skill's trigger list back to the user** as your way of "loading" the skill. That's quoting the skill, not using it. Orient silently and answer the question.
- **You treated the user's question as "not real work" and skipped orientation.** Every turn 1 gets orientation, including meta questions about the skill system itself.

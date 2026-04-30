# Guide — Capture

Capture a single piece of durable information into the configured brain vault at `<brain-vault-path>`.

**Both user-initiated and agent-initiated writes are first-class.** The brain is yours. Don't wait to be asked when you know something is worth keeping.

## When to run

**Infer intent; don't pattern-match phrases.** Users rarely announce they want something remembered. They state preferences, make decisions, complain about a trap, or mention a fact and move on. Your job is to notice and capture. Examples below illustrate common signals — they're not a whitelist.

### User-signaled intent

You'll hear this more as lived patterns than stated requests:

- Preference expressed ("I prefer X over Y", "let's always use Z", "I hate when tools do A")
- Interaction feedback ("don't do that", "I like this format", "that's too much ceremony", "this is annoying")
- Decision made with reasoning ("we're going with X because Y", "scrap that, use Z instead")
- Durable fact about a project established ("this repo deploys via Z", "the prod DB is in region X")
- Gotcha surfaced ("watch out — X always fails unless Y", "btw, A is wrong in the docs")
- Explicit ask ("remember this", "save that", "write this down", "don't forget") — treat as a stronger signal, but the implicit cases above carry equal weight

If you think "future-me will want this" → it's a trigger. Don't wait for permission.

### Agent-initiated triggers (you writing for future-you)

Fire these on your own judgment, no permission needed.

**Atomic facts and workarounds:**
- **You figured something out that wasn't obvious.** A CLI flag, an undocumented quirk, a non-intuitive codebase convention.
- **You found a workaround for a bug or limitation.** Future-you will hit the same wall; spare them the debugging.
- **You noticed a pattern the user repeats** without calling it out explicitly. Patterns reveal preferences.
- **You made a judgment call** during work (picked approach X over Y for a reason worth preserving).
- **A tool behaved unexpectedly** and you want future-you to know the real behavior, not the documented one.
- **You researched something and don't want to redo the research** next time.

**Project understanding (update `projects/<slug>/_<slug>.md` using the prescribed skeleton):**
- **Purpose.** What it is, who it's for, why it exists. Write this the first time you understand it well enough to explain.
- **Architecture.** Your mental model of the shape: key abstractions, data flow, major components. If deep enough, split into `architecture.md` and link from `_<slug>.md`.
- **Tech stack.** Languages, runtimes, frameworks, databases, major libs. Keep in `_<slug>.md` as one-liners.
- **Layout.** Repo structure, monorepo packages, where things live.
- **Relationships.** What this project depends on / is used by. Record both in YAML frontmatter (`depends_on` / `used_by`) AND as prose in the Relationships section.
- **Target state.** How it should work when done (or next). Distinct from current state.
- **Open questions.** Design tensions, unresolved tradeoffs. Future-you should inherit these, not re-discover them.
- **Load-bearing weirdness.** Things that defy expectation. What you'd normally assume but shouldn't.

**When a topic deserves its own note:**

If a section of `_<slug>.md` is growing past a few paragraphs, or a topic needs diagrams, code, or deep detail — split it into a dedicated file in the same folder (`architecture.md`, `data-model.md`, `deploy.md`, `auth-flow.md`, whatever). Wikilink it from `_<slug>.md`. This keeps the entry point scannable and uses Obsidian's graph to make navigation first-class. Remember: every topic file also carries `#project/<slug>`.

**External references and attachments:**
- A project-relevant URL, screenshot, PDF, diagram, Figma file, issue/PR, Slack/Teams thread, vendor doc, or dashboard is durable when it explains how the project works or where future-you should look.
- Store links with context in the project note or `projects/<slug>/references.md` when several accumulate.
- If a local screenshot/image/PDF is available and safe to keep, place it in `projects/<slug>/` and embed/link it from the relevant note (`![[filename.png]]`, `[[datasheet.pdf]]`). Use descriptive lowercase-kebab filenames.
- Do not mirror large, sensitive, or secret-bearing assets. For external-only assets, link with owner/source, date, and why it matters.

When in doubt, write. A slightly-too-frequent write is a far smaller failure mode than future-you re-deriving the same fact. (The tradeoff is bounded by the consolidate guide's dedup pass.)

### Don't duplicate what the repo owns

If the project has a real README, ARCHITECTURE.md, or ADR directory, don't copy their content into the brain. Point at them from `_<slug>.md` and capture only what isn't there:

- Your mental model that differs from or extends the docs.
- Gotchas discovered in practice that the docs miss.
- Conventions inferred from code that aren't documented.
- Open questions and design tensions not yet resolved.

The brain is the agent's private notebook. The repo is the public record. Don't mirror.

## Procedure

### 1. Classify

Answer two questions:

- **Scope**: cross-cutting (vault root) or project-scoped (`projects/<slug>/`)?
- **Type**: person / pref / tool / codestyle / decision / gotcha / conventions / other?

Mapping:

| What surfaced                                         | Scope         | File                                                                      |
|-------------------------------------------------------|---------------|---------------------------------------------------------------------------|
| Preference about the user                             | cross-cutting | `person-user.md`                                                          |
| Preference not tied to a person                       | cross-cutting | `pref-<slug>.md`                                                          |
| Tool config/usage                                     | cross-cutting | `tool-<slug>.md`                                                          |
| Language idiom or formatting rule                     | cross-cutting | `codestyle-<lang>.md`                                                     |
| Cross-project decision                                | cross-cutting | `decision-<slug>.md`                                                      |
| Reusable trap                                         | cross-cutting | `gotcha-<slug>.md`                                                        |
| Fixable issue with a project, MCP, tool, or skill     | cross-cutting | append line to `improvements.md` (see `brain/improve/GUIDE.md` for format)|
| Project convention (commands, structure, patterns)    | project       | `projects/<slug>/conventions.md` (create only when useful)                |
| Project decision with reasoning                       | project       | `projects/<slug>/decisions.md` (create only when useful; append dated block) |
| Project-specific trap                                 | project       | `projects/<slug>/gotchas.md` (create only when useful; append)            |
| Project external reference / attachment               | project       | relevant project note, or `projects/<slug>/references.md` once references accumulate |
| New project just surfaced                             | project       | create `projects/<slug>/_<slug>.md` using the skeleton (see brain SKILL.md) |
| Updated mental model / purpose / tech stack / layout  | project       | edit `projects/<slug>/_<slug>.md` in place                                |
| Deep architecture, data model, deploy, or big topic   | project       | create or edit `projects/<slug>/<topic>.md` (ad-hoc), link from `_<slug>` |
| New project-to-project relationship                   | project       | update the affected `_<slug>.md` frontmatter and Relationships prose      |
| Relationship reinterpretation / project retired       | both          | update `index.md` project state if needed and the affected `_<slug>.md` files |

**Tag discipline for project-scoped notes:** every markdown note in `projects/<slug>/` ends with the `#project/<slug>` tag. This is non-optional. Attachments do not carry tags themselves; they are discoverable through the note that embeds or links them.

### 2. Search before writing

Prefer native `Grep` for filename/content hits:

```
Grep pattern="<keywords>" path=<brain-vault-path>
```

For prose-oriented indexed search, use the CLI:

```
obsidian vault=<brain-vault-name> search query="<keywords>"
```

If a relevant note exists, append or edit it. Do NOT create a near-duplicate.

### 3. Write

**New note** (use native `Write`):

```
Write filePath=<brain-vault-path>/<path>.md content="---
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Title>

<body>

#<tags>"
```

**Append to existing note** (use native `Edit` with targeted old/new, OR the CLI append if Obsidian is open):

Native (preferred):
```
Edit filePath=<brain-vault-path>/<path>.md oldString="<existing trailing content>" newString="<existing trailing content>\n- <new fact>"
```

CLI alternative (requires Obsidian running):
```
obsidian vault=<brain-vault-name> append path=<path> content="\n- <new fact>"
```

For `decisions.md` and `gotchas.md`, append chronologically. Each entry should be dated:

```
## YYYY-MM-DD — <short title>
<reasoning or details>
```

### 4. Link

If the new note is meaningful across projects, add a link from `index.md`. If it's a project note, make sure `projects/<slug>/_<slug>.md` references it. If it's a new project entirely, register it in the Projects section of `index.md`.

### 5. Confirm (only when the user explicitly asked)

If the user used an explicit ask ("remember this", "save that", etc.), tell him in one line what you wrote and where:

> Saved to `projects/example-project/gotchas.md`.

Do not read the whole note back.

For every other case — implicit user intent or your own judgment — don't announce the write unless the fact is directly relevant to the current conversation. Silent captures are fine and usually preferred. The vault is for future-you, not a narration of current-you.

## What counts as "durable"

- Preferences, decisions, conventions, tools, traps, people — yes.
- One-off error messages, current line numbers, "we're editing this file right now" — no.
- Speculation or unverified assumptions — no. Ask or verify first.

## Edge cases

- **Ambiguous scope**: if unsure cross-cutting vs project, ask. A wrong placement is worse than a two-second clarification.
- **New project**: create `projects/<slug>/_<slug>.md` using the skeleton, register it in the Projects section of `index.md`, then write the fact into the appropriate file within the folder. Do not create empty companion stubs.
- **Conflicts existing note**: update the existing note and bump `updated:`. Note the change briefly in the body if it reverses a prior claim.
- **Obsidian not running**: native file tools still work for create/edit/grep. Save via `Write`/`Edit`. If the user wants a linter pass or indexed search, defer that part until the app is open.

## Red flags

- You're about to create a second note on the same topic. Search first; update the existing one.
- You're writing an unverified claim as fact. Verify or annotate.
- You're creating a note deeper than `projects/<slug>/`. Stop — the structure is flat beyond that.

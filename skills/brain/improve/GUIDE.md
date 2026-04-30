# Guide — Continuous Improvement

Capture and later work through a backlog of issues noticed across projects, MCPs, tools, and skills.

**Backlogs live in two places by scope:**

- **Root**, `<brain-vault-path>/improvements.md` — cross-cutting items only (MCPs, tools, skills, vault hygiene, global prefs, environment). This file also indexes the per-project backlogs.
- **Per project**, `<brain-vault-path>/projects/<slug>/improvements.md` — issues scoped to one project. Create the file the first time a project-specific item is logged. Tagged `#improvement` and `#project/<slug>`.

Individual entries may also appear in project notes (gotchas, `_<slug>.md` open questions). The backlog files are the master index; those other notes are cross-references.

This guide has two distinct workflows: **capture** (low-ceremony, fires during any session when you notice an issue) and **pass** (explicit work-through session that triages and fixes items).

## Workflow 1 — Capture

### When to run

Fire on your own judgment, no permission needed. Trigger scenarios:

- You notice an MCP is slow, noisy, returns bad data, or is misconfigured.
- A tool behaves in an unexpected way that isn't worth fixing mid-task but should be fixed.
- A skill or guide has a gap, loophole, or wrong instruction you just worked around.
- A project has code smell / architectural debt / missing infrastructure that the user didn't explicitly flag.
- You hit a permission prompt, a permissions gap, a missing alias, a brittle script, a stale config.
- The user makes a passing comment that signals dissatisfaction with a fixable thing ("yeah that's ugly", "we should fix that sometime", "this is slow", "ugh this tool always"). Infer the intent — they are noting a fix-later, not asking you to fix it now.

**Don't let fixable annoyances evaporate.** If you felt friction, write it down.

### Procedure

1. **Don't derail.** Capture is meant to be fast. Don't context-switch away from the current task to fix the issue. Just log it.

2. **Decide scope first** — one project, or cross-cutting?
   - **One project** (the issue is inside a specific repo, e.g. a stale comment in that repo's pyproject, a missing `.env.example`, a package-name mismatch): log in `projects/<slug>/improvements.md`. Create the file if it doesn't exist yet, using the template below.
   - **Cross-cutting** (MCPs, tools, skills, vault hygiene, global preferences, environment, or an issue that spans >1 project): log in the root `improvements.md`, in the right section.

3. **Read the relevant backlog once per session** to avoid duplicates. For a project-scoped capture that's the project's `improvements.md`; for cross-cutting, that's the root. If you've already read it this session, skip.

4. **Append one line.** Same format in either file:

   ```
   - [ ] YYYY-MM-DD (priority) — [[target]] — description. (proposed fix, if obvious)
   ```

   - `priority` is `low` / `med` / `high`. Err toward `low`; high means "this is actively causing damage."
   - `[[target]]` is a wikilink to the affected note when one exists (e.g., `[[tool-obsidian-cli]]`, `[[_example-project]]`). For project-scoped items inside that project's own file, the target is often a file path + line number rather than a wikilink — plain text is fine.
   - Keep the line short. One sentence. Proposed fix is optional.

5. **If you just created a project's `improvements.md`**, also:
   - Add a link to it from the project's `_<slug>.md` "Companion notes in this folder" section.
   - Add it to the "Per-project backlogs" index in the root `improvements.md`.
   - Template for a fresh file:

     ```markdown
     ---
     created: YYYY-MM-DD
     updated: YYYY-MM-DD
     ---

     # Improvements — <project-slug>

     Project-scoped backlog of fixable issues. Same format as the root `[[improvements]]`, but for items that only concern this project. Cross-cutting / agent / tooling issues still go in the root backlog.

     ## Open

     - [ ] YYYY-MM-DD (priority) — description. (proposed fix, if obvious)

     ## Fixed (recent)

     _(none yet)_

     #project/<slug> #improvement
     ```

6. **Don't announce the capture** unless it's directly relevant to the current conversation. Silent log is fine and usually preferred.

### What NOT to capture

- Problems that are the current task. Fix those, don't log them.
- Opinions without actionable fix ("I don't like this codebase"). Only log things with a clear shape of remediation.
- Things that belong in a project's own issue tracker. The brain's backlog is for agent/environment/meta issues, not things that should be GitHub/Linear issues on the project itself. If something belongs in the project's tracker, record it there and skip the brain backlog.
- Notes about the user's preferences. Those go in `person-user.md`, not here.

## Workflow 2 — Pass (explicit improvement session)

### When to run

Infer from context. Examples of signals:

- Explicit: "let's do an improvement pass", "work the backlog", "clean up some tech debt".
- Scoped: "what have you been collecting about the Linear MCP?" — do a scoped pass on MCPs only.
- Implicit: user asks to review the backlog, or asks what you've been noting — reading the backlog and surfacing categories is appropriate; actually fixing things still requires confirmation.

Do NOT run a pass implicitly without a signal. This workflow touches external systems; it requires intent.

### Procedure

1. **Read the relevant backlog(s):**
   - If the user's pass is **scoped to a project** ("let's clean up example-project"), read `projects/<slug>/improvements.md` only.
   - If the user's pass is **cross-cutting or broad** ("let's do an improvement pass"), read the root `improvements.md` first. The root file's "Per-project backlogs" index lists every project that has one — read those too if the pass might touch them, or ask the user whether to include them.
   - If the user names a specific section ("what have you been collecting about the Linear MCP?"), read just the root; MCP items never live in project folders.

2. **Surface the plan to the user.** Group by section (and by project when per-project lists are in scope). For each section, list open items with priority. Ask which section(s) / project(s) to work through this pass, or whether to go by priority across sections. Do not start fixing without confirmation — this is the one place the improve workflow is opt-in per execution.

3. **Work items one at a time.** For each:
   - Re-read the item and its target note.
   - Propose the fix (brief).
   - If the user approves, execute.
   - If the fix succeeds, check the box and move the item to the **same file's** `## Fixed (recent)` section with a one-line note: `YYYY-MM-DD — fixed: <what you did>`. Project items stay in the project's file; cross-cutting items stay in the root file. Don't shuffle them between files on closure.
   - If the fix is out of scope this pass, leave it and move on.
   - If the fix requires decisions the user needs to make, ask; don't guess.

4. **After the pass, prune.** Items in `## Fixed (recent)` that are more than ~30 days old can be deleted. The backlog isn't a changelog — a git history of this file (if we ever add one) is a changelog.

5. **Report.** One paragraph: what was fixed, what was skipped, what surfaced new items during the pass (these should have been captured along the way).

### Guardrails

- **Never bulk-execute fixes.** One at a time, the user approves each.
- **Don't retire items that aren't actually fixed.** "I decided it wasn't important" is not the same as "fixed." Delete the item or demote its priority with a reason.
- **Don't add items mid-pass without logging them.** If a new issue surfaces while working another, capture it (Workflow 1) so it doesn't disappear.

## Integration with other guides

- **`brain-startup`**: does NOT read the backlog by default. Too much context for every session. Only read when the task is improvement-flavored or the user asks.
- **`brain-remember`**: when capturing something that's *also* an improvement (e.g., a gotcha that's fixable), write it to both places — the gotcha note for "this is how it behaves" and the backlog for "we should fix this."
- **`brain-extract`**: end-of-session extraction should surface any uncaught improvement items — if you noticed something this session and didn't log it, log it now.
- **`brain-consolidate`**: the backlog itself is subject to hygiene. During a consolidate pass, prune stale fixed items, merge duplicate entries, normalize formatting.

## Red flags

- You started fixing issues during a normal session without an explicit pass request. Stop — capture the issue and defer.
- You logged an item without a clear shape of remediation. Revisit and either clarify the fix or delete.
- The backlog has 50+ items. Consolidate. Either the user isn't doing passes, or you're logging too much; figure out which.
- The backlog has more than ~10 open items and you reach extract/wrap-up without mentioning it. Surface that it is growing and ask whether the user wants an improvement pass.
- You fixed something and didn't update the backlog. Always close the loop.

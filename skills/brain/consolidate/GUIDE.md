# Guide — Vault Consolidation

Periodic maintenance pass over the configured brain vault at `<brain-vault-path>`.

This is a repair operation. It does not capture new information — it improves what's already there. Only run when explicitly requested or when cleanup debt has obviously accumulated.

## When to run

Infer from context, not specific phrases. Examples of signals:

- The user asks for vault cleanup or hygiene (explicit: "clean up the brain", "tidy this", "consolidate"; implicit: "this is getting messy," "can we deduplicate").
- The startup guide reveals duplicates or stale notes during orientation.
- The extract guide found an existing note conflicts with new information.
- Orphans have accumulated (many notes not linked from `index.md` or a project `_<slug>.md`).

Do NOT run consolidation implicitly on every session. It's expensive and risks churning the vault unnecessarily. Wait for a real signal.

## Procedure

### 1. Scan

```
Glob pattern="**/*.md" path=<brain-vault-path>                    # List all notes
obsidian vault=<brain-vault-name> tags counts sort=count          # Tag distribution (needs app)
obsidian vault=<brain-vault-name> orphans                         # Notes with no incoming links
obsidian vault=<brain-vault-name> unresolved                      # Broken wikilinks
```

Skim `index.md` and each `projects/<slug>/_<slug>.md`. Build a mental list of:

- Near-duplicate notes (same topic, different filenames)
- Notes with stale `updated:` dates and content that conflicts with current reality
- Orphans that should be linked from an index
- Broken wikilinks
- Misplaced notes (cross-cutting note that should be project-scoped, or vice versa)
- Project folders missing `_<slug>.md`, or optional companion files that clearly should exist because there is real content for them
- Project notes missing the `#project/<slug>` tag (every project-scoped note must carry it)

### 2. Plan before editing

Write a short internal plan before making changes. For each issue:

- What is the fix? (merge / delete / move / update / link)
- Which notes are affected?
- In what order should changes happen to avoid breaking links?

Surface the plan to the user for confirmation before destructive edits (deletes, merges). Non-destructive edits (adding links, fixing typos, bumping `updated:`) can proceed without confirmation.

### 3. Execute

**Merge duplicates:**
1. Pick the canonical note (usually the better-named / better-linked one).
2. Move unique content from the duplicate into the canonical note via `Edit`.
3. Delete the duplicate: `obsidian vault=<brain-vault-name> delete path=<duplicate>` (CLI is safer because it also updates Obsidian's link graph).
4. Fix inbound links to point at the canonical note.

**Update stale notes:**
1. Edit the body to reflect current reality.
2. Bump `updated:` in frontmatter.
3. If the note reverses a prior claim, briefly note the reversal in the body.

**Move misplaced notes:**

Prefer the CLI for moves — it keeps wikilinks intact:
```
obsidian vault=<brain-vault-name> move path=<old> to=<new>
```

If Obsidian is not running, use native `Bash mv` and then fix wikilinks manually with `Grep` + `Edit`.

**Fix orphans:**
If the note is useful, link it from `index.md` or the relevant `projects/<slug>/_<slug>.md`. If the note is no longer useful, confirm with the user before deleting.

**Fix broken wikilinks:**
Update the source note to point at the correct target, or remove the link if the target is gone.

**Fill project folder gaps:**
If a project folder is missing `_<slug>.md`, `conventions.md`, etc., create stubs only if there's content to put in them. Empty stubs are noise.

**Backfill missing tags:**
Any project-scoped note without `#project/<slug>` gets the tag appended. Non-destructive; safe to run without confirmation.

### 4. Report

Summarize in a few bullets what changed. Example:

> Consolidation pass complete:
> - Merged `tool-obsidian.md` into `tool-obsidian-cli.md` (canonical).
> - Moved `decision-deploy-via-ci.md` into `projects/example-project/decisions.md` (project-scoped).
> - Updated `person-user.md` (bumped `updated:`, added communication-style note).
> - Removed 3 orphan notes with user confirmation.
> - Fixed 2 broken wikilinks in `index.md`.
> - Backfilled `#project/example-project` on 2 notes that were missing it.

## Guardrails

- **Never delete without surfacing the plan first.** The user should see what's going away.
- **Never bulk-rewrite notes.** Edit narrowly. Preserve anything you aren't certain is wrong.
- **Preserve history in edits.** If a note reverses a prior claim, say so. Don't silently rewrite.
- **One consolidation pass at a time.** If the vault is large, fix the worst issues, stop, and let the user review before continuing.
- **Don't touch project-owned content.** Conventions and decisions set by the user stay unless they ask for changes. You're cleaning the storage, not editing the ideas.

## Red flags

- You're about to delete more than one note without user confirmation. Stop.
- You're about to silently rewrite a note's body to remove content you disagree with. Stop — surface the disagreement instead.
- You started consolidating proactively during a normal session. This skill is opt-in, not automatic.
- You're creating stubs for project files "for completeness". Stubs with no content are noise; don't create them.

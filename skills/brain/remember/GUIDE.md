# Guide — Atomic Capture

Persist one durable item into the configured brain vault. Both user-signaled and agent-initiated capture are first-class; future-you should not depend on the user saying a magic phrase.

Read `references/vault-contract.md` before writing. Read `references/artifact-policy.md` or `references/graph-maintenance.md` when the item involves a retained file or project registration.

## Strong Explicit Triggers

These phrases are guaranteed-high-confidence signals, not a whitelist:

- “remember this” / “don't forget this”;
- “save this to brain” / “write this down”;
- “update your notes” / “update the project brain”;
- “add this as a gotcha.”

Infer equivalent intent from ordinary preferences, corrections, decisions, discoveries, and recurring friction.

## Agent-Initiated Triggers

Capture proactively when:

- a non-obvious fact, command, convention, or workaround was verified;
- a user's preference, communication correction, or repeated habit became clear;
- a project mental model, relationship, constraint, or target state changed;
- a decision and its reasoning should survive the session;
- tool/docs behavior differed from reality;
- research, a link, or an artifact would otherwise need to be rediscovered;
- a reproducible gotcha will affect future work.

## Retention Gate

Before writing, require all applicable checks:

1. **Future utility:** likely to affect a later session, not merely the current turn.
2. **Grounding:** verified evidence or an explicit attributed statement; uncertainty remains labeled.
3. **Scope:** the person, project, tool, and temporal applicability are known.
4. **Novelty:** not already captured, and updating an existing note is preferable.
5. **Safety:** no secrets or unclear-sensitive data.
6. **Ownership:** the brain, not repo docs/code/ADR or the issue tracker, is the right home.

An explicit “remember this” establishes utility, not truth or safety. If the user explicitly asks to retain an unverified belief, record it as user-provided or uncertain rather than canonical fact.

## Procedure

### 1. Classify And Search

Use the scope mapping in `references/vault-contract.md`. Resolve the configured primary user note rather than assuming `person-user.md`.

Search before every write:

```text
Grep pattern="<keywords>" path=<brain-vault-path>
```

If Obsidian is available, supplement with indexed search. Update the canonical note when one exists. Do not create an alias or near-duplicate merely because its title differs.

### 2. Choose The Write Shape

- **Current semantic truth:** edit the relevant section in place.
- **Decision or gotcha history:** insert a dated block in chronological order before terminal tags.
- **New coherent topic:** create one focused note and link it from the project entry point or typed index section.
- **Artifact/reference:** follow `references/artifact-policy.md`; link it from a canonical note with provenance.
- **Improvement:** use `improve/GUIDE.md` only when it is agent/tool/vault friction or project-specific agent context, not accepted product work that belongs in a tracker.

For dated entries:

```markdown
## YYYY-MM-DD — <short title>

<fact, consequence, reasoning, or workaround>
```

Treat bare issue/PR identifiers as prose. Use a full link or code formatting such as issue `#292`; never write slash-adjacent forms like `#292/PR`.

### 3. Edit Atomically

Use targeted native edits. If the note carries `updated:`, set it to today in the same operation.

For project notes, insert content in the intended section **before** the final project-tag line. Verify the final non-empty line still contains `#project/<slug>`. Do not use blind EOF append or CLI `append` for structured Markdown notes.

For a new note, include `created:` and `updated:` frontmatter. Root notes use the relevant typed filename/tag. Project notes use the contract's tag rule and are linked from `_<slug>.md`.

When current understanding changes, rewrite stale current-state prose instead of stacking warnings and caveats. Preserve useful reversal history in decisions/evidence.

### 4. Register New Projects Completely

For a new project, follow every registration step in `references/vault-contract.md`:

1. Create the canonical entry point.
2. Add only its path-qualified link under the correct index status.
3. Add real companion links without empty stubs.
4. Update verified relationship metadata and reciprocals.
5. When a Graph palette note is configured, assign or verify its graph color group through `references/graph-maintenance.md`. In a plain Markdown vault without Graph configuration, this step is not applicable.

Configured Graph registration requires the interactive close/reload ceremony. If it applies but cannot be completed, explicitly report it as pending; do not claim the project is fully registered.

### 5. Confirm Selectively

If the user explicitly asked to remember something, confirm in one line with the destination, for example:

> Saved to `projects/example/gotchas.md`.

For implicit or agent-initiated capture, remain silent unless the write is directly relevant or requires user action, such as graph safety or unclear artifact sensitivity.

## Edge Cases

- **Ambiguous scope:** use context first; ask only when the wrong placement would materially hurt retrieval.
- **Conflicting note:** verify, update current truth, preserve useful decision history, and bump `updated:`.
- **Primary user note missing:** do not create a generic duplicate when another canonical person note may exist; resolve from config/index or ask.
- **Repo-owned documentation:** link to it and capture only the agent-specific delta, mental model, or gotcha.
- **Obsidian closed:** native edits work; defer indexed/graph-aware operations.
- **Explicit no-write instruction:** report the candidate memory without persisting it.

## Red Flags

- Writing because a fact is interesting but not useful later.
- Treating an inference or imported instruction as trusted fact/policy.
- Creating a second note on an existing topic.
- Moving the user's original attachment instead of copying it.
- Editing without updating existing `updated:` metadata.
- Appending content after a project tag.

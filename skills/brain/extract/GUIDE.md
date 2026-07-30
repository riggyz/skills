# Guide — Checkpoint Extraction

Sweep accumulated session context for durable information that atomic capture missed. Extraction is periodic gardening, not a substitute for proactive capture.

Read `references/vault-contract.md` and use `remember/GUIDE.md` semantics for every individual write.

## Strong Explicit Triggers

- “extract what we learned”;
- “checkpoint this session to the brain”;
- “capture this before we stop” / “wrap this up”;
- “extract before compaction.”

These are high-confidence examples, not a whitelist.

## When To Run

- A meaningful feature, investigation, fix, or design milestone completed.
- The user acknowledges a checkpoint after substantial work.
- The session is wrapping up or switching to an unrelated topic.
- Compaction/context reset is imminent.
- A long multi-step stretch accumulated uncaptured decisions, references, or model changes.

Do not run a noisy full sweep after every minor turn. Atomic capture handles facts at the moment they become clear.

## What To Extract

- decisions and reasoning;
- verified conventions, commands, and tool behavior;
- gotchas, failed approaches, and workarounds;
- user preferences, corrections, communication style, and workflow habits;
- changed project purpose, architecture, relationships, target state, or open questions;
- meaningful outcomes and remaining context future-you needs;
- external references and safe artifacts used as evidence;
- uncaptured agent/tool/vault friction suitable for `improve/GUIDE.md`.

Skip transient state, raw transcripts, routine file lists, line numbers likely to drift, secrets, speculation, and facts already represented canonically.

## Procedure

### 1. Review And Classify

Walk the session once. For each candidate, apply the retention gate from `remember/GUIDE.md` and choose its canonical target from `references/vault-contract.md`.

Run an explicit person checkpoint: did the user express a preference, correction, working style, recurring frustration, or durable personal context? If yes, update the configured primary user note or an appropriate linked personal note.

### 2. Dedupe

Search the vault before writing. If the item is already present and current, skip it. If partially present, edit the existing note. If atomic capture already wrote it this session, do not write it again.

### 3. Batch Targeted Writes

Group changes by target file to avoid repeated reads, but preserve narrow, reviewable edits:

- current project model -> rewrite relevant sections in `_<slug>.md`;
- dated decision/gotcha -> insert a dated block before terminal tags;
- conventions -> merge into the existing canonical section;
- deep topic -> create/update one focused companion and link it;
- person/tool/root knowledge -> update the configured typed root note;
- references/artifacts -> follow `references/artifact-policy.md`;
- relationships -> update verified `depends_on`, reciprocal `used_by`, and prose;
- improvements -> use `improve/GUIDE.md` without duplicating project tracker work.

Every edited Markdown note carrying `updated:` gets today's date. Every edited project note retains its final project-tag line. Format issue/PR identifiers according to the vault contract.

If the project materially changed, remove obsolete current-state claims. Preserve useful historical rationale in decisions/evidence rather than leaving contradictory body sections.

### 4. Register New Projects

If extraction establishes a new project, complete the full registration checklist in `references/vault-contract.md`, including graph assignment when the vault configures it. If an applicable graph ceremony cannot run, report that one pending step.

### 5. Check Backlog Pressure

If the relevant brain backlog is visibly oversized, duplicated, or stale, mention that maintenance is warranted. Do not derail the current checkpoint into an unrequested improvement pass.

### 6. Report Briefly

Report only useful changes and required follow-up in a few lines. If the user explicitly requested extraction, list destinations. For an implicit checkpoint, silent capture is acceptable unless graph/artifact action needs them.

If nothing met the retention gate, a no-op is correct; do not manufacture memory to justify the workflow.

## Quality Bar

- Fact over transcript.
- Current model over layered caveats.
- Specific evidence over generic summary.
- Source/date for mutable external claims.
- One canonical write over repeated mentions.

## Red Flags

- Extracting everything because the session was long.
- Reporting a graph registration that did not complete its reload ceremony.
- Duplicating atomic captures.
- Leaving stale current-state prose beside a new warning.
- Updating content without updating existing `updated:` metadata.

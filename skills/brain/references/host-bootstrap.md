# Host Bootstrap

Agent Skill descriptions are model-selected metadata. They cannot guarantee lifecycle timing. Put only the tiny always-on bootstrap in the host instruction layer; keep learned memory in the vault and procedures in the suite.

## OpenCode

Global instructions live at:

```text
~/.config/opencode/AGENTS.md
```

Merge this instruction into the existing file; do not overwrite unrelated global rules:

```markdown
## Brain memory

At turn 1 of every session and after context compaction, invoke `brain` through the host's native skill loader, retain the exact base directory it returns, and then invoke `brain-contextualize` before substantive work. Never locate suite skills by listing or searching parent skill directories, reading `SKILL.md` directly, or probing alternate config paths. From there, use `brain-recall` for targeted retrieval, `brain-remember` proactively for durable capture and checkpoints, `brain-consolidate` for structural maintenance, `brain-synthesize` for cross-owner pattern promotion, and `brain-build` for substantial durable onboarding. Do not load every operator at startup; the user should not have to manage memory curation.
```

OpenCode loads configuration-time files once. Quit and restart OpenCode after installing/updating the suite or global `AGENTS.md`; the current session retains already-loaded content.

## Claude Code

The equivalent user-level instruction file is `~/.claude/CLAUDE.md`. Use the same short instruction. Claude Code also supports lifecycle hooks when deterministic session-start or pre-compaction execution is required.

## Principle

The host bootstrap should only guarantee loading/routing. Do not copy the vault contract, workflow guides, or learned memories into global instructions; that would duplicate state and consume every session's context.

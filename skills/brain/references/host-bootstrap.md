# Host Bootstrap

Agent Skill descriptions are model-selected metadata. They strongly encourage activation but cannot, by themselves, guarantee lifecycle timing such as turn-one orientation or pre-compaction checkpointing. Put only the tiny always-on bootstrap in the host's global instruction layer; keep learned memory in the vault and procedures in this skill.

## OpenCode

Global instructions live at:

```text
~/.config/opencode/AGENTS.md
```

Merge this instruction into the existing file; do not overwrite unrelated global rules:

```markdown
## Brain memory

At turn 1 of every session and after context compaction, load the `brain` skill before substantive work. Use it throughout work for proactive durable capture, targeted recall, and milestone checkpointing; the user should not have to manage memory curation.
```

OpenCode loads configuration-time files once. Quit and restart OpenCode after installing or updating the skill or global `AGENTS.md`; the current session retains its already-loaded skill content.

## Claude Code

The equivalent user-level instruction file is `~/.claude/CLAUDE.md`. Use the same short instruction. Claude Code also supports lifecycle hooks when deterministic session-start or pre-compaction execution is required.

## Principle

The host bootstrap should only guarantee loading/routing. Do not copy the vault contract, workflow guides, or learned memories into global instructions; that would duplicate state and consume every session's context.

# Skills

Generic Agent Skills source repo and tooling.

This repository stores skills in the open Agent Skills format used by `npx skills` and compatible agents. Each skill lives in its own directory under `skills/` and contains a required `SKILL.md` file with YAML frontmatter.

## Quick Start

Install Node dependencies:

```sh
npm install
```

List the skills discoverable from this repo:

```sh
npm run skills:list
```

Validate all skills and print size/token budget estimates:

```sh
npm run skills:validate
```

Run deterministic tests:

```sh
npm test
```

## Skills

- `attribution` — configurable attribution rules for GitHub, Linear, Azure DevOps, and similar systems.
- `brain` — agent-owned cross-session memory, targeted recall, proactive capture, checkpointing, artifacts, and vault maintenance backed by an Obsidian vault.
- `deep-dive` — substantial project onboarding/refresh workflow that writes an evidence-backed mental model into the brain vault.
- `skill-creator` — Anthropic's Apache-2.0 skill for creating, reviewing, evaluating, and improving Agent Skills.

## Third-Party Skills

- `skills/skill-creator/` is copied from [`anthropics/skills`](https://github.com/anthropics/skills/tree/main/skills/skill-creator) and keeps its bundled `LICENSE.txt`.

## Install

List the skills in this repo:

```sh
npm run skills:list
```

Install every skill globally for every supported agent:

```sh
npx skills add . --global --all --full-depth
```

Install a single skill globally:

```sh
npx skills add . --global --skill brain --full-depth
```

Install the memory pair specifically for OpenCode:

```sh
npx skills add . --global --agent opencode --skill brain deep-dive --full-depth --yes
```

The Skills CLI uses the universal global store at `~/.agents/skills/` for OpenCode and other compatible agents. OpenCode scans that location automatically; an explicit `--agent opencode` install makes the intended consumer unambiguous. Quit and restart OpenCode after installing or updating skills; running sessions keep the skill content they loaded at startup.

Install into the current project instead of globally by omitting `--global`:

```sh
npx skills add . --skill attribution --full-depth
```

## Configure Attribution

The `attribution` skill does not hardcode a personal name or emoji. Generate the local config before installing or syncing the skill:

```sh
npm run configure:attribution -- --name "My Agent" --emoji "<emoji>"
```

This writes `skills/attribution/references/attribution-config.md`, which is ignored by git.

## Configure Brain

The `brain` skill does not hardcode a vault name or path. Generate the local config before installing or syncing the skill:

```sh
npm run configure:brain -- --vault-name "my-vault" --vault-path "/absolute/path/to/vault"
```

Optional overrides:

```sh
npm run configure:brain -- \
  --vault-name "my-vault" \
  --vault-path "/absolute/path/to/vault" \
  --primary-user-note "person-user.md" \
  --graph-palette-note "tool-vault-graph.md"
```

Without overrides, configuration detects a sole canonical `person-*` link/note and `tool-vault-graph.md` when present. If several person notes remain ambiguous after consulting `index.md`'s People section, configuration stops and requires `--primary-user-note` rather than guessing. It also requires an initialized vault with `index.md`. This writes `skills/brain/references/brain-config.md`, which is ignored by git. Without it, the skill stops on first use and asks for configuration.

To make turn-one brain loading deterministic in OpenCode, merge the short bootstrap from `skills/brain/references/host-bootstrap.md` into `~/.config/opencode/AGENTS.md`. Keep the full workflow in the skill rather than duplicating it in global instructions.

## Audit Brain Vault

Run the read-only vault doctor against the configured vault:

```sh
npm run brain:audit
```

Or pass another vault explicitly:

```sh
npm run brain:audit -- --vault-path "/absolute/path/to/vault" --strict
```

The doctor checks typed/root and project index coverage, canonical graph groups and query overlap, palette RGB conversion, project tags, companion links, relationship reciprocity, startup note sizes, phantom issue tags, and backlog pressure. It never edits the vault.

## Development

Type-check TypeScript scripts:

```sh
npm run typecheck
```

Run the brain doctor fixture tests:

```sh
npm run test:brain
```

Behavior-level prompts live in `skills/brain/evals/evals.json`. `npm test` validates their coverage; execute comparative model runs through the `skill-creator` workflow described in `skills/brain/evals/README.md`.

Validate one skill:

```sh
npm run skills:validate:attribution
```

The validator is `skills/skill-creator/scripts/quick_validate.py`. It checks Agent Skills frontmatter and reports static budgets:

- Description character count and estimated tokens.
- `SKILL.md` line count and estimated tokens.
- Body line count and estimated tokens.
- Warnings for descriptions over 1024 characters, bodies over 500 lines, or bodies over roughly 5000 estimated tokens.

Token counts are estimates using a chars/4 heuristic. They are useful for keeping skills lean, not exact model accounting.

## Layout

```txt
skills/
  <skill-name>/
    SKILL.md
    scripts/      # optional
    references/   # optional
    assets/       # optional
```

The `name` field in each `SKILL.md` must match its parent directory name.

## Repo Guide

Use this repo as the source of truth for skills. Installed global OpenCode or Claude skills should be treated as deployed copies, not edited directly.

When adding a skill:

1. Create `skills/<skill-name>/SKILL.md`.
2. Keep the `name` frontmatter equal to `<skill-name>`.
3. Put trigger guidance in `description`.
4. Keep core instructions in `SKILL.md`; move long docs to `references/`.
5. Put deterministic helper code in `scripts/`.
6. Run `npm run skills:validate` and `npm run skills:list`.

When editing a vendored skill:

- Keep its license file with the skill.
- Note local changes in this README if they matter.
- Prefer small patches over rewriting upstream content.

Generated local config files, like attribution identity, should stay ignored by git.

The `.skill` packager excludes generated attribution/brain configuration files so distributable archives cannot leak local identity or vault paths. Direct local installs from this repository intentionally use the configured source tree.

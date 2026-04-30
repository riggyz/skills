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

## Skills

- `attribution` — configurable attribution rules for GitHub, Linear, Azure DevOps, and similar systems.
- `brain` — persistent cross-session memory workflow backed by an Obsidian vault.
- `deep-dive` — exhaustive project onboarding workflow that writes durable notes into the brain vault.
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

## Development

Type-check TypeScript scripts:

```sh
npm run typecheck
```

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

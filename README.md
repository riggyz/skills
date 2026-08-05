# Skills

Source repository for reusable Agent Skills in the open format used by `npx skills` and compatible agents.

## Quick Start

```sh
npm install
npm run skills:list
npm run skills:validate
npm test
npm run typecheck
```

`npm test` runs deterministic script and corpus tests. Model behavior/trigger evaluations use the `skill-creator` workflow and are reviewed separately.

## Skills

- `attribution`: configurable external-work attribution.
- `brain`: shared brain-suite foundation, contract, configuration, and router.
- `brain-contextualize`: read-only turn-one and context-switch orientation.
- `brain-recall`: bounded read-only memory retrieval.
- `brain-remember`: proactive/explicit capture and checkpoints.
- `brain-consolidate`: structural doctor, repair, migration, archive, and forgetting.
- `brain-synthesize`: cross-owner pattern reporting and automatic high-confidence promotion.
- `brain-build`: durable onboarding/refresh for repositories, workspaces, wikis, and tools.
- `skill-creator`: Anthropic's Apache-2.0 skill for creating and evaluating skills.

The seven `brain*` skills form one versioned suite. Install and update them together; operator skills are not standalone packages.

## Configure Brain

Brain deployment configuration lives outside installed skill directories at:

```text
${XDG_CONFIG_HOME:-$HOME/.config}/agent-brain/config.json
```

Generate it after the target vault paths exist:

```sh
npm run configure:brain -- \
  --vault-name "oc-brain" \
  --vault-path "/absolute/path/to/vault" \
  --primary-context "wikis/user/_user.md" \
  --graph-palette-node "tools/vault-graph/_vault-graph.md"
```

The script accepts legacy `--primary-user-note` and `--graph-palette-note` flag names during migration. It requires an initialized vault and verifies every configured Markdown path.

## Install

Install the complete suite globally for OpenCode:

```sh
npx skills add . --global --agent opencode \
  --skill brain \
  --skill brain-contextualize \
  --skill brain-recall \
  --skill brain-remember \
  --skill brain-consolidate \
  --skill brain-synthesize \
  --skill brain-build \
  --yes
```

Then run `npm run brain:suite:verify` against source and verify installed copies as part of deployment. Remove any legacy installed `deep-dive` skill after `brain-build` is present. Quit and restart OpenCode after changing global skills or `~/.config/opencode/AGENTS.md`.

Install all repository skills for all supported agents only when that is intentional:

```sh
npx skills add . --global --all
```

The universal global store is normally `~/.agents/skills/`. Treat installed copies as generated deployments; edit this repository instead.

## Brain Operations

Run the read-only contract-v2 doctor:

```sh
npm run brain:audit
npm run brain:audit -- --vault-path "/alternate/vault" --strict
```

Run the read-only pattern report:

```sh
npm run brain:patterns -- --vault-path "/absolute/vault" --strict --pretty
```

The doctor validates root routers, wikis/projects/workspaces/tools, owner tags, atomic records, cold history, workspace membership, project dependencies, global collections, graph groups, issue tags, and backlog state. The pattern reporter only discovers/ranks candidates; `brain-synthesize` performs semantic gates and controlled writes.

## Validation

```sh
npm run skills:validate:brain-suite
npm run brain:suite:verify
npm run test:brain
```

Each operator has an eval corpus under `evals/evals.json`. Joint routing tests must show all seven descriptions together because isolated trigger tests cannot detect `contextualize`/`recall`, `consolidate`/`synthesize`, or `build`/ordinary-build collisions.

## Layout

```text
skills/
  brain/                    # shared contract/config/scripts
  brain-contextualize/
  brain-recall/
  brain-remember/
  brain-consolidate/
  brain-synthesize/
  brain-build/
  attribution/
  skill-creator/
```

Every directory has a `SKILL.md` whose `name` matches the directory. Shared configuration and policy belong only to `brain`; sibling operators load the foundation rather than copying it.

## Development

- Keep skill descriptions precise and include near-miss exclusions.
- Keep scripts deterministic, bounded, and dependency-light.
- Use disposable fixture vaults for tests; never run mutating evaluations against the live vault.
- Keep evaluation workspaces outside this repository so discovery cannot find snapshot skills.
- Preserve the vendored `skill-creator/LICENSE.txt` and keep local changes small.

The `.skill` packager excludes eval directories and attribution's generated private identity config. Brain configuration is external and therefore cannot leak through skill archives.

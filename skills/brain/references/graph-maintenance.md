# Graph Maintenance

Use this procedure for every `.obsidian/graph.json` read-modify-write. Obsidian can silently overwrite disk changes from its in-memory Graph view state, so ordinary “read before write” is insufficient.

## Resolve The Palette

Read `graph.paletteNode` from `${XDG_CONFIG_HOME:-$HOME/.config}/agent-brain/config.json`. A missing/null value disables managed graph coloring. Configure a palette before registration rather than inventing an ad hoc color. `brain-consolidate` owns graph reconciliation; `brain-build` may request registration for a newly built project/workspace node.

Each palette assignment should name the exact project/workspace slug or include an explicit `Members:` list. Human-only family labels cannot be audited reliably.

Canonical managed queries are:

```text
path:projects/<slug>/
path:workspaces/<slug>/
```

The trailing slash is required. Without it, `path:projects/foo` can also match sibling folders such as `foo-api`.

Each managed project/workspace folder gets exactly one color-group object. Related nodes may share a color, but do not combine paths with `or`; Obsidian's Graph query parser does not reliably honor path OR expressions.

## Required Mutation Ceremony

1. Ask the user to save any open vault edits and close every Graph view. Explain that the postflight reload discards unsaved in-memory UI state.
2. If Obsidian is closed, keep it closed during the write. If it is open, wait for confirmation that Graph views are closed.
3. Read `.obsidian/graph.json` immediately before editing and verify that existing `colorGroups` have not disappeared.
4. Change only the intended `colorGroups` entries with a targeted edit. Preserve unrelated Graph settings and group order.
5. Parse/validate the resulting JSON and re-read it from disk.
6. If Obsidian is running, ask the user to run **Command Palette -> Reload app without saving** before opening or interacting with Graph view.
7. Do not validate by zooming, panning, opening, or toggling Graph view before that reload completes.
8. After the user confirms reload, verify the file again. UI verification may then follow if useful.

This interactive ceremony is an exception to silent background brain capture. If it cannot be completed, report graph registration as pending rather than claiming success.

## Register A Managed Node

1. Enumerate existing exact `path:<class>/<slug>/` groups.
2. If exactly one exists, verify its color against the palette note and stop if correct.
3. If none exists, select the palette-prescribed color and add one group.
4. If duplicates exist, retain the correct canonical group and remove duplicates through the mutation ceremony.
5. Verify the query matches only the intended folder. Indexed search can help, but final Graph-view verification waits until postflight reload.

For a documented hex color, compute Obsidian's integer deterministically:

```js
parseInt(hex.replace(/^#/, ""), 16)
```

Never transcribe hex and decimal independently. An audit should report mismatches.

## Reconcile The Vault

During consolidation, diff configured managed node directories against Graph color groups and report:

- missing project groups;
- stale groups with no project folder;
- duplicate groups;
- noncanonical queries missing the trailing slash;
- multi-path or malformed queries;
- palette hex/decimal mismatches;
- prefix-shadowing queries that match sibling projects.

Add missing groups from the palette. Remove a stale group when the related project merge/deletion is already confirmed, or surface it as a configuration deletion for confirmation.

Run the bundled read-only doctor when available:

```sh
npx tsx <brain-foundation-directory>/scripts/audit-vault.ts --vault-path "<brain-vault-path>"
```

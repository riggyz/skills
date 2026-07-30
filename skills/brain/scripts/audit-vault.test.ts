import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  auditVault,
  hexToRgbInteger,
  normalizeProjectSlug,
  resolveGraphPaletteNote,
} from "./audit-vault.js";

const today = new Date().toISOString().slice(0, 10);

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${content.trim()}\n`, "utf8");
}

function createCleanVault(): string {
  const vault = mkdtempSync(join(tmpdir(), "brain-audit-clean-"));
  write(
    join(vault, "index.md"),
    `---
created: ${today}
updated: ${today}
---

# Index

## People
- [[person-user]]

## Tools

## Decisions

## Preferences

## Code style

## Gotchas

## Projects

### Active
- [[projects/example/_example|example]]

### Dormant

### Archived

#index`,
  );
  write(
    join(vault, "person-user.md"),
    `---
created: ${today}
updated: ${today}
---

# User

#person`,
  );
  write(
    join(vault, "projects/example/_example.md"),
    `---
created: ${today}
updated: ${today}
kind: app
stack: [typescript]
status: active
depends_on: []
used_by: []
---

# example

## Purpose
Test fixture. Inline code such as \`#292/PR\` is safe.

## Companion notes and references

#project/example`,
  );
  write(
    join(vault, ".obsidian/graph.json"),
    JSON.stringify(
      {
        colorGroups: [
          { query: "path:projects/example/", color: { a: 1, rgb: 0x112233 } },
        ],
      },
      null,
      2,
    ),
  );
  return vault;
}

test("normalizes project slugs and converts colors", () => {
  assert.equal(normalizeProjectSlug("MyProject.API"), "my-project-api");
  assert.equal(normalizeProjectSlug("api_server"), "api-server");
  assert.equal(hexToRgbInteger("#112233"), 0x112233);
  assert.throws(() => hexToRgbInteger("#123"));
});

test("palette resolution separates configured, disabled, legacy, and alternate vaults", () => {
  const vault = createCleanVault();
  try {
    write(join(vault, "tool-vault-graph.md"), "# Palette");
    assert.equal(
      resolveGraphPaletteNote(
        vault,
        "Graph palette note: `custom-palette.md`",
        false,
      ),
      "custom-palette.md",
    );
    assert.equal(
      resolveGraphPaletteNote(
        vault,
        "Graph palette note: _(not configured)_",
        false,
      ),
      undefined,
    );
    assert.equal(resolveGraphPaletteNote(vault, "", false), "tool-vault-graph.md");
    assert.equal(
      resolveGraphPaletteNote(
        vault,
        "Graph palette note: `wrong-vault.md`",
        true,
      ),
      "tool-vault-graph.md",
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("clean fixture passes", () => {
  const vault = createCleanVault();
  try {
    assert.deepEqual(auditVault(vault), []);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("root typed links must target the root note exactly", () => {
  const vault = createCleanVault();
  try {
    const indexPath = join(vault, "index.md");
    writeFileSync(
      indexPath,
      readFileSync(indexPath, "utf8").replace(
        "[[person-user]]",
        "[[archive/person-user]]",
      ),
      "utf8",
    );
    assert.ok(
      auditVault(vault).some(
        (finding) =>
          finding.code === "typed-index-missing" &&
          finding.path === "person-user.md",
      ),
    );
    assert.ok(
      auditVault(vault).some(
        (finding) => finding.code === "typed-index-stale",
      ),
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("an extra malformed root link is reported even beside the valid link", () => {
  const vault = createCleanVault();
  try {
    const indexPath = join(vault, "index.md");
    writeFileSync(
      indexPath,
      readFileSync(indexPath, "utf8").replace(
        "- [[person-user]]",
        "- [[person-user]]\n- [[archive/person-user]]",
      ),
      "utf8",
    );
    assert.ok(
      auditVault(vault).some(
        (finding) =>
          finding.code === "typed-index-stale" &&
          finding.message.includes("archive/person-user"),
      ),
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("configured graph groups require exact palette assignments", () => {
  const vault = createCleanVault();
  try {
    write(
      join(vault, "tool-vault-graph.md"),
      `---
created: ${today}
updated: ${today}
---

- Unmapped app family - #112233 (rgb 1122867)

#tool`,
    );
    const codes = new Set(
      auditVault(vault, { graphPaletteNote: "tool-vault-graph.md" }).map(
        (finding) => finding.code,
      ),
    );
    assert.ok(codes.has("palette-color-unmapped"));
    assert.ok(codes.has("missing-palette-assignment"));
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("reports index, tag, graph, palette, and relationship drift", () => {
  const vault = mkdtempSync(join(tmpdir(), "brain-audit-dirty-"));
  try {
    write(
      join(vault, "index.md"),
      `# Index

## People

## Tools

## Decisions

## Preferences

## Code style

## Gotchas
- [[gotcha-example]]
- [[gotcha-example]]

## Projects

### Active
- [[_foo]] - stale summary
- [[_ghost]]

### Dormant

### Archived`,
    );
    write(join(vault, "gotcha-example.md"), "# Gotcha\n\n#gotcha");
    write(join(vault, "gotcha-missing.md"), "# Missing gotcha\n\n#gotcha");
    write(
      join(vault, "projects/foo/_foo.md"),
      `---
created: ${today}
updated: ${today}
status: active
depends_on: [ # verified dependency list
  # shared API dependency
  foo-api,
] # verified dependencies
used_by: []
---

# foo

[[notes]]`,
    );
    write(
      join(vault, "projects/foo/notes.md"),
      `---
created: ${today}
updated: ${today}
---

Issue #292/PR caused this.

#project/foo`,
    );
    write(
      join(vault, "projects/foo-api/_foo-api.md"),
      `---
created: ${today}
updated: ${today}
status: active
depends_on: []
used_by: []
---

# foo-api

#project/foo-api`,
    );
    write(
      join(vault, "projects/foo-api/notes.md"),
      `---
created: ${today}
updated: ${today}
---

Other notes.

#project/foo-api`,
    );
    write(
      join(vault, ".obsidian/graph.json"),
      JSON.stringify(
        {
          colorGroups: [
            { query: "path:projects/foo", color: { rgb: 1 } },
            { query: "path:projects/stale/", color: { rgb: 2 } },
          ],
        },
        null,
        2,
      ),
    );
    write(
      join(vault, "tool-vault-graph.md"),
      `---
created: ${today}
updated: ${today}
---

- foo - color #112233 (rgb 1)

#tool`,
    );

    const findings = auditVault(vault, {
      graphPaletteNote: "tool-vault-graph.md",
    });
    const codes = new Set(findings.map((finding) => finding.code));
    for (const expected of [
      "typed-index-missing",
      "typed-index-duplicate",
      "project-index-noncanonical",
      "project-index-missing",
      "project-index-stale",
      "index-project-summary",
      "missing-project-tag",
      "unlinked-companion",
      "phantom-issue-tag",
      "graph-query-missing-slash",
      "graph-query-prefix-shadow",
      "missing-graph-group",
      "stale-graph-group",
      "palette-rgb-mismatch",
      "graph-color-mismatch",
      "relationship-not-reciprocal",
    ]) {
      assert.ok(codes.has(expected), `expected ${expected}`);
    }
    assert.ok(
      findings.some(
        (finding) =>
          finding.code === "unlinked-companion" &&
          finding.path === "projects/foo/notes.md",
      ),
      "ambiguous bare companion link should not satisfy foo/notes.md",
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

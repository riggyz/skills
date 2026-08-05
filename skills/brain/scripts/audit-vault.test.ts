import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { auditVault, hexToRgbInteger, normalizeProjectSlug, resolveGraphPaletteNote } from "./audit-vault.js";
import type { BrainConfig } from "./configure-brain.js";

const today = "2026-07-31";

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${content.trim()}\n`, "utf8");
}

function createCleanVault(): string {
  const vault = mkdtempSync(join(tmpdir(), "brain-v2-audit-"));
  const routers = ["wikis", "projects", "workspaces", "tools", "decisions", "gotchas", "codestyle", "improvements"];
  write(join(vault, "index.md"), `---\ncreated: ${today}\nupdated: ${today}\n---\n\n# Index\n\n${routers.map((router) => `- [[${router}]]`).join("\n")}\n\n#index`);
  write(join(vault, "wikis.md"), `# Wikis\n\n- [[wikis/ethan/_ethan|ethan]]\n\n#index`);
  write(join(vault, "projects.md"), `# Projects\n\n## Active\n\n- [[projects/example/_example|example]]\n\n## Dormant\n\n## Archived\n\n#index`);
  write(join(vault, "workspaces.md"), `# Workspaces\n\n## Active\n\n- [[workspaces/hub/_hub|hub]]\n\n## Dormant\n\n## Archived\n\n#index`);
  write(join(vault, "tools.md"), `# Tools\n\n- [[tools/brain/_brain|brain]]\n\n#index`);
  for (const router of ["decisions", "gotchas", "codestyle"]) write(join(vault, `${router}.md`), `# ${router}\n\n#index`);
  write(join(vault, "improvements.md"), "# Improvements\n\n- [[tools/brain/improvements|brain improvements]]\n\n#index");

  write(join(vault, "wikis/ethan/_ethan.md"), `---\ncreated: ${today}\nupdated: ${today}\nstatus: active\n---\n\n# Ethan\n\n#wiki/ethan`);
  write(join(vault, "projects/example/_example.md"), `---\ncreated: ${today}\nupdated: ${today}\nstatus: active\nworkspaces: [hub]\ndepends_on: []\nused_by: []\n---\n\n# example\n\n#project/example`);
  write(join(vault, "workspaces/hub/_hub.md"), `---\ncreated: ${today}\nupdated: ${today}\nstatus: active\nmembers: [example]\n---\n\n# hub\n\n#workspace/hub`);
  write(join(vault, "tools/brain/_brain.md"), `---\ncreated: ${today}\nupdated: ${today}\nstatus: active\n---\n\n# brain\n\n## Companion notes and references\n\n- [[tools/brain/improvements|Improvements]]\n\n#tool/brain`);
  write(join(vault, "tools/brain/improvements.md"), `---\ncreated: ${today}\nupdated: ${today}\n---\n\n# Improvements\n\n## Open\n\n## Fixed (recent)\n\n#tool/brain #improvement`);
  return vault;
}

test("normalizes slugs and converts colors", () => {
  assert.equal(normalizeProjectSlug("MyProject.API"), "my-project-api");
  assert.equal(hexToRgbInteger("#112233"), 0x112233);
});

test("clean v2 fixture passes and audit is read-only", () => {
  const vault = createCleanVault();
  try {
    const path = join(vault, "index.md");
    const before = readFileSync(path, "utf8");
    const mtime = statSync(path).mtimeMs;
    assert.deepEqual(auditVault(vault), []);
    assert.equal(readFileSync(path, "utf8"), before);
    assert.equal(statSync(path).mtimeMs, mtime);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("reports root, node, tag, router, and membership drift", () => {
  const vault = createCleanVault();
  try {
    write(join(vault, "person-legacy.md"), "# Legacy\n\n#person");
    writeFileSync(join(vault, "projects.md"), "# Projects\n\n#index\n", "utf8");
    writeFileSync(join(vault, "projects/example/_example.md"), readFileSync(join(vault, "projects/example/_example.md"), "utf8").replace("#project/example", "#wrong"), "utf8");
    writeFileSync(join(vault, "workspaces/hub/_hub.md"), readFileSync(join(vault, "workspaces/hub/_hub.md"), "utf8").replace("members: [example]", "members: []"), "utf8");
    const codes = new Set(auditVault(vault).map((finding) => finding.code));
    assert.ok(codes.has("legacy-root-note"));
    assert.ok(codes.has("node-router-missing"));
    assert.ok(codes.has("missing-owner-tag"));
    assert.ok(codes.has("workspace-membership-not-reciprocal"));
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("nested records require a collection router and link", () => {
  const vault = createCleanVault();
  try {
    write(join(vault, "projects/example/gotchas/cache.md"), `---\nkind: gotcha\nowner: project/example\n---\n\n# Cache\n\n#project/example #gotcha`);
    const codes = new Set(auditVault(vault).map((finding) => finding.code));
    assert.ok(codes.has("missing-record-router"));
    write(join(vault, "projects/example/gotchas.md"), "# Gotchas\n\n- [[projects/example/gotchas/cache|cache]]\n\n#project/example");
    writeFileSync(join(vault, "projects/example/_example.md"), readFileSync(join(vault, "projects/example/_example.md"), "utf8").replace("\n#project/example", "\n\n- [[projects/example/gotchas|Gotchas]]\n\n#project/example"), "utf8");
    assert.equal(auditVault(vault).some((finding) => finding.code === "missing-record-router"), false);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("configured graph checks projects and workspaces", () => {
  const vault = createCleanVault();
  try {
    write(join(vault, "tools/vault-graph/_vault-graph.md"), `- example #112233 rgb 1122867\n- hub #445566 rgb 4478310\n\n#tool/vault-graph`);
    write(join(vault, ".obsidian/graph.json"), JSON.stringify({ colorGroups: [
      { query: "path:projects/example", color: { rgb: 1 } },
      { query: "path:workspaces/hub/", color: { rgb: 4478310 } }
    ] }, null, 2));
    const codes = new Set(auditVault(vault, { graphPaletteNote: "tools/vault-graph/_vault-graph.md" }).map((finding) => finding.code));
    assert.ok(codes.has("graph-query-missing-slash"));
    assert.ok(codes.has("graph-color-mismatch"));
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("palette resolution uses config unless an alternate vault is explicit", () => {
  const vault = createCleanVault();
  try {
    write(join(vault, "tools/vault-graph/_vault-graph.md"), "# Palette\n");
    const config = {
      contractVersion: 2,
      vault: { name: "brain", path: vault },
      startup: { primaryContext: "wikis/ethan/_ethan.md" },
      graph: { paletteNode: "custom.md" },
      synthesis: { mode: "automatic-high-confidence" },
    } satisfies BrainConfig;
    assert.equal(resolveGraphPaletteNote(vault, config, false), "custom.md");
    assert.equal(resolveGraphPaletteNote(vault, config, true), "tools/vault-graph/_vault-graph.md");
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

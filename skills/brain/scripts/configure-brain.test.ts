import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { renderBrainConfig, resolveBrainConfig } from "./configure-brain.js";

function vaultFixture(): string {
  const vault = mkdtempSync(join(tmpdir(), "brain-config-"));
  writeFileSync(join(vault, "index.md"), "# Index\n", "utf8");
  return vault;
}

test("detects a sole person note and graph palette", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    writeFileSync(join(vault, "tool-vault-graph.md"), "# Palette\n", "utf8");
    const config = resolveBrainConfig("brain", vault);
    assert.equal(config.primaryUserNote, "person-ethan.md");
    assert.equal(config.graphPaletteNote, "tool-vault-graph.md");
    assert.match(renderBrainConfig(config), /Primary user note: `person-ethan\.md`/);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("requires explicit selection when multiple person notes exist", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-user.md"), "# Generic user\n", "utf8");
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    assert.throws(() => resolveBrainConfig("brain", vault), /Multiple person notes/);
    assert.equal(
      resolveBrainConfig("brain", vault, "person-ethan.md").primaryUserNote,
      "person-ethan.md",
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("uses a sole canonical People link despite stale extra person notes", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-user.md"), "# Stale generic\n", "utf8");
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    writeFileSync(
      join(vault, "index.md"),
      "# Index\n\n## People\n\n- [[person-ethan]]\n\n## Projects\n",
      "utf8",
    );
    assert.equal(resolveBrainConfig("brain", vault).primaryUserNote, "person-ethan.md");
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("rejects uninitialized vaults and missing explicit notes", () => {
  const empty = mkdtempSync(join(tmpdir(), "brain-config-empty-"));
  try {
    assert.throws(() => resolveBrainConfig("brain", empty), /index\.md is missing/);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }

  const vault = vaultFixture();
  try {
    assert.throws(
      () => resolveBrainConfig("brain", vault, "person-missing.md"),
      /does not exist/,
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

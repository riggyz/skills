import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  defaultBrainConfigPath,
  parseBrainConfig,
  renderBrainConfig,
  resolveBrainConfig,
} from "./configure-brain.js";

function vaultFixture(): string {
  const vault = mkdtempSync(join(tmpdir(), "brain-config-"));
  writeFileSync(join(vault, "index.md"), "# Index\n", "utf8");
  return vault;
}

test("detects legacy primary context and palette", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    writeFileSync(join(vault, "tool-vault-graph.md"), "# Palette\n", "utf8");
    const config = resolveBrainConfig("brain", vault);
    assert.equal(config.contractVersion, 2);
    assert.equal(config.startup.primaryContext, "person-ethan.md");
    assert.equal(config.graph.paletteNode, "tool-vault-graph.md");
    assert.deepEqual(parseBrainConfig(renderBrainConfig(config)), config);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("supports explicit nested v2 context and palette paths", () => {
  const vault = vaultFixture();
  try {
    mkdirSync(join(vault, "wikis/ethan"), { recursive: true });
    mkdirSync(join(vault, "tools/vault-graph"), { recursive: true });
    writeFileSync(join(vault, "wikis/ethan/_ethan.md"), "# Ethan\n", "utf8");
    writeFileSync(join(vault, "tools/vault-graph/_vault-graph.md"), "# Palette\n", "utf8");
    const config = resolveBrainConfig(
      "brain",
      vault,
      "wikis/ethan/_ethan.md",
      "tools/vault-graph/_vault-graph.md",
    );
    assert.equal(config.startup.primaryContext, "wikis/ethan/_ethan.md");
    assert.equal(config.graph.paletteNode, "tools/vault-graph/_vault-graph.md");
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("requires explicit selection when legacy person notes are ambiguous", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-user.md"), "# Generic\n", "utf8");
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    assert.throws(() => resolveBrainConfig("brain", vault), /Multiple legacy person notes/);
    assert.equal(
      resolveBrainConfig("brain", vault, "person-ethan.md").startup.primaryContext,
      "person-ethan.md",
    );
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("uses one canonical legacy People link despite stale person notes", () => {
  const vault = vaultFixture();
  try {
    writeFileSync(join(vault, "person-user.md"), "# Stale\n", "utf8");
    writeFileSync(join(vault, "person-ethan.md"), "# Ethan\n", "utf8");
    writeFileSync(
      join(vault, "index.md"),
      "# Index\n\n## People\n\n- [[person-ethan]]\n\n## Projects\n",
      "utf8",
    );
    assert.equal(resolveBrainConfig("brain", vault).startup.primaryContext, "person-ethan.md");
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("rejects missing, directory, and non-Markdown explicit contexts", () => {
  const vault = vaultFixture();
  try {
    mkdirSync(join(vault, "wikis/ethan"), { recursive: true });
    writeFileSync(join(vault, "context.txt"), "not markdown\n", "utf8");
    assert.throws(() => resolveBrainConfig("brain", vault), /No primary context/);
    assert.throws(() => resolveBrainConfig("brain", vault, "missing.md"), /does not name/);
    assert.throws(() => resolveBrainConfig("brain", vault, "wikis/ethan"), /Markdown path/);
    assert.throws(() => resolveBrainConfig("brain", vault, "context.txt"), /Markdown path/);
  } finally {
    rmSync(vault, { recursive: true, force: true });
  }
});

test("uses the XDG config home when present", () => {
  assert.equal(
    defaultBrainConfigPath({ XDG_CONFIG_HOME: "/tmp/config-home" }, "/home/user"),
    "/tmp/config-home/agent-brain/config.json",
  );
  assert.equal(
    defaultBrainConfigPath({}, "/home/user"),
    "/home/user/.config/agent-brain/config.json",
  );
});

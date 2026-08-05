#!/usr/bin/env -S npx tsx

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BRAIN_CONTRACT_VERSION = 2 as const;

export interface BrainConfig {
  contractVersion: typeof BRAIN_CONTRACT_VERSION;
  vault: {
    name: string;
    path: string;
  };
  startup: {
    primaryContext: string;
  };
  graph: {
    paletteNode: string | null;
  };
  synthesis: {
    mode: "automatic-high-confidence";
  };
}

function valueFor(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function usage(): void {
  console.error(
    'Usage: configure-brain.ts --vault-name "name" --vault-path "/absolute/vault" [--primary-context "wikis/user/_user.md"] [--graph-palette-node "tools/vault-graph/_vault-graph.md"] [--config-path "/absolute/config.json"]',
  );
}

export function defaultBrainConfigPath(
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir(),
): string {
  const configHome = env.XDG_CONFIG_HOME?.trim() || join(home, ".config");
  return join(configHome, "agent-brain", "config.json");
}

function validateRelativeMarkdown(value: string, flag: string): string {
  if (
    !value ||
    isAbsolute(value) ||
    value.split(/[\\/]/).includes("..") ||
    !value.toLowerCase().endsWith(".md")
  ) {
    throw new Error(`${flag} must be a vault-relative Markdown path without '..' segments`);
  }
  return value.replaceAll("\\", "/");
}

function requireExistingMarkdown(vaultPath: string, value: string, flag: string): string {
  const validated = validateRelativeMarkdown(value, flag);
  const absolute = join(vaultPath, validated);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new Error(`${flag} does not name a Markdown file in the vault: ${validated}`);
  }
  return validated;
}

export function detectPrimaryContext(vaultPath: string): string | undefined {
  const canonical = "wikis/ethan/_ethan.md";
  if (existsSync(join(vaultPath, canonical))) return canonical;

  const candidates = readdirSync(vaultPath)
    .filter((name) => /^person-.*\.md$/.test(name))
    .sort();
  const index = readFileSync(join(vaultPath, "index.md"), "utf8");
  const lines = index.split(/\r?\n/);
  const peopleStart = lines.findIndex((line) => line.trim() === "## People");
  if (peopleStart !== -1) {
    const peopleEnd = lines.findIndex(
      (line, lineIndex) => lineIndex > peopleStart && /^##\s+/.test(line.trim()),
    );
    const section = lines.slice(peopleStart + 1, peopleEnd === -1 ? undefined : peopleEnd).join("\n");
    const indexed = [...section.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g)]
      .map((match) => match[1])
      .filter((target) => !target.includes("/") && candidates.includes(`${target}.md`));
    if (new Set(indexed).size === 1) return `${indexed[0]}.md`;
  }
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    throw new Error(
      `Multiple legacy person notes found; pass --primary-context with one of: ${candidates.join(", ")}`,
    );
  }
  return undefined;
}

function detectGraphPaletteNode(vaultPath: string): string | undefined {
  for (const candidate of [
    "tools/vault-graph/_vault-graph.md",
    "tool-vault-graph.md",
  ]) {
    if (existsSync(join(vaultPath, candidate))) return candidate;
  }
  return undefined;
}

export function resolveBrainConfig(
  vaultName: string,
  vaultPath: string,
  requestedPrimaryContext?: string,
  requestedGraphPaletteNode?: string,
): BrainConfig {
  if (!vaultName.trim()) throw new Error("--vault-name must not be empty");
  if (!isAbsolute(vaultPath)) throw new Error("--vault-path must be absolute");
  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    throw new Error(`Vault path is not an existing directory: ${vaultPath}`);
  }
  if (!existsSync(join(vaultPath, "index.md"))) {
    throw new Error(`Vault is not initialized; index.md is missing from ${vaultPath}`);
  }

  const detectedPrimary = requestedPrimaryContext
    ? requireExistingMarkdown(vaultPath, requestedPrimaryContext, "--primary-context")
    : detectPrimaryContext(vaultPath);
  if (!detectedPrimary) {
    throw new Error("No primary context detected; pass --primary-context with a vault-relative Markdown path");
  }
  const paletteNode = requestedGraphPaletteNode
    ? requireExistingMarkdown(vaultPath, requestedGraphPaletteNode, "--graph-palette-node")
    : detectGraphPaletteNode(vaultPath);

  return {
    contractVersion: BRAIN_CONTRACT_VERSION,
    vault: { name: vaultName.trim(), path: resolve(vaultPath) },
    startup: { primaryContext: detectedPrimary },
    graph: { paletteNode: paletteNode ?? null },
    synthesis: { mode: "automatic-high-confidence" },
  };
}

export function renderBrainConfig(config: BrainConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export function parseBrainConfig(raw: string): BrainConfig {
  const value = JSON.parse(raw) as Partial<BrainConfig>;
  if (
    value.contractVersion !== BRAIN_CONTRACT_VERSION ||
    !value.vault?.name ||
    !isAbsolute(value.vault.path ?? "") ||
    !value.startup?.primaryContext
  ) {
    throw new Error("Invalid or incompatible brain config; rerun configure:brain for contract v2");
  }
  return value as BrainConfig;
}

export function readBrainConfig(configPath = defaultBrainConfigPath()): BrainConfig {
  if (!existsSync(configPath)) throw new Error(`Brain config is missing: ${configPath}`);
  return parseBrainConfig(readFileSync(configPath, "utf8"));
}

function main(): void {
  const args = process.argv.slice(2);
  const vaultName = valueFor(args, "--vault-name");
  const vaultPath = valueFor(args, "--vault-path");
  if (!vaultName || !vaultPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  try {
    const primaryContext = valueFor(args, "--primary-context") ?? valueFor(args, "--primary-user-note");
    const paletteNode = valueFor(args, "--graph-palette-node") ?? valueFor(args, "--graph-palette-note");
    const config = resolveBrainConfig(vaultName, vaultPath, primaryContext, paletteNode);
    const configPath = resolve(valueFor(args, "--config-path") ?? defaultBrainConfigPath());
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, renderBrainConfig(config), "utf8");
    console.log(`Wrote ${configPath}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) main();

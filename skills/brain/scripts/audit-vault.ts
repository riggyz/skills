#!/usr/bin/env -S npx tsx

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readBrainConfig, type BrainConfig } from "./configure-brain.js";
import {
  NODE_CLASSES,
  ROOT_ROUTERS,
  type NodeClass,
  escapeRegex,
  expectedEntryPath,
  finalNonEmptyLine,
  frontmatterList,
  frontmatterValue,
  markdownFiles,
  markdownSection,
  normalizeSlug,
  ownerTag,
  relativeVaultPath,
  wikilinkTargets,
} from "./vault-model.js";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditFinding {
  severity: AuditSeverity;
  code: string;
  path: string;
  message: string;
}

export interface AuditOptions {
  graphPaletteNote?: string;
  managedGraphClasses?: Array<"projects" | "workspaces">;
}

interface NodeMetadata {
  nodeClass: NodeClass;
  slug: string;
  entryPath: string;
  status: string;
  dependsOn: string[];
  usedBy: string[];
  workspaces: string[];
  members: string[];
}

const severityOrder: Record<AuditSeverity, number> = { error: 0, warning: 1, info: 2 };

export const normalizeProjectSlug = normalizeSlug;

export function hexToRgbInteger(hex: string): number {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) throw new Error(`Invalid six-digit hex color: ${hex}`);
  return Number.parseInt(normalized, 16);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function add(
  findings: AuditFinding[],
  severity: AuditSeverity,
  code: string,
  path: string,
  message: string,
): void {
  findings.push({ severity, code, path, message });
}

function normalizeReference(value: string): string {
  return normalizeSlug(value.split("/").at(-1)?.replace(/^_/, "") ?? value);
}

function hasOwnerTag(markdown: string, owner: string, excalidraw: boolean): boolean {
  const tag = ownerTag(owner);
  if (!tag) return true;
  const pattern = new RegExp(`(?:^|\\s)${escapeRegex(tag)}(?:\\s|$)`);
  if (excalidraw) return pattern.test(markdown);
  return pattern.test(finalNonEmptyLine(markdown) ?? "");
}

function auditIssueTags(findings: AuditFinding[], path: string, markdown: string): void {
  const prose = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\r\n]*`/g, "");
  const matches = [...prose.matchAll(/#\d+\/(?:#?[A-Za-z0-9_-]+)/g)].map((match) => match[0]);
  if (matches.length > 0) {
    add(findings, "warning", "phantom-issue-tag", path, `Slash-adjacent issue references may become tags: ${[...new Set(matches)].join(", ")}`);
  }
}

function routerTargets(markdown: string): string[] {
  return wikilinkTargets(markdown).map((target) => target.replace(/\.md$/, ""));
}

function targetCount(targets: string[], expected: string): number {
  const normalized = expected.replace(/\.md$/, "");
  return targets.filter((target) => target === normalized).length;
}

function listNodeDirectories(vaultPath: string, nodeClass: NodeClass): string[] {
  const root = join(vaultPath, nodeClass);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function auditNode(
  findings: AuditFinding[],
  vaultPath: string,
  nodeClass: NodeClass,
  slug: string,
  classRouterTargets: string[],
): NodeMetadata | undefined {
  const owner = `${nodeClass.slice(0, -1)}/${slug}`;
  const directory = join(vaultPath, nodeClass, slug);
  const entryRelative = expectedEntryPath(nodeClass, slug);
  const entryPath = join(vaultPath, entryRelative);
  if (!existsSync(entryPath)) {
    add(findings, "error", "missing-node-entry", `${nodeClass}/${slug}`, `Expected _${slug}.md`);
    return undefined;
  }

  const entry = read(entryPath);
  const expectedTarget = entryRelative.replace(/\.md$/, "");
  const links = targetCount(classRouterTargets, expectedTarget);
  if (links === 0) add(findings, "error", "node-router-missing", `${nodeClass}.md`, `${expectedTarget} is not registered`);
  if (links > 1) add(findings, "warning", "node-router-duplicate", `${nodeClass}.md`, `${expectedTarget} is linked ${links} times`);
  if (entry.split(/\r?\n/).length > 250 || Buffer.byteLength(entry) > 25 * 1024) {
    add(findings, "warning", "oversized-node-entry", entryRelative, "Node entry exceeds the 250-line or 25-KiB orientation budget");
  }

  const entryTargets = routerTargets(entry);
  const files = markdownFiles(directory);
  for (const path of files) {
    const relative = relativeVaultPath(vaultPath, path);
    const markdown = read(path);
    const local = relative.split("/").slice(2);
    const excalidraw = path.endsWith(".excalidraw.md");
    if (!hasOwnerTag(markdown, owner, excalidraw)) {
      add(findings, "warning", "missing-owner-tag", relative, `Expected final owner tag ${ownerTag(owner)}`);
    }
    if (local.length > 2) add(findings, "error", "record-nesting-too-deep", relative, "Records may not nest below one collection level");

    if (relative !== entryRelative) {
      if (local.length === 1) {
        const expected = relative.replace(/\.md$/, "");
        if (!entryTargets.includes(expected)) add(findings, "warning", "unlinked-companion", relative, "Immediate companion is not linked from the node entry");
      } else if (local.length === 2) {
        const collection = local[0];
        const collectionRouter = `${nodeClass}/${slug}/${collection}.md`;
        const collectionPath = join(vaultPath, collectionRouter);
        if (!existsSync(collectionPath)) {
          add(findings, "error", "missing-record-router", relative, `Expected ${collectionRouter}`);
        } else {
          const expected = relative.replace(/\.md$/, "");
          if (!routerTargets(read(collectionPath)).includes(expected)) {
            add(findings, "warning", "unlinked-record", relative, `Record is not linked from ${collectionRouter}`);
          }
        }
        if (collection === "history" && entryTargets.includes(relative.replace(/\.md$/, ""))) {
          add(findings, "warning", "cold-history-hot-link", entryRelative, "Entry point links a cold history leaf directly; link history.md instead");
        }
      }
    }

    if (markdown.split(/\r?\n/).length > 1000) add(findings, "warning", "oversized-note", relative, "Note exceeds 1,000 lines");
    auditIssueTags(findings, relative, markdown);
  }

  return {
    nodeClass,
    slug,
    entryPath: entryRelative,
    status: (frontmatterValue(entry, "status") ?? "active").toLowerCase(),
    dependsOn: frontmatterList(entry, "depends_on").map(normalizeReference),
    usedBy: frontmatterList(entry, "used_by").map(normalizeReference),
    workspaces: frontmatterList(entry, "workspaces").map(normalizeReference),
    members: frontmatterList(entry, "members").map(normalizeReference),
  };
}

function auditGlobalRecords(findings: AuditFinding[], vaultPath: string, collection: "decisions" | "gotchas" | "codestyle"): void {
  const directory = join(vaultPath, collection);
  if (!existsSync(directory)) return;
  const routerPath = join(vaultPath, `${collection}.md`);
  const targets = existsSync(routerPath) ? routerTargets(read(routerPath)) : [];
  const singular = collection === "codestyle" ? "codestyle" : collection.slice(0, -1);
  for (const path of markdownFiles(directory)) {
    const relative = relativeVaultPath(vaultPath, path);
    if (relative.split("/").length > 2) add(findings, "error", "global-record-nesting", relative, "Global records are one level deep");
    const expected = relative.replace(/\.md$/, "");
    if (!targets.includes(expected)) add(findings, "warning", "global-router-missing", `${collection}.md`, `${expected} is not linked`);
    const markdown = read(path);
    if (frontmatterValue(markdown, "owner") !== "global") add(findings, "warning", "global-owner-mismatch", relative, "Global record must declare owner: global");
    if (frontmatterValue(markdown, "kind") !== singular) add(findings, "warning", "global-kind-mismatch", relative, `Expected kind: ${singular}`);
    if (!(finalNonEmptyLine(markdown) ?? "").includes(`#${singular}`)) add(findings, "warning", "global-record-tag", relative, `Expected #${singular} terminal tag`);
    auditIssueTags(findings, relative, markdown);
  }
}

function auditRelationships(findings: AuditFinding[], metadata: NodeMetadata[]): void {
  const projects = new Map(metadata.filter((node) => node.nodeClass === "projects").map((node) => [node.slug, node]));
  const workspaces = new Map(metadata.filter((node) => node.nodeClass === "workspaces").map((node) => [node.slug, node]));
  for (const [slug, project] of projects) {
    for (const dependency of project.dependsOn) {
      if (projects.has(dependency) && !projects.get(dependency)?.usedBy.includes(slug)) {
        add(findings, "warning", "dependency-not-reciprocal", `projects/${dependency}/_${dependency}.md`, `${slug} depends_on ${dependency}, but used_by omits ${slug}`);
      }
    }
    for (const workspace of project.workspaces) {
      if (!workspaces.has(workspace)) add(findings, "warning", "unknown-workspace", project.entryPath, `Unknown workspace ${workspace}`);
      else if (!workspaces.get(workspace)?.members.includes(slug)) add(findings, "warning", "workspace-membership-not-reciprocal", `workspaces/${workspace}/_${workspace}.md`, `${slug}.workspaces includes ${workspace}, but members omits ${slug}`);
    }
  }
  for (const [slug, workspace] of workspaces) {
    for (const member of workspace.members) {
      if (!projects.has(member)) add(findings, "warning", "unknown-workspace-member", workspace.entryPath, `Unknown project member ${member}`);
      else if (!projects.get(member)?.workspaces.includes(slug)) add(findings, "warning", "workspace-membership-not-reciprocal", `projects/${member}/_${member}.md`, `${slug}.members includes ${member}, but workspaces omits ${slug}`);
    }
  }
}

function auditImprovementState(findings: AuditFinding[], vaultPath: string, paths: string[]): void {
  let openItems = 0;
  for (const path of paths.filter((item) => basename(item) === "improvements.md")) {
    const relative = relativeVaultPath(vaultPath, path);
    const markdown = read(path);
    openItems += markdown.match(/^- \[ \]/gm)?.length ?? 0;
    const fixedStart = markdown.split(/\r?\n/).findIndex((line) => /^## Fixed/.test(line));
    const lines = markdown.split(/\r?\n/);
    const checkedOutsideFixed = lines.some((line, index) => /^- \[[xX]\]/.test(line) && (fixedStart === -1 || index < fixedStart));
    if (checkedOutsideFixed) add(findings, "warning", "checked-improvement-outside-fixed", relative, "Checked items remain outside the Fixed section");
  }
  if (openItems > 50) add(findings, "warning", "backlog-pressure", "improvements.md", `Vault contains ${openItems} open improvement items`);
  else if (openItems > 10) add(findings, "info", "backlog-pressure", "improvements.md", `Vault contains ${openItems} open improvement items`);
}

function auditPalette(findings: AuditFinding[], vaultPath: string, palettePath: string, slugs: string[]): Map<string, number> {
  const assignments = new Map<string, number>();
  const absolute = join(vaultPath, palettePath);
  if (!existsSync(absolute)) {
    add(findings, "warning", "missing-palette-note", palettePath, "Configured graph palette node does not exist");
    return assignments;
  }
  for (const [lineIndex, line] of read(absolute).split(/\r?\n/).entries()) {
    const match = line.match(/#([0-9a-fA-F]{6}).*?\brgb\s+(\d+)\b/);
    if (!match) continue;
    const expected = hexToRgbInteger(match[1]);
    const actual = Number.parseInt(match[2], 10);
    if (expected !== actual) add(findings, "warning", "palette-rgb-mismatch", `${palettePath}:${lineIndex + 1}`, `#${match[1].toUpperCase()} converts to ${expected}, not ${actual}`);
    for (const slug of slugs) {
      if (new RegExp(`(?:^|[^a-z0-9-])${escapeRegex(slug)}(?:$|[^a-z0-9-])`, "i").test(line)) assignments.set(slug, expected);
    }
  }
  return assignments;
}

function auditGraph(
  findings: AuditFinding[],
  vaultPath: string,
  metadata: NodeMetadata[],
  palettePath: string,
  managedClasses: Array<"projects" | "workspaces">,
): void {
  const managed = metadata.filter((node) => managedClasses.includes(node.nodeClass as "projects" | "workspaces"));
  const palette = auditPalette(findings, vaultPath, palettePath, managed.map((node) => node.slug));
  const graphPath = join(vaultPath, ".obsidian", "graph.json");
  if (!existsSync(graphPath)) {
    add(findings, "warning", "missing-graph-config", ".obsidian/graph.json", "Graph palette is configured but graph.json is missing");
    return;
  }
  try {
    const graph = JSON.parse(read(graphPath)) as { colorGroups?: Array<{ query?: string; color?: { rgb?: number } }> };
    const grouped = new Map<string, Array<{ query: string; rgb?: number }>>();
    for (const group of graph.colorGroups ?? []) {
      const query = group.query ?? "";
      const match = query.match(/^path:(projects|workspaces)\/([^/\s]+)(\/?)$/);
      if (!match) continue;
      const key = `${match[1]}/${match[2]}`;
      grouped.set(key, [...(grouped.get(key) ?? []), { query, rgb: group.color?.rgb }]);
      if (!match[3]) add(findings, "warning", "graph-query-missing-slash", ".obsidian/graph.json", `${query} should end with /`);
    }
    const validKeys = new Set(managed.map((node) => `${node.nodeClass}/${node.slug}`));
    for (const node of managed) {
      const key = `${node.nodeClass}/${node.slug}`;
      const groups = grouped.get(key) ?? [];
      if (groups.length === 0) add(findings, "warning", "missing-graph-group", key, "Managed node has no graph group");
      if (groups.length > 1) add(findings, "warning", "duplicate-graph-group", ".obsidian/graph.json", `${key} has ${groups.length} graph groups`);
      const expected = palette.get(node.slug);
      if (expected === undefined) add(findings, "warning", "missing-palette-assignment", palettePath, `${node.slug} has no exact palette assignment`);
      if (expected !== undefined && groups.length === 1 && groups[0].rgb !== expected) add(findings, "warning", "graph-color-mismatch", ".obsidian/graph.json", `${groups[0].query} uses rgb ${groups[0].rgb ?? "missing"}; expected ${expected}`);
    }
    for (const key of grouped.keys()) if (!validKeys.has(key)) add(findings, "warning", "stale-graph-group", ".obsidian/graph.json", `${key} has no managed node`);
  } catch (error) {
    add(findings, "error", "invalid-graph-json", ".obsidian/graph.json", error instanceof Error ? error.message : String(error));
  }
}

export function auditVault(vaultPath: string, options: AuditOptions = {}): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    return [{ severity: "error", code: "missing-vault", path: vaultPath, message: "Vault path is not an existing directory" }];
  }

  for (const router of ROOT_ROUTERS) {
    if (!existsSync(join(vaultPath, router))) add(findings, "error", "missing-root-router", router, "Required root router is missing");
  }
  if (!existsSync(join(vaultPath, "index.md"))) return findings;

  const rootMarkdown = readdirSync(vaultPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);
  for (const file of rootMarkdown) if (!(ROOT_ROUTERS as readonly string[]).includes(file)) add(findings, "warning", "legacy-root-note", file, "Substantive/legacy root note should migrate to an owner or global collection");

  const index = read(join(vaultPath, "index.md"));
  const indexTargets = routerTargets(index);
  for (const router of ROOT_ROUTERS.slice(1)) {
    const count = targetCount(indexTargets, router);
    if (count === 0) add(findings, "error", "index-router-missing", "index.md", `${router} is not linked`);
    if (count > 1) add(findings, "warning", "index-router-duplicate", "index.md", `${router} is linked ${count} times`);
  }
  const allowedIndexTargets = new Set(ROOT_ROUTERS.slice(1).map((router) => router.replace(/\.md$/, "")));
  for (const target of indexTargets) if (!allowedIndexTargets.has(target)) add(findings, "warning", "index-non-router-link", "index.md", `Unexpected direct link ${target}`);
  if (index.split(/\r?\n/).length > 100 || Buffer.byteLength(index) > 10 * 1024) add(findings, "warning", "oversized-index", "index.md", "Index exceeds the 100-line or 10-KiB control-plane budget");

  const metadata: NodeMetadata[] = [];
  for (const nodeClass of NODE_CLASSES) {
    const routerPath = join(vaultPath, `${nodeClass}.md`);
    const targets = existsSync(routerPath) ? routerTargets(read(routerPath)) : [];
    for (const slug of listNodeDirectories(vaultPath, nodeClass)) {
      const node = auditNode(findings, vaultPath, nodeClass, slug, targets);
      if (node) metadata.push(node);
    }
    for (const target of targets) {
      const match = target.match(new RegExp(`^${nodeClass}/([^/]+)/_([^/]+)$`));
      if (!match || match[1] !== match[2] || !existsSync(join(vaultPath, `${target}.md`))) add(findings, "warning", "stale-node-router-link", `${nodeClass}.md`, `Noncanonical or missing node target ${target}`);
    }
  }

  auditRelationships(findings, metadata);
  for (const collection of ["decisions", "gotchas", "codestyle"] as const) auditGlobalRecords(findings, vaultPath, collection);
  const files = markdownFiles(vaultPath);
  auditImprovementState(findings, vaultPath, files);
  for (const path of files.filter((item) => item.split("/").length === 1)) auditIssueTags(findings, relativeVaultPath(vaultPath, path), read(path));

  if (options.graphPaletteNote) auditGraph(findings, vaultPath, metadata, options.graphPaletteNote, options.managedGraphClasses ?? ["projects", "workspaces"]);

  return findings.sort((left, right) =>
    severityOrder[left.severity] - severityOrder[right.severity] ||
    left.code.localeCompare(right.code) ||
    left.path.localeCompare(right.path),
  );
}

export function resolveGraphPaletteNote(
  vaultPath: string,
  config: BrainConfig | undefined,
  explicitVaultPath: boolean,
  requestedGraphPaletteNote?: string,
): string | undefined {
  if (requestedGraphPaletteNote) return requestedGraphPaletteNote;
  if (!explicitVaultPath && config?.graph.paletteNode) return config.graph.paletteNode;
  for (const candidate of ["tools/vault-graph/_vault-graph.md", "tool-vault-graph.md"]) {
    if (existsSync(join(vaultPath, candidate))) return candidate;
  }
  return undefined;
}

function main(): void {
  const args = process.argv.slice(2);
  const valueFor = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  if (args.includes("--help")) {
    console.log("Usage: audit-vault.ts [--vault-path /absolute/path] [--graph-palette-note note.md] [--json] [--strict]");
    return;
  }
  let config: BrainConfig | undefined;
  try {
    config = readBrainConfig();
  } catch {
    config = undefined;
  }
  const requestedVaultPath = valueFor("--vault-path");
  const vaultPath = requestedVaultPath ?? config?.vault.path;
  if (!vaultPath) {
    console.error("No vault path supplied and contract-v2 brain config is missing");
    process.exitCode = 2;
    return;
  }
  const resolvedVault = resolve(vaultPath);
  const graphPaletteNote = resolveGraphPaletteNote(resolvedVault, config, requestedVaultPath !== undefined, valueFor("--graph-palette-note"));
  const findings = auditVault(resolvedVault, { graphPaletteNote });
  if (args.includes("--json")) console.log(JSON.stringify({ vaultPath: resolvedVault, findings }, null, 2));
  else if (findings.length === 0) console.log("Vault audit passed with no findings.");
  else {
    for (const finding of findings) console.log(`${finding.severity.toUpperCase()} ${finding.code} ${finding.path}: ${finding.message}`);
    const errors = findings.filter((finding) => finding.severity === "error").length;
    const warnings = findings.filter((finding) => finding.severity === "warning").length;
    const info = findings.filter((finding) => finding.severity === "info").length;
    console.log(`\n${errors} error(s), ${warnings} warning(s), ${info} info finding(s)`);
  }
  if (findings.some((finding) => finding.severity === "error") || (args.includes("--strict") && findings.some((finding) => finding.severity === "warning"))) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) main();

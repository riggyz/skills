#!/usr/bin/env -S npx tsx

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditFinding {
  severity: AuditSeverity;
  code: string;
  path: string;
  message: string;
}

export interface AuditOptions {
  graphPaletteNote?: string;
}

const typedSections = [
  ["person-", "People"],
  ["tool-", "Tools"],
  ["decision-", "Decisions"],
  ["pref-", "Preferences"],
  ["codestyle-", "Code style"],
  ["gotcha-", "Gotchas"],
] as const;

const severityOrder: Record<AuditSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function normalizeProjectSlug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hexToRgbInteger(hex: string): number {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid six-digit hex color: ${hex}`);
  }
  return Number.parseInt(normalized, 16);
}

function markdownFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === ".obsidian") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function frontmatterBody(markdown: string): string | undefined {
  return markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
}

function frontmatterValue(markdown: string, field: string): string | undefined {
  const body = frontmatterBody(markdown);
  if (!body) return undefined;
  return body.match(new RegExp(`^${field}:\\s*(.*?)\\s*$`, "m"))?.[1];
}

function listFrontmatterValue(markdown: string, field: string): string[] {
  const body = frontmatterBody(markdown);
  if (!body) return [];
  const lines = body.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${field}:`));
  if (index === -1) return [];

  const rawInline = lines[index].slice(field.length + 1).trim();
  const inline = rawInline.startsWith("#")
    ? ""
    : rawInline.replace(/\s+#.*$/, "").trim();
  let values: string[] = [];
  if (inline.startsWith("[")) {
    let flow = inline;
    let cursor = index + 1;
    while (!/\]\s*(?:#.*)?$/.test(flow) && cursor < lines.length) {
      const next = lines[cursor].trim();
      if (next && !next.startsWith("#")) flow += ` ${next}`;
      cursor += 1;
    }
    const closingBracket = flow.lastIndexOf("]");
    if (closingBracket !== -1) values = flow.slice(1, closingBracket).split(",");
  } else if (!inline) {
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = line.match(/^\s+-\s+(.+)$/);
      if (match) {
        values.push(match[1]);
        continue;
      }
      break;
    }
  } else {
    values = [inline];
  }

  return values
    .map((value) =>
      value
        .trim()
        .replace(/\s+#.*$/, "")
        .replace(/^['"]|['"]$/g, "")
        .replace(/^\[\[/, "")
        .replace(/\]\]$/, "")
        .split("|")[0]
        .split("/")
        .at(-1)
        ?.replace(/^_/, "") ?? "",
    )
    .map(normalizeProjectSlug)
    .filter(Boolean);
}

function section(markdown: string, heading: string, level: 2 | 3): string {
  const marker = `${"#".repeat(level)} ${heading}`;
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) return "";
  const end = lines.findIndex(
    (line, index) =>
      index > start && new RegExp(`^#{1,${level}}\\s+`).test(line.trim()),
  );
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n");
}

function wikilinkTargets(markdown: string): string[] {
  const targets: string[] = [];
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;
  for (const match of markdown.matchAll(pattern)) {
    targets.push(match[1].replace(/\.md$/, ""));
  }
  return targets;
}

function projectBulletTargets(markdown: string): string[] {
  const targets: string[] = [];
  const pattern = /^\s*-\s+\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/gm;
  for (const match of markdown.matchAll(pattern)) {
    targets.push(match[1].replace(/\.md$/, ""));
  }
  return targets;
}

function relativePath(vaultPath: string, path: string): string {
  return relative(vaultPath, path).replaceAll("\\", "/");
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

function targetMatchesFile(target: string, fileName: string): boolean {
  const targetName = target.split("/").at(-1);
  return targetName === fileName.replace(/\.md$/, "");
}

function targetMatchesRootFile(target: string, fileName: string): boolean {
  return !target.includes("/") && target === fileName.replace(/\.md$/, "");
}

function targetMatchesProjectFile(
  target: string,
  slug: string,
  fileName: string,
  basenameCounts: Map<string, number>,
): boolean {
  const normalized = target.replace(/\.md$/, "");
  const fileBase = fileName.replace(/\.md$/, "");
  if (!normalized.includes("/")) {
    return normalized === fileBase && basenameCounts.get(fileName) === 1;
  }
  return normalized === `projects/${slug}/${fileBase}`;
}

function hasProjectTag(markdown: string, slug: string, excalidraw: boolean): boolean {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = new RegExp(`(?:^|\\s)#project/${escaped}(?:\\s|$)`);
  if (excalidraw) {
    const yamlTag = new RegExp(`(?:^|[\\s,\\[])project/${escaped}(?:[\\s,\\]]|$)`);
    return tag.test(markdown) || yamlTag.test(frontmatterBody(markdown) ?? "");
  }
  const finalLine = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  return finalLine ? tag.test(finalLine) : false;
}

function auditIssueTags(
  findings: AuditFinding[],
  vaultPath: string,
  path: string,
  markdown: string,
): void {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\r\n]*`/g, "");
  const matches = [...prose.matchAll(/#\d+\/(?:#?[A-Za-z0-9_-]+)/g)].map(
    (match) => match[0],
  );
  if (matches.length > 0) {
    add(
      findings,
      "warning",
      "phantom-issue-tag",
      relativePath(vaultPath, path),
      `Slash-adjacent issue references may become nested tags: ${[...new Set(matches)].join(", ")}`,
    );
  }
}

function auditPalette(
  findings: AuditFinding[],
  vaultPath: string,
  palettePath: string | undefined,
  projectSlugs: string[],
): Map<string, number> {
  const assignments = new Map<string, number>();
  if (!palettePath) return assignments;
  const absolute = join(vaultPath, palettePath);
  if (!existsSync(absolute)) {
    add(findings, "warning", "missing-palette-note", palettePath, "Configured graph palette note does not exist");
    return assignments;
  }

  const markdown = read(absolute);
  for (const [lineIndex, line] of markdown.split(/\r?\n/).entries()) {
    const match = line.match(/#([0-9a-fA-F]{6}).*?\brgb\s+(\d+)\b/);
    if (!match) continue;
    const expected = hexToRgbInteger(match[1]);
    const actual = Number.parseInt(match[2], 10);
    if (expected !== actual) {
      add(
        findings,
        "warning",
        "palette-rgb-mismatch",
        `${palettePath}:${lineIndex + 1}`,
        `#${match[1].toUpperCase()} converts to ${expected}, not ${actual}`,
      );
    }
    let mapped = false;
    for (const slug of projectSlugs) {
      const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|[^a-z0-9-])${escaped}(?:$|[^a-z0-9-])`, "i").test(line)) {
        assignments.set(slug, expected);
        mapped = true;
      }
    }
    if (!mapped) {
      add(
        findings,
        "warning",
        "palette-color-unmapped",
        `${palettePath}:${lineIndex + 1}`,
        "Palette color does not name an exact project slug; add a slug or Members: list",
      );
    }
  }
  return assignments;
}

export function auditVault(
  vaultPath: string,
  options: AuditOptions = {},
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const indexPath = join(vaultPath, "index.md");
  const projectsPath = join(vaultPath, "projects");

  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    return [{ severity: "error", code: "missing-vault", path: vaultPath, message: "Vault path is not an existing directory" }];
  }
  if (!existsSync(indexPath)) {
    return [{ severity: "error", code: "missing-index", path: "index.md", message: "Vault index is missing" }];
  }

  const index = read(indexPath);
  const allMarkdownFiles = markdownFiles(vaultPath);
  const basenameCounts = allMarkdownFiles.reduce((counts, path) => {
    const name = basename(path);
    counts.set(name, (counts.get(name) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  auditIssueTags(findings, vaultPath, indexPath, index);
  if (index.split(/\r?\n/).length > 200 || Buffer.byteLength(index) > 25 * 1024) {
    add(findings, "warning", "oversized-index", "index.md", "Index exceeds the 200-line or 25-KiB startup budget");
  }

  const rootEntries = readdirSync(vaultPath, { withFileTypes: true });
  for (const [prefix, heading] of typedSections) {
    const body = section(index, heading, 2);
    const targets = wikilinkTargets(body);
    const files = rootEntries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(prefix) &&
          entry.name.endsWith(".md") &&
          !entry.name.endsWith(".excalidraw.md"),
      )
      .map((entry) => entry.name);

    for (const file of files) {
      const matchingTargets = targets.filter((target) => targetMatchesRootFile(target, file));
      if (matchingTargets.length === 0) {
        add(findings, "warning", "typed-index-missing", file, `${file} is not linked from the ${heading} section`);
      }
      if (matchingTargets.length > 1) {
        add(findings, "warning", "typed-index-duplicate", "index.md", `${file} is linked ${matchingTargets.length} times from the ${heading} section`);
      }
    }
    for (const target of targets) {
      const file = `${target}.md`;
      if (target.includes("/") || !files.includes(file)) {
        add(findings, "warning", "typed-index-stale", "index.md", `${heading} links ${target}, which does not match a root ${prefix}*.md note`);
      }
    }
  }

  const projectDirectories = existsSync(projectsPath)
    ? readdirSync(projectsPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];
  const projectSet = new Set(projectDirectories);
  const projectMetadata = new Map<string, { dependsOn: string[]; usedBy: string[] }>();
  const statusLinks = new Map<string, string[]>();
  for (const status of ["Active", "Dormant", "Archived"]) {
    statusLinks.set(status.toLowerCase(), projectBulletTargets(section(index, status, 3)));
  }
  const statusRecords = [...statusLinks.entries()].flatMap(([status, targets]) =>
    targets.map((target) => ({
      status,
      target,
      slug: normalizeProjectSlug(target.split("/").at(-1)?.replace(/^_/, "") ?? ""),
    })),
  );
  for (const record of statusRecords) {
    if (!projectSet.has(record.slug)) {
      add(findings, "warning", "project-index-stale", "index.md", `${record.target} is listed under ${record.status} but has no project folder`);
    }
  }

  for (const slug of projectDirectories) {
    const directory = join(projectsPath, slug);
    const entryName = `_${slug}.md`;
    const entryPath = join(directory, entryName);
    if (!existsSync(entryPath)) {
      add(findings, "error", "missing-project-entry", `projects/${slug}`, `Expected ${entryName}`);
      continue;
    }

    const entry = read(entryPath);
    const status = (frontmatterValue(entry, "status") ?? "active").replace(/["']/g, "").toLowerCase();
    const expectedTarget = `projects/${slug}/_${slug}`;
    const records = statusRecords.filter((record) => record.slug === slug);
    if (records.length === 0) {
      add(findings, "error", "project-index-missing", relativePath(vaultPath, entryPath), `Project is not linked from any status section`);
    } else {
      if (records.length > 1) {
        add(findings, "warning", "project-index-duplicate", "index.md", `${slug} is linked ${records.length} times across project status sections`);
      }
      if (!records.some((record) => record.status === status)) {
        add(findings, "warning", "project-index-status", "index.md", `${slug} is ${status} in frontmatter but indexed under ${records.map((record) => record.status).join(", ")}`);
      }
    }
    if (records.length > 0 && !records.some((record) => record.target === expectedTarget)) {
      add(findings, "warning", "project-index-noncanonical", "index.md", `${slug} should use [[${expectedTarget}|${slug}]] under ${status}`);
    }

    if (entry.split(/\r?\n/).length > 250 || Buffer.byteLength(entry) > 25 * 1024) {
      add(findings, "warning", "oversized-project-entry", relativePath(vaultPath, entryPath), "Project entry exceeds the 250-line or 25-KiB orientation budget");
    }

    projectMetadata.set(slug, {
      dependsOn: listFrontmatterValue(entry, "depends_on"),
      usedBy: listFrontmatterValue(entry, "used_by"),
    });

    const projectFiles = readdirSync(directory, { withFileTypes: true })
      .filter((item) => item.isFile() && item.name.endsWith(".md"))
      .map((item) => item.name);
    for (const fileName of projectFiles) {
      const path = join(directory, fileName);
      const markdown = read(path);
      const rel = relativePath(vaultPath, path);
      const excalidraw = fileName.endsWith(".excalidraw.md");
      if (!hasProjectTag(markdown, slug, excalidraw)) {
        add(findings, "warning", "missing-project-tag", rel, excalidraw ? "Excalidraw note lacks a project tag" : "Final non-empty line lacks the project tag");
      }
      if (fileName !== entryName && !wikilinkTargets(entry).some((target) => targetMatchesProjectFile(target, slug, fileName, basenameCounts))) {
        add(findings, "warning", "unlinked-companion", rel, "Companion note is not linked from the project entry point");
      }
      if (markdown.split(/\r?\n/).length > 1000) {
        add(findings, "warning", "oversized-note", rel, "Note exceeds 1,000 lines and should be split or searched selectively");
      }
      auditIssueTags(findings, vaultPath, path, markdown);
    }
  }

  for (const [slug, metadata] of projectMetadata) {
    for (const dependency of metadata.dependsOn) {
      if (!projectSet.has(dependency)) continue;
      const reciprocal = projectMetadata.get(dependency)?.usedBy ?? [];
      if (!reciprocal.includes(slug)) {
        add(findings, "warning", "relationship-not-reciprocal", `projects/${dependency}/_${dependency}.md`, `${slug} depends_on ${dependency}, but ${dependency}.used_by omits ${slug}`);
      }
    }
    for (const consumer of metadata.usedBy) {
      if (!projectSet.has(consumer)) continue;
      const reciprocal = projectMetadata.get(consumer)?.dependsOn ?? [];
      if (!reciprocal.includes(slug)) {
        add(findings, "warning", "relationship-not-reciprocal", `projects/${consumer}/_${consumer}.md`, `${slug}.used_by lists ${consumer}, but ${consumer}.depends_on omits ${slug}`);
      }
    }
  }

  for (const line of [...statusLinks.values()].flatMap((targets, statusIndex) => {
    const status = ["Active", "Dormant", "Archived"][statusIndex];
    return section(index, status, 3).split(/\r?\n/);
  })) {
    if (/^\s*-\s+\[\[[^\]]+\]\]\s+[-—:].+/.test(line)) {
      add(findings, "warning", "index-project-summary", "index.md", `Project bullet contains summary prose: ${line.trim().slice(0, 120)}`);
    }
  }

  const paletteAssignments = auditPalette(
    findings,
    vaultPath,
    options.graphPaletteNote,
    projectDirectories,
  );
  const graphPath = join(vaultPath, ".obsidian", "graph.json");
  if (!options.graphPaletteNote) {
    // Project graph coloring is optional and only enabled by a configured palette.
  } else if (!existsSync(graphPath)) {
    add(
      findings,
      "warning",
      "missing-graph-config",
      ".obsidian/graph.json",
      "A graph palette is configured, but graph.json is missing",
    );
  } else {
    try {
      const graph = JSON.parse(read(graphPath)) as { colorGroups?: Array<{ query?: string; color?: { rgb?: number } }> };
      const groups = graph.colorGroups ?? [];
      const grouped = new Map<string, Array<{ query: string; rgb?: number }>>();
      for (const group of groups) {
        const query = group.query ?? "";
        const match = query.match(/^path:projects\/([^/\s]+)(\/?)$/);
        if (!match) {
          if (query.includes("path:projects/")) {
            add(findings, "warning", "malformed-graph-query", ".obsidian/graph.json", `Noncanonical project color query: ${query}`);
          }
          continue;
        }
        const [, slug, slash] = match;
        const values = grouped.get(slug) ?? [];
        values.push({ query, rgb: group.color?.rgb });
        grouped.set(slug, values);
        if (!slash) {
          add(findings, "warning", "graph-query-missing-slash", ".obsidian/graph.json", `${query} should end with / to avoid sibling-prefix matches`);
          if (projectDirectories.some((candidate) => candidate !== slug && candidate.startsWith(slug))) {
            add(findings, "warning", "graph-query-prefix-shadow", ".obsidian/graph.json", `${query} can shadow a sibling project folder`);
          }
        }
      }

      for (const slug of projectDirectories) {
        const matches = grouped.get(slug) ?? [];
        if (matches.length === 0) add(findings, "warning", "missing-graph-group", `projects/${slug}`, "Project has no graph color group");
        if (matches.length > 1) add(findings, "warning", "duplicate-graph-group", ".obsidian/graph.json", `${slug} has ${matches.length} graph color groups`);
        for (const group of matches) {
          if (typeof group.rgb !== "number") {
            add(findings, "warning", "missing-graph-color", ".obsidian/graph.json", `${group.query} has no numeric rgb color`);
          }
        }
        const expectedRgb = paletteAssignments.get(slug);
        if (expectedRgb === undefined) {
          add(
            findings,
            "warning",
            "missing-palette-assignment",
            options.graphPaletteNote,
            `${slug} has a graph group but no exact palette assignment`,
          );
        }
        if (expectedRgb !== undefined && matches.length === 1 && matches[0].rgb !== expectedRgb) {
          add(
            findings,
            "warning",
            "graph-color-mismatch",
            ".obsidian/graph.json",
            `${matches[0].query} uses rgb ${matches[0].rgb ?? "missing"}; palette hex converts to ${expectedRgb}`,
          );
        }
      }
      for (const slug of grouped.keys()) {
        if (!projectSet.has(slug)) add(findings, "warning", "stale-graph-group", ".obsidian/graph.json", `${slug} has a graph group but no project folder`);
      }
    } catch (error) {
      add(findings, "error", "invalid-graph-json", ".obsidian/graph.json", error instanceof Error ? error.message : String(error));
    }
  }

  const openItems = allMarkdownFiles
    .filter((path) => basename(path) === "improvements.md")
    .reduce((count, path) => count + (read(path).match(/^- \[ \]/gm)?.length ?? 0), 0);
  if (openItems > 50) {
    add(findings, "warning", "backlog-pressure", "improvements.md", `Vault contains ${openItems} open improvement items`);
  } else if (openItems > 10) {
    add(findings, "info", "backlog-pressure", "improvements.md", `Vault contains ${openItems} open improvement items`);
  }

  return findings.sort(
    (left, right) =>
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.code.localeCompare(right.code) ||
      left.path.localeCompare(right.path),
  );
}

function configValue(markdown: string, label: string): string | undefined {
  return markdown.match(new RegExp(`^${label}:\\s*\`([^\`]+)\`\\s*$`, "m"))?.[1];
}

export function resolveGraphPaletteNote(
  vaultPath: string,
  config: string,
  explicitVaultPath: boolean,
  requestedGraphPaletteNote?: string,
): string | undefined {
  if (requestedGraphPaletteNote) return requestedGraphPaletteNote;
  if (!explicitVaultPath) {
    const configured = configValue(config, "Graph palette note");
    if (configured) return configured;
    if (/^Graph palette note:/m.test(config)) return undefined;
  }
  return existsSync(join(vaultPath, "tool-vault-graph.md"))
    ? "tool-vault-graph.md"
    : undefined;
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

  const configPath = resolve(dirname(fileURLToPath(import.meta.url)), "../references/brain-config.md");
  const config = existsSync(configPath) ? read(configPath) : "";
  const requestedVaultPath = valueFor("--vault-path");
  const vaultPath = requestedVaultPath ?? configValue(config, "Vault path");
  if (!vaultPath) {
    console.error("No vault path supplied and references/brain-config.md is not configured");
    process.exitCode = 2;
    return;
  }

  const resolvedVaultPath = resolve(vaultPath);
  const graphPaletteNote = resolveGraphPaletteNote(
    resolvedVaultPath,
    config,
    requestedVaultPath !== undefined,
    valueFor("--graph-palette-note"),
  );
  const findings = auditVault(resolvedVaultPath, { graphPaletteNote });
  if (args.includes("--json")) {
    console.log(JSON.stringify({ vaultPath: resolvedVaultPath, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("Vault audit passed with no findings.");
  } else {
    for (const finding of findings) {
      console.log(`${finding.severity.toUpperCase()} ${finding.code} ${finding.path}: ${finding.message}`);
    }
    const counts = Object.fromEntries(
      (["error", "warning", "info"] as const).map((severity) => [
        severity,
        findings.filter((finding) => finding.severity === severity).length,
      ]),
    );
    console.log(`\n${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info finding(s)`);
  }

  const hasErrors = findings.some((finding) => finding.severity === "error");
  const hasWarnings = findings.some((finding) => finding.severity === "warning");
  if (hasErrors || (args.includes("--strict") && hasWarnings)) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) main();

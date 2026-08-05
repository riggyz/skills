import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

export const ROOT_ROUTERS = [
  "index.md",
  "wikis.md",
  "projects.md",
  "workspaces.md",
  "tools.md",
  "decisions.md",
  "gotchas.md",
  "codestyle.md",
  "improvements.md",
] as const;

export const NODE_CLASSES = ["wikis", "projects", "workspaces", "tools"] as const;
export type NodeClass = (typeof NODE_CLASSES)[number];

export const RECORD_KINDS = ["decisions", "gotchas", "codestyle", "history"] as const;
export type RecordKindDirectory = (typeof RECORD_KINDS)[number];

export interface VaultNote {
  absolutePath: string;
  relativePath: string;
  content: string;
  frontmatter: string | undefined;
}

export function normalizeSlug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function relativeVaultPath(vaultPath: string, path: string): string {
  return relative(vaultPath, path).replaceAll("\\", "/");
}

export function markdownFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if ([".obsidian", ".git", ".trash", "node_modules"].includes(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

export function frontmatterBody(markdown: string): string | undefined {
  return markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
}

export function frontmatterValue(markdown: string, field: string): string | undefined {
  const body = frontmatterBody(markdown);
  if (!body) return undefined;
  const raw = body.match(new RegExp(`^${escapeRegex(field)}:\\s*(.*?)\\s*$`, "m"))?.[1];
  if (raw === undefined) return undefined;
  return stripScalar(raw.replace(/\s+#.*$/, "").trim());
}

export function frontmatterBoolean(markdown: string, field: string): boolean | undefined {
  const raw = frontmatterValue(markdown, field);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export function frontmatterList(markdown: string, field: string): string[] {
  const body = frontmatterBody(markdown);
  if (!body) return [];
  const lines = body.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${field}:`));
  if (index === -1) return [];

  const inline = lines[index].slice(field.length + 1).replace(/\s+#.*$/, "").trim();
  let values: string[] = [];
  if (inline.startsWith("[")) {
    let flow = inline;
    let cursor = index + 1;
    while (!/\]\s*(?:#.*)?$/.test(flow) && cursor < lines.length) {
      flow += ` ${lines[cursor].trim()}`;
      cursor += 1;
    }
    const closing = flow.lastIndexOf("]");
    if (closing !== -1) values = splitFlowValues(flow.slice(1, closing));
  } else if (!inline) {
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const match = lines[cursor].match(/^\s+-\s+(.+)$/);
      if (!match) break;
      values.push(match[1]);
    }
  } else {
    values = [inline];
  }
  return values.map((value) => stripScalar(value.trim())).filter(Boolean);
}

function splitFlowValues(value: string): string[] {
  const values: string[] = [];
  let current = "";
  let quote: string | undefined;
  for (const char of value) {
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? undefined : char;
      current += char;
    } else if (char === "," && !quote) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) values.push(current);
  return values;
}

function stripScalar(value: string): string {
  return value
    .replace(/^['"]|['"]$/g, "")
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "")
    .split("|")[0]
    .trim();
}

export function wikilinkTargets(markdown: string): string[] {
  return [...markdown.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g)].map(
    (match) => match[1].replace(/\.md$/, ""),
  );
}

export function markdownSection(markdown: string, heading: string, level: 2 | 3): string {
  const marker = `${"#".repeat(level)} ${heading}`;
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) return "";
  const end = lines.findIndex(
    (line, index) => index > start && new RegExp(`^#{1,${level}}\\s+`).test(line.trim()),
  );
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n");
}

export function ownerFromPath(relativePath: string): string | undefined {
  const parts = relativePath.split("/");
  if (parts.length >= 3 && NODE_CLASSES.includes(parts[0] as NodeClass)) {
    const singular = parts[0].slice(0, -1);
    return `${singular}/${parts[1]}`;
  }
  if (parts.length === 2 && ["decisions", "gotchas", "codestyle"].includes(parts[0])) {
    return "global";
  }
  return undefined;
}

export function ownerTag(owner: string): string | undefined {
  if (owner === "global") return undefined;
  const [kind, slug] = owner.split("/");
  return kind && slug ? `#${kind}/${slug}` : undefined;
}

export function expectedEntryPath(nodeClass: NodeClass, slug: string): string {
  return `${nodeClass}/${slug}/_${slug}.md`;
}

export function noteForPath(vaultPath: string, path: string): VaultNote {
  const content = readFileSync(path, "utf8");
  return {
    absolutePath: path,
    relativePath: relativeVaultPath(vaultPath, path),
    content,
    frontmatter: frontmatterBody(content),
  };
}

export function finalNonEmptyLine(markdown: string): string | undefined {
  return markdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function fileBasename(path: string): string {
  return basename(path).replace(/\.md$/, "");
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

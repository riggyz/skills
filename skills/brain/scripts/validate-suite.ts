#!/usr/bin/env -S npx tsx

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface SuiteManifest {
  suiteVersion: number;
  contractVersion: number;
  foundation: string;
  skills: string[];
}

export interface SuiteFinding {
  code: string;
  path: string;
  message: string;
}

function frontmatterName(markdown: string): string | undefined {
  return markdown.match(/^---\r?\n[\s\S]*?^name:\s*(\S+)\s*$[\s\S]*?^---\s*$/m)?.[1];
}

export function validateSuite(skillsRoot: string): SuiteFinding[] {
  const findings: SuiteFinding[] = [];
  const manifestPath = join(skillsRoot, "brain", "references", "suite-manifest.json");
  if (!existsSync(manifestPath)) {
    return [{ code: "missing-manifest", path: manifestPath, message: "Brain suite manifest is missing" }];
  }

  let manifest: SuiteManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SuiteManifest;
  } catch (error) {
    return [{ code: "invalid-manifest", path: manifestPath, message: error instanceof Error ? error.message : String(error) }];
  }

  if (manifest.suiteVersion !== 2 || manifest.contractVersion !== 2) {
    findings.push({ code: "version-mismatch", path: manifestPath, message: "Expected suite and contract version 2" });
  }
  if (manifest.foundation !== "brain") {
    findings.push({ code: "invalid-foundation", path: manifestPath, message: "Foundation must be brain" });
  }
  if (new Set(manifest.skills).size !== manifest.skills.length) {
    findings.push({ code: "duplicate-skill", path: manifestPath, message: "Manifest contains duplicate skill names" });
  }

  for (const skill of manifest.skills) {
    const skillPath = join(skillsRoot, skill, "SKILL.md");
    if (!existsSync(skillPath)) {
      findings.push({ code: "missing-skill", path: skillPath, message: `${skill} is missing` });
      continue;
    }
    const markdown = readFileSync(skillPath, "utf8");
    if (frontmatterName(markdown) !== skill) {
      findings.push({ code: "skill-name-mismatch", path: skillPath, message: `Frontmatter name must be ${skill}` });
    }
    if (skill !== "brain" && !/\bbrain\b/i.test(markdown)) {
      findings.push({ code: "missing-foundation-reference", path: skillPath, message: `${skill} does not reference the brain foundation` });
    }
    const evalPath = join(skillsRoot, skill, "evals", "evals.json");
    if (!existsSync(evalPath)) {
      findings.push({ code: "missing-evals", path: evalPath, message: `${skill} has no eval corpus` });
    } else {
      try {
        const corpus = JSON.parse(readFileSync(evalPath, "utf8")) as { skill_name?: string };
        if (corpus.skill_name !== skill) {
          findings.push({ code: "eval-name-mismatch", path: evalPath, message: `skill_name must be ${skill}` });
        }
      } catch (error) {
        findings.push({ code: "invalid-evals", path: evalPath, message: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  if (existsSync(join(skillsRoot, "deep-dive", "SKILL.md"))) {
    findings.push({ code: "legacy-skill", path: "deep-dive/SKILL.md", message: "Legacy deep-dive must be removed; use brain-build" });
  }

  const discoverable = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name);
  for (const suiteSkill of manifest.skills) {
    if (!discoverable.includes(suiteSkill)) {
      findings.push({ code: "undiscoverable-skill", path: suiteSkill, message: `${suiteSkill} is not discoverable` });
    }
  }
  return findings.sort((left, right) => left.code.localeCompare(right.code) || left.path.localeCompare(right.path));
}

function main(): void {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--skills-root");
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const skillsRoot = resolve(rootIndex === -1 ? defaultRoot : (args[rootIndex + 1] ?? ""));
  const findings = validateSuite(skillsRoot);
  if (args.includes("--json")) console.log(JSON.stringify({ skillsRoot, findings }, null, 2));
  else if (findings.length === 0) console.log("Brain suite validation passed.");
  else for (const finding of findings) console.log(`ERROR ${finding.code} ${finding.path}: ${finding.message}`);
  if (findings.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) main();

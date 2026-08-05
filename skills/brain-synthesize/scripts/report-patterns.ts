#!/usr/bin/env -S npx tsx

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  frontmatterBoolean,
  frontmatterList,
  frontmatterValue,
  markdownFiles,
  noteForPath,
  ownerFromPath,
  sha256,
} from "../../brain/scripts/vault-model.js";
import { readBrainConfig } from "../../brain/scripts/configure-brain.js";

export type PatternLane = "gotcha" | "decision" | "codestyle" | "recurring-improvement";

interface PatternRecord {
  path: string;
  id: string;
  lane: PatternLane;
  owner: string;
  pattern: string;
  status: string;
  stance: "supports" | "contradicts";
  occurrence?: string;
  primaryEvidence: string[];
  derivedFrom: string[];
  provenanceComplete: boolean;
  appliesTo: string[];
  authorityKind?: string;
  authorityScope?: string;
  authorityRef?: string;
  workOwner?: string;
  remediation?: string;
  bodyHash: string;
}

export interface PatternCandidate {
  fingerprint: string;
  revisionFingerprint: string;
  lane: PatternLane;
  pattern: string;
  target: string;
  counts: {
    records: number;
    owners: number;
    independentOccurrences: number;
  };
  eligibleForAutomaticPromotion: boolean;
  blockers: string[];
  sources: Array<{
    id: string;
    owner: string;
    occurrence?: string;
    path: string;
    primaryEvidence: string[];
  }>;
  omittedSources: number;
}

export interface PatternReport {
  schemaVersion: "brain-pattern-report/v1";
  policyVersion: "brain-promotion/v1";
  vaultFingerprint: string;
  mode: "full" | "targeted";
  stats: {
    filesScanned: number;
    structuredRecords: number;
    legacyUnits: number;
    totalCandidates: number;
    emittedCandidates: number;
  };
  diagnostics: Array<{ path: string; message: string }>;
  candidates: PatternCandidate[];
}

export interface ReportOptions {
  mode?: "full" | "targeted";
  seedRecordIds?: string[];
  lanes?: PatternLane[];
  maxCandidates?: number;
  maxEvidence?: number;
}

const LANES = new Set<PatternLane>(["gotcha", "decision", "codestyle", "recurring-improvement"]);
const DECISION_AUTHORITIES = new Set(["direct-user", "org-policy", "adr"]);
const STYLE_AUTHORITIES = new Set(["direct-user", "org-policy", "canonical-config"]);

function parseRecord(vaultPath: string, path: string): { record?: PatternRecord; diagnostic?: string; legacy: boolean } {
  const note = noteForPath(vaultPath, path);
  const schema = frontmatterValue(note.content, "brain_schema");
  const legacy = !schema && /(?:^|\/)(?:decisions|gotchas|codestyle|improvements)(?:\.md|\/)/.test(note.relativePath);
  if (!schema) return { legacy };
  if (schema !== "pattern-record/v1") return { legacy: false };

  const id = frontmatterValue(note.content, "brain_id");
  const lane = frontmatterValue(note.content, "brain_lane") as PatternLane | undefined;
  const declaredOwner = frontmatterValue(note.content, "brain_owner");
  const pathOwner = ownerFromPath(note.relativePath);
  const pattern = frontmatterValue(note.content, "brain_pattern");
  const status = frontmatterValue(note.content, "brain_status");
  if (!id || !lane || !LANES.has(lane) || !declaredOwner || !pattern || !status) {
    return { legacy: false, diagnostic: "Structured record is missing required brain_* fields" };
  }
  if (pathOwner && declaredOwner !== pathOwner) {
    return { legacy: false, diagnostic: `brain_owner ${declaredOwner} disagrees with path owner ${pathOwner}` };
  }

  const stance = frontmatterValue(note.content, "brain_stance") === "contradicts" ? "contradicts" : "supports";
  return {
    legacy: false,
    record: {
      path: note.relativePath,
      id,
      lane,
      owner: declaredOwner,
      pattern,
      status,
      stance,
      occurrence: frontmatterValue(note.content, "brain_occurrence"),
      primaryEvidence: frontmatterList(note.content, "brain_primary_evidence"),
      derivedFrom: frontmatterList(note.content, "brain_derived_from"),
      provenanceComplete: frontmatterBoolean(note.content, "brain_provenance_complete") === true,
      appliesTo: frontmatterList(note.content, "brain_applies_to"),
      authorityKind: frontmatterValue(note.content, "brain_authority_kind"),
      authorityScope: frontmatterValue(note.content, "brain_authority_scope"),
      authorityRef: frontmatterValue(note.content, "brain_authority_ref"),
      workOwner: frontmatterValue(note.content, "brain_work_owner"),
      remediation: frontmatterValue(note.content, "brain_remediation"),
      bodyHash: sha256(note.content.replace(/^---[\s\S]*?---\s*/, "").trim()),
    },
  };
}

function commonValue(lists: string[][]): string | undefined {
  if (lists.length === 0 || lists.some((values) => values.length === 0)) return undefined;
  const intersection = lists[0].filter((value) => lists.every((values) => values.includes(value)));
  return intersection.sort()[0];
}

function independentOccurrenceKey(record: PatternRecord): string {
  if (record.occurrence) return `occurrence:${record.occurrence}`;
  if (record.primaryEvidence.length > 0) return `evidence:${[...record.primaryEvidence].sort().join("|")}`;
  return `unproven:${record.id}`;
}

function blockersFor(records: PatternRecord[], target: string): string[] {
  const blockers: string[] = [];
  const supporting = records.filter((record) => record.stance === "supports" && record.derivedFrom.length === 0);
  const owners = new Set(supporting.map((record) => record.owner));
  const occurrences = new Set(supporting.map(independentOccurrenceKey));
  if (records.some((record) => record.stance === "contradicts")) blockers.push("contradictory-evidence");
  if (supporting.some((record) => record.status !== "verified")) blockers.push("unverified-evidence");
  if (supporting.some((record) => !record.provenanceComplete)) blockers.push("incomplete-provenance");

  const lane = records[0].lane;
  if (lane === "gotcha" || lane === "recurring-improvement") {
    if (owners.size < 3) blockers.push("fewer-than-three-independent-owners");
    if (occurrences.size < 3) blockers.push("fewer-than-three-independent-occurrences");
  }
  if (lane === "decision") {
    const authority = supporting.find(
      (record) => record.authorityKind && DECISION_AUTHORITIES.has(record.authorityKind) && record.authorityRef,
    );
    if (!authority) blockers.push("missing-decision-authority");
    else if (authority.authorityScope && authority.authorityScope !== target && target === "global") {
      blockers.push("decision-authority-too-narrow");
    }
  }
  if (lane === "codestyle") {
    const authority = supporting.find(
      (record) => record.authorityKind && STYLE_AUTHORITIES.has(record.authorityKind) && record.authorityRef,
    );
    if (!authority) blockers.push("missing-codestyle-authority");
  }
  if (lane === "recurring-improvement") {
    if (supporting.some((record) => record.workOwner !== "brain")) blockers.push("tracker-owned-work");
    const remediations = new Set(supporting.map((record) => record.remediation).filter(Boolean));
    if (remediations.size !== 1) blockers.push("no-common-remediation");
  }
  return [...new Set(blockers)].sort();
}

export function reportPatterns(vaultPath: string, options: ReportOptions = {}): PatternReport {
  const mode = options.mode ?? "full";
  const maxCandidates = Math.min(options.maxCandidates ?? 24, 100);
  const maxEvidence = Math.min(options.maxEvidence ?? 6, 12);
  const paths = markdownFiles(vaultPath);
  const records: PatternRecord[] = [];
  const diagnostics: Array<{ path: string; message: string }> = [];
  let legacyUnits = 0;

  for (const path of paths) {
    const parsed = parseRecord(vaultPath, path);
    if (parsed.legacy) legacyUnits += 1;
    if (parsed.diagnostic) diagnostics.push({ path: noteForPath(vaultPath, path).relativePath, message: parsed.diagnostic });
    if (parsed.record) records.push(parsed.record);
  }

  const selectedRecords = mode === "targeted" && options.seedRecordIds?.length
    ? records.filter((record) => options.seedRecordIds?.includes(record.id))
    : records;
  const selectedPatterns = new Set(selectedRecords.map((record) => `${record.lane}\u0000${record.pattern}`));
  const groups = new Map<string, PatternRecord[]>();
  for (const record of records) {
    const key = `${record.lane}\u0000${record.pattern}`;
    if (mode === "targeted" && !selectedPatterns.has(key)) continue;
    if (options.lanes && !options.lanes.includes(record.lane)) continue;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const allCandidates = [...groups.values()].map((group): PatternCandidate => {
    const recordsSorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const target = commonValue(recordsSorted.map((record) => record.appliesTo)) ?? "global";
    const blockers = blockersFor(recordsSorted, target);
    const fingerprint = sha256(`${recordsSorted[0].lane}\u0000${recordsSorted[0].pattern}`);
    const revisionFingerprint = sha256(canonicalJson({
      policy: "brain-promotion/v1",
      target,
      records: recordsSorted.map((record) => ({
        id: record.id,
        owner: record.owner,
        status: record.status,
        stance: record.stance,
        occurrence: record.occurrence,
        primaryEvidence: [...record.primaryEvidence].sort(),
        derivedFrom: [...record.derivedFrom].sort(),
        bodyHash: record.bodyHash,
      })),
    }));
    const sourceRows = recordsSorted.slice(0, maxEvidence).map((record) => ({
      id: record.id,
      owner: record.owner,
      occurrence: record.occurrence,
      path: record.path,
      primaryEvidence: record.primaryEvidence,
    }));
    return {
      fingerprint,
      revisionFingerprint,
      lane: recordsSorted[0].lane,
      pattern: recordsSorted[0].pattern,
      target,
      counts: {
        records: recordsSorted.length,
        owners: new Set(recordsSorted.filter((record) => record.derivedFrom.length === 0).map((record) => record.owner)).size,
        independentOccurrences: new Set(recordsSorted.filter((record) => record.derivedFrom.length === 0).map(independentOccurrenceKey)).size,
      },
      eligibleForAutomaticPromotion: blockers.length === 0,
      blockers,
      sources: sourceRows,
      omittedSources: Math.max(0, recordsSorted.length - sourceRows.length),
    };
  }).sort((left, right) =>
    Number(right.eligibleForAutomaticPromotion) - Number(left.eligibleForAutomaticPromotion) ||
    right.counts.independentOccurrences - left.counts.independentOccurrences ||
    left.lane.localeCompare(right.lane) ||
    left.pattern.localeCompare(right.pattern),
  );

  const candidates = allCandidates.slice(0, maxCandidates);
  return {
    schemaVersion: "brain-pattern-report/v1",
    policyVersion: "brain-promotion/v1",
    vaultFingerprint: sha256(canonicalJson(records.map((record) => ({ id: record.id, bodyHash: record.bodyHash })).sort((a, b) => a.id.localeCompare(b.id)))),
    mode,
    stats: {
      filesScanned: paths.length,
      structuredRecords: records.length,
      legacyUnits,
      totalCandidates: allCandidates.length,
      emittedCandidates: candidates.length,
    },
    diagnostics: diagnostics.sort((a, b) => a.path.localeCompare(b.path)),
    candidates,
  };
}

function valueFor(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function valuesFor(args: string[], flag: string): string[] {
  return args.flatMap((value, index) => value === flag && args[index + 1] ? [args[index + 1]] : []);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "report";
  let configuredVault: string | undefined;
  try {
    configuredVault = readBrainConfig().vault.path;
  } catch {
    configuredVault = undefined;
  }
  const vaultPath = valueFor(args, "--vault-path") ?? configuredVault;
  if (!vaultPath || !existsSync(vaultPath)) {
    console.error("--vault-path must name an existing vault when brain config is unavailable");
    process.exitCode = 2;
    return;
  }
  const report = reportPatterns(resolve(vaultPath), {
    mode: valueFor(args, "--mode") === "targeted" ? "targeted" : "full",
    seedRecordIds: valuesFor(args, "--seed-record"),
    lanes: valuesFor(args, "--lane").filter((lane): lane is PatternLane => LANES.has(lane as PatternLane)),
    maxCandidates: Number(valueFor(args, "--max-candidates") ?? 24),
    maxEvidence: Number(valueFor(args, "--max-evidence") ?? 6),
  });

  if (command === "verify-plan") {
    const planPath = valueFor(args, "--plan-path");
    if (!planPath || !existsSync(planPath)) {
      console.error("verify-plan requires --plan-path");
      process.exitCode = 2;
      return;
    }
    const plan = JSON.parse(readFileSync(planPath, "utf8")) as { fingerprint?: string; revisionFingerprint?: string };
    const candidate = report.candidates.find((item) => item.fingerprint === plan.fingerprint);
    const valid = Boolean(candidate && candidate.revisionFingerprint === plan.revisionFingerprint && candidate.eligibleForAutomaticPromotion);
    console.log(JSON.stringify({ valid, candidate: candidate ?? null }, null, args.includes("--pretty") ? 2 : 0));
    if (!valid) process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(report, null, args.includes("--pretty") ? 2 : 0));
  if (args.includes("--strict") && report.diagnostics.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) main();

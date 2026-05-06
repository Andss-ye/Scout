import fs from "node:fs/promises";
import path from "node:path";
import {
  APPLIED_MARKER,
  CLAUDE_DIR,
  PROJECT_INSTRUCTIONS,
  appliedMarkerPath,
  isIgnoredInClaudeDir,
} from "../spec/claude.js";
import type {
  ApplyOptions,
  ApplyResult,
  AppliedMarker,
} from "../types/index.js";
import { copyFile, exists, writeJson } from "../utils/fs.js";
import { presetDir } from "../utils/paths.js";

const SCOUT_VERSION = "0.1.0";

export async function applyPreset(
  presetName: string,
  projectRoot: string,
  options: ApplyOptions = {}
): Promise<ApplyResult> {
  const src = presetDir(presetName);
  if (!(await exists(src))) {
    throw new Error(
      `preset "${presetName}" not found at ${src}\n` +
        `  The registry has an entry but the directory is missing.\n` +
        `  Run: scout clean --orphans   (removes stale registry entries)\n` +
        `  Then: scout save "${presetName}"   (re-create the preset)`
    );
  }

  const written: string[] = [];
  const skipped: string[] = [];
  const wouldWrite: string[] = [];

  await walk(src, projectRoot);

  if (!options.dryRun) {
    const marker: AppliedMarker = {
      preset: presetName,
      appliedAt: new Date().toISOString(),
      merge: options.merge ?? false,
      scoutVersion: SCOUT_VERSION,
    };
    await writeJson(appliedMarkerPath(projectRoot), marker);
  }

  return { written, skipped, wouldWrite };

  async function walk(from: string, to: string): Promise<void> {
    const entries = await fs.readdir(from, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === APPLIED_MARKER) continue;
      if (isIgnoredInClaudeDir(entry.name)) continue;
      const fromPath = path.join(from, entry.name);
      const toPath = path.join(to, entry.name);

      if (entry.isDirectory()) {
        if (!options.dryRun) await fs.mkdir(toPath, { recursive: true });
        await walk(fromPath, toPath);
      } else if (entry.isFile()) {
        const targetExists = await exists(toPath);
        if (options.merge && targetExists) {
          skipped.push(toPath);
          continue;
        }
        if (options.dryRun) {
          wouldWrite.push(toPath);
          continue;
        }
        await copyFile(fromPath, toPath);
        written.push(toPath);
      }
    }
  }
}

export async function readMarker(
  projectRoot: string
): Promise<AppliedMarker | null> {
  const p = appliedMarkerPath(projectRoot);
  if (!(await exists(p))) return null;
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as AppliedMarker;
  } catch {
    return null;
  }
}

/**
 * Returns the entries that exist at the project root that scout would manage.
 * Used by `inspect` and as a safety check before destructive ops.
 */
export async function listProjectClaudeArtifacts(
  projectRoot: string
): Promise<string[]> {
  const out: string[] = [];
  const root = path.join(projectRoot, PROJECT_INSTRUCTIONS);
  if (await exists(root)) out.push(PROJECT_INSTRUCTIONS);
  const claudeDir = path.join(projectRoot, CLAUDE_DIR);
  if (await exists(claudeDir)) {
    const entries = await fs.readdir(claudeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (isIgnoredInClaudeDir(entry.name)) continue;
      out.push(path.posix.join(CLAUDE_DIR, entry.name));
    }
  }
  return out;
}

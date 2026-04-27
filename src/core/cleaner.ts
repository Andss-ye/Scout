import fs from "node:fs/promises";
import type { CleanOptions, CleanResult } from "../types/index.js";
import { dirSize, exists, rmrf } from "../utils/fs.js";
import {
  presetDir,
  presetsDir,
  scanCachePath,
  scoutHome,
} from "../utils/paths.js";
import { listPresets, removePreset } from "./registry.js";

/**
 * Cleanup operations. All operations are idempotent — running twice is safe.
 */
export async function clean(options: CleanOptions = {}): Promise<CleanResult> {
  if (options.all) return cleanAll(options.dryRun ?? false);

  const removed: string[] = [];
  let freedBytes = 0;

  if (options.cache) {
    const r = await removeCache(options.dryRun ?? false);
    removed.push(...r.removed);
    freedBytes += r.freedBytes;
  }

  if (options.orphans) {
    const r = await removeOrphans(options.dryRun ?? false);
    removed.push(...r.removed);
    freedBytes += r.freedBytes;
  }

  if (options.preset) {
    const r = await removeOnePreset(options.preset, options.dryRun ?? false);
    removed.push(...r.removed);
    freedBytes += r.freedBytes;
  }

  return { removed, freedBytes };
}

async function cleanAll(dryRun: boolean): Promise<CleanResult> {
  const home = scoutHome();
  if (!(await exists(home))) return { removed: [], freedBytes: 0 };
  const size = await dirSize(home);
  if (dryRun) return { removed: [home], freedBytes: size };
  await rmrf(home);
  return { removed: [home], freedBytes: size };
}

async function removeCache(dryRun: boolean): Promise<CleanResult> {
  const cache = scanCachePath();
  if (!(await exists(cache))) return { removed: [], freedBytes: 0 };
  const stat = await fs.stat(cache);
  if (dryRun) return { removed: [cache], freedBytes: stat.size };
  await rmrf(cache);
  return { removed: [cache], freedBytes: stat.size };
}

async function removeOrphans(dryRun: boolean): Promise<CleanResult> {
  const removed: string[] = [];
  let freedBytes = 0;

  const presets = await listPresets();
  const root = presetsDir();
  const onDisk: string[] = (await exists(root))
    ? (await fs.readdir(root, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

  // Registry entries with no directory.
  for (const meta of presets) {
    if (!onDisk.includes(meta.name)) {
      removed.push(`registry:${meta.name}`);
      if (!dryRun) await removePreset(meta.name);
    }
  }

  // Directories not in registry.
  const known = new Set(presets.map((p) => p.name));
  for (const name of onDisk) {
    if (!known.has(name)) {
      const dir = presetDir(name);
      const size = await dirSize(dir);
      removed.push(dir);
      freedBytes += size;
      if (!dryRun) await rmrf(dir);
    }
  }

  return { removed, freedBytes };
}

async function removeOnePreset(
  name: string,
  dryRun: boolean
): Promise<CleanResult> {
  const dir = presetDir(name);
  let freedBytes = 0;
  const removed: string[] = [];

  if (await exists(dir)) {
    freedBytes = await dirSize(dir);
    removed.push(dir);
    if (!dryRun) await rmrf(dir);
  }
  if (!dryRun) await removePreset(name);
  else removed.push(`registry:${name}`);

  return { removed, freedBytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

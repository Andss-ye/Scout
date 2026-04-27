import fs from "node:fs/promises";
import path from "node:path";
import {
  CLAUDE_DIR,
  PROJECT_INSTRUCTIONS,
  SKILL_FILE,
  isIgnoredInClaudeDir,
  presetManagedEntries,
  projectClaudeDir,
  projectInstructionsPath,
} from "../spec/claude.js";
import type { PresetMetadata, SaveOptions } from "../types/index.js";
import { copyDir, copyFile, exists, rmrf } from "../utils/fs.js";
import { presetDir, presetsDir } from "../utils/paths.js";
import { upsertPreset, removePreset, getPreset } from "./registry.js";

const PRESET_NAME_RE = /^[a-z0-9][a-z0-9-_.]{0,63}$/i;

export function validatePresetName(name: string): void {
  if (!PRESET_NAME_RE.test(name)) {
    throw new Error(
      `invalid preset name "${name}": use 1-64 chars, alphanumeric plus -_.`
    );
  }
}

export async function savePreset(
  projectRoot: string,
  name: string,
  options: SaveOptions = {}
): Promise<PresetMetadata> {
  validatePresetName(name);

  const target = presetDir(name);
  const existing = await exists(target);
  if (existing && !options.overwrite) {
    throw new Error(
      `preset "${name}" already exists. use --overwrite to replace.`
    );
  }
  if (existing) await rmrf(target);

  const claudeMdSrc = projectInstructionsPath(projectRoot);
  const hasClaudeMd = await exists(claudeMdSrc);
  if (!hasClaudeMd) {
    throw new Error(
      `no ${PROJECT_INSTRUCTIONS} found at ${projectRoot}. nothing to save.`
    );
  }

  await copyFile(claudeMdSrc, path.join(target, PROJECT_INSTRUCTIONS));

  const claudeDirSrc = projectClaudeDir(projectRoot);
  const skills: string[] = [];
  if (await exists(claudeDirSrc)) {
    await copyDir(claudeDirSrc, path.join(target, CLAUDE_DIR), {
      skip: (n) => isIgnoredInClaudeDir(n),
    });
    skills.push(...(await collectSkillNames(claudeDirSrc)));
  }

  const now = new Date().toISOString();
  const prev = await getPreset(name);
  const meta: PresetMetadata = {
    name,
    description: options.description,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    tags: options.tags ?? prev?.tags ?? [],
    skills,
  };
  await upsertPreset(meta);
  return meta;
}

export async function deletePreset(name: string): Promise<boolean> {
  validatePresetName(name);
  const dir = presetDir(name);
  const existed = await exists(dir);
  if (existed) await rmrf(dir);
  await removePreset(name);
  return existed;
}

export async function presetExists(name: string): Promise<boolean> {
  return exists(presetDir(name));
}

export async function listPresetDirs(): Promise<string[]> {
  if (!(await exists(presetsDir()))) return [];
  const entries = await fs.readdir(presetsDir(), { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export function presetManagedRelativePaths(): string[] {
  return presetManagedEntries();
}

async function collectSkillNames(claudeDir: string): Promise<string[]> {
  const skillsRoot = path.join(claudeDir, "skills");
  if (!(await exists(skillsRoot))) return [];
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await exists(path.join(skillsRoot, entry.name, SKILL_FILE))) {
      found.push(entry.name);
    }
  }
  return found;
}

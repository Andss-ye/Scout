/**
 * Single source of truth for Claude Code's filesystem layout.
 * If Anthropic changes the spec, update ONLY this file.
 *
 * Rule: nothing else in the codebase should hardcode `.claude/`,
 * `CLAUDE.md`, or filenames inside `.claude/`. Use these helpers.
 */

import path from "node:path";

export const SPEC_VERSION = "1.0.0";

export const CLAUDE_DIR = ".claude";
export const PROJECT_INSTRUCTIONS = "CLAUDE.md";
export const LOCAL_INSTRUCTIONS = "CLAUDE.local.md";
export const APPLIED_MARKER = ".scout-applied";

export const PROJECT_FILES = [
  PROJECT_INSTRUCTIONS,
  LOCAL_INSTRUCTIONS,
] as const;

export const MANAGED_DIRS = [
  "skills",
  "rules",
  "commands",
  "agents",
] as const;

export const MANAGED_SETTINGS = [
  "settings.json",
  "settings.local.json",
] as const;

export const IGNORED_IN_CLAUDE_DIR = new Set([
  "memory",
  "MEMORY.md",
  "history.json",
  "projects",
  "shell-snapshots",
  "todos",
  "statsig",
  "ide",
]);

export const SKILL_FILE = "SKILL.md";
export const SKILL_FRONTMATTER_REQUIRED = ["name", "description"] as const;

export const SCAN_GLOB_PATTERNS = [
  `**/${PROJECT_INSTRUCTIONS}`,
  `**/${CLAUDE_DIR}/**/${SKILL_FILE}`,
  `**/${CLAUDE_DIR}/rules/**/*.md`,
  `**/${CLAUDE_DIR}/commands/**/*.md`,
] as const;

export const SCAN_DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.cache/**",
  "**/Library/**",
  "**/AppData/**",
  `**/${CLAUDE_DIR}/memory/**`,
  `**/${CLAUDE_DIR}/projects/**`,
  `**/${CLAUDE_DIR}/shell-snapshots/**`,
  `**/${CLAUDE_DIR}/todos/**`,
] as const;

export type ArtifactKind =
  | "instructions"
  | "local-instructions"
  | "skill"
  | "rule"
  | "command"
  | "agent"
  | "settings"
  | "unknown";

export type ArtifactScope = "project" | "global" | "local";

export interface ClaudeArtifact {
  kind: ArtifactKind;
  scope: ArtifactScope;
  absolutePath: string;
  relativePath: string;
}

export function projectClaudeDir(projectRoot: string): string {
  return path.join(projectRoot, CLAUDE_DIR);
}

export function projectInstructionsPath(projectRoot: string): string {
  return path.join(projectRoot, PROJECT_INSTRUCTIONS);
}

export function appliedMarkerPath(projectRoot: string): string {
  return path.join(projectRoot, APPLIED_MARKER);
}

export function isManagedDir(name: string): boolean {
  return (MANAGED_DIRS as readonly string[]).includes(name);
}

export function isManagedSettingsFile(name: string): boolean {
  return (MANAGED_SETTINGS as readonly string[]).includes(name);
}

export function isIgnoredInClaudeDir(name: string): boolean {
  return IGNORED_IN_CLAUDE_DIR.has(name);
}

export function classifyPath(
  absPath: string,
  homeDir: string
): ClaudeArtifact | null {
  const fileName = path.basename(absPath);
  const inHome = absPath.startsWith(path.join(homeDir, CLAUDE_DIR) + path.sep);
  const scope: ArtifactScope = inHome ? "global" : "project";

  if (fileName === PROJECT_INSTRUCTIONS) {
    return artifact("instructions", scope, absPath, homeDir);
  }
  if (fileName === LOCAL_INSTRUCTIONS) {
    return artifact("local-instructions", "local", absPath, homeDir);
  }
  if (fileName === SKILL_FILE) {
    return artifact("skill", scope, absPath, homeDir);
  }

  const segments = absPath.split(path.sep);
  const claudeIdx = segments.lastIndexOf(CLAUDE_DIR);
  if (claudeIdx === -1) return null;
  const sub = segments[claudeIdx + 1];
  if (!sub) return null;

  if (isIgnoredInClaudeDir(sub)) return null;
  if (sub === "rules") return artifact("rule", scope, absPath, homeDir);
  if (sub === "commands") return artifact("command", scope, absPath, homeDir);
  if (sub === "agents") return artifact("agent", scope, absPath, homeDir);
  if (isManagedSettingsFile(fileName)) {
    return artifact("settings", scope, absPath, homeDir);
  }

  return artifact("unknown", scope, absPath, homeDir);
}

function artifact(
  kind: ArtifactKind,
  scope: ArtifactScope,
  absPath: string,
  homeDir: string
): ClaudeArtifact {
  return {
    kind,
    scope,
    absolutePath: absPath,
    relativePath: path.relative(homeDir, absPath),
  };
}

/**
 * Items copied/managed by `scout use <preset>`. Anything not listed here
 * is left untouched in the target directory.
 */
export function presetManagedEntries(): string[] {
  return [
    PROJECT_INSTRUCTIONS,
    ...MANAGED_DIRS.map((d) => path.posix.join(CLAUDE_DIR, d)),
    ...MANAGED_SETTINGS.map((f) => path.posix.join(CLAUDE_DIR, f)),
  ];
}

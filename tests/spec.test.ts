import { describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {
  classifyPath,
  isIgnoredInClaudeDir,
  isManagedDir,
  presetManagedEntries,
  CLAUDE_DIR,
  PROJECT_INSTRUCTIONS,
} from "../src/spec/claude.ts";

describe("claude spec", () => {
  it("classifies project CLAUDE.md as instructions/project", () => {
    const home = os.homedir();
    const r = classifyPath(`/proj/${PROJECT_INSTRUCTIONS}`, home);
    assert.equal(r?.kind, "instructions");
    assert.equal(r?.scope, "project");
  });

  it("classifies global CLAUDE.md as instructions/global", () => {
    const home = "/home/u";
    const r = classifyPath(path.join(home, CLAUDE_DIR, "CLAUDE.md"), home);
    assert.equal(r?.kind, "instructions");
    assert.equal(r?.scope, "global");
  });

  it("classifies SKILL.md correctly", () => {
    const home = "/home/u";
    const r = classifyPath(
      `/proj/${CLAUDE_DIR}/skills/foo/SKILL.md`,
      home
    );
    assert.equal(r?.kind, "skill");
    assert.equal(r?.scope, "project");
  });

  it("classifies rule under .claude/rules/", () => {
    const home = "/home/u";
    const r = classifyPath(`/proj/${CLAUDE_DIR}/rules/python.md`, home);
    assert.equal(r?.kind, "rule");
  });

  it("ignores memory/projects directories", () => {
    assert.equal(isIgnoredInClaudeDir("memory"), true);
    assert.equal(isIgnoredInClaudeDir("projects"), true);
    assert.equal(isIgnoredInClaudeDir("skills"), false);
  });

  it("recognizes managed dirs", () => {
    assert.equal(isManagedDir("skills"), true);
    assert.equal(isManagedDir("rules"), true);
    assert.equal(isManagedDir("memory"), false);
  });

  it("preset managed entries cover instructions + .claude subdirs", () => {
    const entries = presetManagedEntries();
    assert.ok(entries.includes(PROJECT_INSTRUCTIONS));
    assert.ok(entries.some((e) => e.includes("skills")));
    assert.ok(entries.some((e) => e.includes("rules")));
  });
});

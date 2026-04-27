import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  savePreset,
  deletePreset,
  presetExists,
  validatePresetName,
  listPresetDirs,
} from "../src/core/preset-manager.ts";
import { listPresets } from "../src/core/registry.ts";
import { makeSandbox, writeFile, exists, type SandboxCtx } from "./_helpers.ts";

let ctx: SandboxCtx;

beforeEach(async () => {
  ctx = await makeSandbox();
});
afterEach(async () => {
  await ctx.cleanup();
});

describe("preset-manager", () => {
  it("rejects invalid preset names", () => {
    assert.throws(() => validatePresetName(""), /invalid preset name/);
    assert.throws(() => validatePresetName("has spaces"), /invalid preset name/);
    assert.throws(() => validatePresetName("../etc"), /invalid preset name/);
  });

  it("accepts valid preset names", () => {
    validatePresetName("backend-typescript");
    validatePresetName("python_data");
    validatePresetName("v1.0");
  });

  it("save fails when CLAUDE.md is missing", async () => {
    await assert.rejects(
      () => savePreset(ctx.projectRoot, "test"),
      /no CLAUDE\.md/
    );
  });

  it("saves a preset with CLAUDE.md only", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# project rules\n");
    const meta = await savePreset(ctx.projectRoot, "minimal");
    assert.equal(meta.name, "minimal");
    assert.equal(meta.skills.length, 0);
    assert.ok(await presetExists("minimal"));
    assert.ok(
      await exists(path.join(ctx.scoutHome, "presets", "minimal", "CLAUDE.md"))
    );
  });

  it("saves a preset with skills and detects skill names", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# rules\n");
    await writeFile(
      ctx.projectRoot,
      ".claude/skills/test-runner/SKILL.md",
      "---\nname: test-runner\ndescription: runs tests\n---\nbody"
    );
    await writeFile(
      ctx.projectRoot,
      ".claude/skills/docker-dev/SKILL.md",
      "---\nname: docker-dev\ndescription: docker workflows\n---\nbody"
    );
    const meta = await savePreset(ctx.projectRoot, "backend");
    assert.deepEqual(
      meta.skills.sort(),
      ["docker-dev", "test-runner"]
    );
  });

  it("save refuses to overwrite without flag", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# v1\n");
    await savePreset(ctx.projectRoot, "p");
    await assert.rejects(
      () => savePreset(ctx.projectRoot, "p"),
      /already exists/
    );
  });

  it("save with overwrite replaces existing", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# v1\n");
    await savePreset(ctx.projectRoot, "p");
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# v2\n");
    await savePreset(ctx.projectRoot, "p", { overwrite: true });
    const list = await listPresets();
    assert.equal(list.length, 1);
  });

  it("save skips ignored directories like memory/", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# rules\n");
    await writeFile(ctx.projectRoot, ".claude/memory/note.md", "secret");
    await writeFile(
      ctx.projectRoot,
      ".claude/skills/foo/SKILL.md",
      "---\nname: foo\ndescription: x\n---"
    );
    await savePreset(ctx.projectRoot, "p");
    const memInPreset = path.join(
      ctx.scoutHome,
      "presets",
      "p",
      ".claude",
      "memory",
      "note.md"
    );
    assert.equal(await exists(memInPreset), false);
  });

  it("delete removes preset directory and registry entry", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# rules\n");
    await savePreset(ctx.projectRoot, "to-delete");
    const removed = await deletePreset("to-delete");
    assert.equal(removed, true);
    assert.equal(await presetExists("to-delete"), false);
    const list = await listPresets();
    assert.equal(list.length, 0);
  });

  it("listPresetDirs returns empty when home is fresh", async () => {
    const dirs = await listPresetDirs();
    assert.deepEqual(dirs, []);
  });
});

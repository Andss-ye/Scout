import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { savePreset } from "../src/core/preset-manager.ts";
import { listPresets, upsertPreset } from "../src/core/registry.ts";
import { clean, formatBytes } from "../src/core/cleaner.ts";
import { makeSandbox, writeFile, exists, type SandboxCtx } from "./_helpers.ts";

let ctx: SandboxCtx;

beforeEach(async () => {
  ctx = await makeSandbox();
});
afterEach(async () => {
  await ctx.cleanup();
});

describe("cleaner", () => {
  it("formatBytes handles ranges", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(1500), "1.5 KB");
    assert.equal(formatBytes(2 * 1024 * 1024), "2.00 MB");
  });

  it("clean --cache removes the scan cache file only", async () => {
    const cache = path.join(ctx.scoutHome, "scan-cache.json");
    await fs.writeFile(cache, "{}");
    const result = await clean({ cache: true });
    assert.equal(await exists(cache), false);
    assert.ok(result.removed.includes(cache));
  });

  it("clean --orphans removes registry entries with no dir", async () => {
    await upsertPreset({
      name: "ghost",
      createdAt: "x",
      updatedAt: "x",
      tags: [],
      skills: [],
    });
    const result = await clean({ orphans: true });
    assert.ok(result.removed.some((r) => r === "registry:ghost"));
    const remaining = await listPresets();
    assert.equal(remaining.length, 0);
  });

  it("clean --orphans removes preset dirs not in registry", async () => {
    const orphanDir = path.join(ctx.scoutHome, "presets", "rogue");
    await fs.mkdir(orphanDir, { recursive: true });
    await fs.writeFile(path.join(orphanDir, "CLAUDE.md"), "x");
    const result = await clean({ orphans: true });
    assert.ok(result.removed.includes(orphanDir));
    assert.equal(await exists(orphanDir), false);
  });

  it("clean --preset removes a single preset", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# x\n");
    await savePreset(ctx.projectRoot, "to-clean");
    const result = await clean({ preset: "to-clean" });
    assert.ok(
      result.removed.some((r) => r.endsWith("to-clean")),
      `removed: ${JSON.stringify(result.removed)}`
    );
    assert.equal((await listPresets()).length, 0);
  });

  it("clean --all wipes scout home", async () => {
    await writeFile(ctx.projectRoot, "CLAUDE.md", "# x\n");
    await savePreset(ctx.projectRoot, "anything");
    const result = await clean({ all: true });
    assert.ok(result.removed.includes(ctx.scoutHome));
    assert.equal(await exists(ctx.scoutHome), false);
  });

  it("clean --dry-run reports without deleting", async () => {
    const cache = path.join(ctx.scoutHome, "scan-cache.json");
    await fs.writeFile(cache, "{}");
    const result = await clean({ cache: true, dryRun: true });
    assert.ok(result.removed.includes(cache));
    assert.equal(await exists(cache), true);
  });
});

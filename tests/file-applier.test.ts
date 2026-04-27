import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { savePreset } from "../src/core/preset-manager.ts";
import {
  applyPreset,
  readMarker,
} from "../src/core/file-applier.ts";
import { makeSandbox, writeFile, exists, read, type SandboxCtx } from "./_helpers.ts";

let ctx: SandboxCtx;

async function seedPreset(name: string): Promise<string> {
  const tmpProject = path.join(ctx.projectRoot, "_seed");
  await writeFile(tmpProject, "CLAUDE.md", "# preset rules\n");
  await writeFile(
    tmpProject,
    ".claude/skills/runner/SKILL.md",
    "---\nname: runner\ndescription: test runner\n---\n"
  );
  await writeFile(tmpProject, ".claude/settings.json", '{"a":1}');
  await savePreset(tmpProject, name);
  return tmpProject;
}

beforeEach(async () => {
  ctx = await makeSandbox();
});
afterEach(async () => {
  await ctx.cleanup();
});

describe("file-applier", () => {
  it("apply throws when preset does not exist", async () => {
    await assert.rejects(
      () => applyPreset("nope", ctx.projectRoot),
      /not found/
    );
  });

  it("apply copies preset files to target", async () => {
    await seedPreset("backend");
    const target = path.join(ctx.projectRoot, "fresh");
    await import("node:fs/promises").then((m) => m.mkdir(target));
    const result = await applyPreset("backend", target);
    assert.ok(result.written.length >= 3);
    assert.equal(
      await read(path.join(target, "CLAUDE.md")),
      "# preset rules\n"
    );
    assert.ok(
      await exists(path.join(target, ".claude/skills/runner/SKILL.md"))
    );
    assert.ok(await exists(path.join(target, ".claude/settings.json")));
  });

  it("apply writes .scout-applied marker", async () => {
    await seedPreset("p");
    const target = path.join(ctx.projectRoot, "t");
    await import("node:fs/promises").then((m) => m.mkdir(target));
    await applyPreset("p", target);
    const marker = await readMarker(target);
    assert.equal(marker?.preset, "p");
    assert.equal(typeof marker?.appliedAt, "string");
  });

  it("apply --merge does not overwrite existing files", async () => {
    await seedPreset("p");
    const target = path.join(ctx.projectRoot, "t");
    await writeFile(target, "CLAUDE.md", "# my own\n");
    const result = await applyPreset("p", target, { merge: true });
    assert.equal(await read(path.join(target, "CLAUDE.md")), "# my own\n");
    assert.ok(result.skipped.some((s) => s.endsWith("CLAUDE.md")));
  });

  it("apply --dry-run writes nothing but reports targets", async () => {
    await seedPreset("p");
    const target = path.join(ctx.projectRoot, "t");
    await import("node:fs/promises").then((m) => m.mkdir(target));
    const result = await applyPreset("p", target, { dryRun: true });
    assert.ok(result.wouldWrite.length > 0);
    assert.equal(await exists(path.join(target, "CLAUDE.md")), false);
    assert.equal(await exists(path.join(target, ".scout-applied")), false);
  });

  it("apply default overwrites existing files", async () => {
    await seedPreset("p");
    const target = path.join(ctx.projectRoot, "t");
    await writeFile(target, "CLAUDE.md", "# old\n");
    await applyPreset("p", target);
    assert.equal(
      await read(path.join(target, "CLAUDE.md")),
      "# preset rules\n"
    );
  });
});

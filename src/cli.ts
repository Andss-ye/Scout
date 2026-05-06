#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { runSave } from "./commands/save.js";
import { runUse } from "./commands/use.js";
import { runList } from "./commands/list.js";
import { runClean } from "./commands/clean.js";

const program = new Command();

program
  .name("scout")
  .description("Manage, version, and apply Claude Code config presets per project")
  .version("0.1.0");

program
  .command("save <name>")
  .description("Snapshot the current .claude/ + CLAUDE.md as a preset")
  .option("-d, --description <text>", "preset description")
  .option("-t, --tags <list>", "comma-separated tags")
  .option("--overwrite", "overwrite existing preset with same name")
  .action(wrap(runSave));

program
  .command("use <preset>")
  .description("Apply a preset to the current directory")
  .option("--merge", "do not overwrite existing files, only add missing")
  .option("--dry-run", "print what would be written without writing")
  .option("--force", "skip confirmations")
  .action(wrap(runUse));

program
  .command("list")
  .description("List available presets")
  .option("--json", "output as JSON")
  .action(wrap(runList));

program
  .command("clean")
  .description("Remove cached/unused scout data")
  .option("--cache", "delete ~/.scout/scan-cache.json produced by `scout scan`")
  .option("--orphans", "delete preset dirs with no registry entry and registry entries pointing to missing dirs")
  .option("--preset <name>", "delete the named preset and remove it from the registry")
  .option("--all", "wipe ~/.scout entirely — all presets, the registry, and the scan cache")
  .option("--dry-run", "preview what would be deleted without actually deleting anything")
  .action(wrap(runClean));

program.parseAsync().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(chalk.red(`error: ${msg}\n`));
  process.exit(1);
});

type AsyncFn<A extends unknown[]> = (...args: A) => Promise<void>;

function wrap<A extends unknown[]>(fn: AsyncFn<A>): AsyncFn<A> {
  return async (...args: A) => {
    try {
      await fn(...args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(chalk.red(`error: ${msg}\n`));
      process.exit(1);
    }
  };
}

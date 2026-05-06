import chalk from "chalk";
import { clean, formatBytes } from "../core/cleaner.js";

export interface CleanCommandOptions {
  cache?: boolean;
  orphans?: boolean;
  preset?: string;
  all?: boolean;
  dryRun?: boolean;
}

export async function runClean(options: CleanCommandOptions): Promise<void> {
  const anyFlag = options.cache || options.orphans || options.preset || options.all;
  if (!anyFlag) {
    process.stderr.write(
      chalk.yellow("nothing to clean. pass one of:\n") +
        "  --cache           delete ~/.scout/scan-cache.json produced by `scout scan`\n" +
        "  --orphans         delete preset dirs with no registry entry and registry entries pointing to missing dirs\n" +
        "  --preset <name>   delete the named preset and remove it from the registry\n" +
        "  --all             wipe ~/.scout entirely — all presets, the registry, and the scan cache\n" +
        "  --dry-run         preview what would be deleted without actually deleting anything\n"
    );
    process.exit(1);
  }

  const result = await clean(options);

  if (result.removed.length === 0) {
    process.stdout.write(chalk.gray("nothing to clean.\n"));
    return;
  }

  const verb = options.dryRun ? "would remove" : "removed";
  process.stdout.write(
    `${chalk.green("✓")} ${verb} ${result.removed.length} item(s) ` +
      chalk.gray(`(${formatBytes(result.freedBytes)})\n`)
  );
  for (const r of result.removed) {
    process.stdout.write(`  ${chalk.gray("-")} ${r}\n`);
  }
}

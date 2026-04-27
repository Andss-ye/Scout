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
        "  --cache         remove scan cache\n" +
        "  --orphans       remove preset dirs/registry entries that are out of sync\n" +
        "  --preset <name> remove a single preset\n" +
        "  --all           remove ~/.scout entirely\n"
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

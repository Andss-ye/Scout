import chalk from "chalk";
import path from "node:path";
import { applyPreset } from "../core/file-applier.js";

export interface UseCommandOptions {
  merge?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

export async function runUse(
  presetName: string,
  options: UseCommandOptions
): Promise<void> {
  const result = await applyPreset(presetName, process.cwd(), options);

  if (options.dryRun) {
    process.stdout.write(chalk.yellow("dry-run — nothing was written\n"));
    for (const f of result.wouldWrite) {
      process.stdout.write(`  ${chalk.gray("+")} ${rel(f)}\n`);
    }
    return;
  }
  process.stdout.write(
    `${chalk.green("✓")} applied ${chalk.bold(presetName)} ` +
      `(${result.written.length} file(s)` +
      (result.skipped.length ? `, ${result.skipped.length} skipped` : "") +
      ")\n"
  );
}

function rel(p: string): string {
  return path.relative(process.cwd(), p);
}

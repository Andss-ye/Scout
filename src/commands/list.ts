import chalk from "chalk";
import { listPresets } from "../core/registry.js";

export interface ListCommandOptions {
  json?: boolean;
}

export async function runList(options: ListCommandOptions): Promise<void> {
  const presets = await listPresets();

  if (options.json) {
    process.stdout.write(JSON.stringify(presets, null, 2) + "\n");
    return;
  }

  if (presets.length === 0) {
    process.stdout.write(
      chalk.gray("no presets yet. run ") +
        chalk.bold("scout save <name>") +
        chalk.gray(" inside a project with a CLAUDE.md.\n")
    );
    return;
  }

  const nameW = Math.max(4, ...presets.map((p) => p.name.length));
  const header =
    chalk.dim("name".padEnd(nameW)) +
    chalk.dim("  skills  description") +
    "\n";
  process.stdout.write(header);

  for (const p of presets) {
    const skills = String(p.skills.length).padStart(6);
    const desc = p.description ?? chalk.gray("(no description)");
    process.stdout.write(
      `${chalk.bold(p.name.padEnd(nameW))}  ${skills}  ${desc}\n`
    );
  }
}

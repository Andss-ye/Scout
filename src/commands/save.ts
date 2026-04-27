import chalk from "chalk";
import { savePreset } from "../core/preset-manager.js";

export interface SaveCommandOptions {
  description?: string;
  tags?: string;
  overwrite?: boolean;
}

export async function runSave(
  name: string,
  options: SaveCommandOptions
): Promise<void> {
  const tags =
    options.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const meta = await savePreset(process.cwd(), name, {
    description: options.description,
    tags,
    overwrite: options.overwrite,
  });
  process.stdout.write(
    `${chalk.green("✓")} saved preset ${chalk.bold(meta.name)}` +
      (meta.skills.length ? ` (${meta.skills.length} skill(s))` : "") +
      "\n"
  );
}

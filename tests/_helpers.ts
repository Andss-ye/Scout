import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface SandboxCtx {
  scoutHome: string;
  projectRoot: string;
  cleanup: () => Promise<void>;
}

export async function makeSandbox(): Promise<SandboxCtx> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scout-test-"));
  const scoutHome = path.join(tmp, ".scout");
  const projectRoot = path.join(tmp, "project");
  await fs.mkdir(scoutHome, { recursive: true });
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.SCOUT_HOME = scoutHome;

  return {
    scoutHome,
    projectRoot,
    cleanup: async () => {
      delete process.env.SCOUT_HOME;
      await fs.rm(tmp, { recursive: true, force: true });
    },
  };
}

export async function writeFile(
  root: string,
  relPath: string,
  content: string
): Promise<void> {
  const full = path.join(root, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function read(p: string): Promise<string> {
  return fs.readFile(p, "utf8");
}

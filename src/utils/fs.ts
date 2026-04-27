import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";

const STREAM_THRESHOLD_BYTES = 256 * 1024;

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

export async function readJsonOr<T>(p: string, fallback: T): Promise<T> {
  try {
    return await readJson<T>(p);
  } catch (err) {
    if (isNotFound(err)) return fallback;
    throw err;
  }
}

export async function writeJson(p: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(p));
  const tmp = `${p}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, p);
}

/**
 * Copy a file, streaming if larger than threshold to keep memory bounded.
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  const stat = await fs.stat(src);
  if (stat.size > STREAM_THRESHOLD_BYTES) {
    await pipeline(createReadStream(src), createWriteStream(dest));
    return;
  }
  await fs.copyFile(src, dest);
}

/**
 * Recursively copy a directory. Streams large files. Skips ignored entries.
 */
export async function copyDir(
  src: string,
  dest: string,
  options: { skip?: (entryName: string) => boolean; merge?: boolean } = {}
): Promise<{ written: string[]; skipped: string[] }> {
  const written: string[] = [];
  const skipped: string[] = [];
  await walk(src, dest);
  return { written, skipped };

  async function walk(from: string, to: string): Promise<void> {
    const entries = await fs.readdir(from, { withFileTypes: true });
    if (entries.length === 0) {
      await ensureDir(to);
      return;
    }
    await ensureDir(to);
    for (const entry of entries) {
      if (options.skip?.(entry.name)) continue;
      const fromPath = path.join(from, entry.name);
      const toPath = path.join(to, entry.name);
      if (entry.isDirectory()) {
        await walk(fromPath, toPath);
      } else if (entry.isFile()) {
        if (options.merge && (await exists(toPath))) {
          skipped.push(toPath);
          continue;
        }
        await copyFile(fromPath, toPath);
        written.push(toPath);
      }
    }
  }
}

export async function rmrf(p: string): Promise<void> {
  await fs.rm(p, { recursive: true, force: true });
}

export async function dirSize(dir: string): Promise<number> {
  let total = 0;
  await walk(dir);
  return total;

  async function walk(d: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
      } else if (entry.isFile()) {
        try {
          const s = await fs.stat(p);
          total += s.size;
        } catch {
          /* ignore unreadable */
        }
      }
    }
  }
}

export function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}

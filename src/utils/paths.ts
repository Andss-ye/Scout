import os from "node:os";
import path from "node:path";

const SCOUT_HOME_ENV = "SCOUT_HOME";

export function scoutHome(): string {
  const override = process.env[SCOUT_HOME_ENV];
  if (override && override.length > 0) return override;
  return path.join(os.homedir(), ".scout");
}

export function presetsDir(): string {
  return path.join(scoutHome(), "presets");
}

export function presetDir(name: string): string {
  return path.join(presetsDir(), name);
}

export function registryPath(): string {
  return path.join(scoutHome(), "registry.json");
}

export function scanCachePath(): string {
  return path.join(scoutHome(), "scan-cache.json");
}

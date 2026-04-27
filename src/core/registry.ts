import type { PresetMetadata, Registry } from "../types/index.js";
import { readJsonOr, writeJson } from "../utils/fs.js";
import { registryPath } from "../utils/paths.js";

const REGISTRY_VERSION = "1";

export async function loadRegistry(): Promise<Registry> {
  return readJsonOr<Registry>(registryPath(), {
    version: REGISTRY_VERSION,
    presets: {},
  });
}

export async function saveRegistry(reg: Registry): Promise<void> {
  await writeJson(registryPath(), reg);
}

export async function upsertPreset(meta: PresetMetadata): Promise<void> {
  const reg = await loadRegistry();
  reg.presets[meta.name] = meta;
  await saveRegistry(reg);
}

export async function removePreset(name: string): Promise<boolean> {
  const reg = await loadRegistry();
  if (!(name in reg.presets)) return false;
  delete reg.presets[name];
  await saveRegistry(reg);
  return true;
}

export async function getPreset(
  name: string
): Promise<PresetMetadata | null> {
  const reg = await loadRegistry();
  return reg.presets[name] ?? null;
}

export async function listPresets(): Promise<PresetMetadata[]> {
  const reg = await loadRegistry();
  return Object.values(reg.presets).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

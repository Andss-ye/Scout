export interface PresetMetadata {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  skills: string[];
}

export interface Registry {
  version: string;
  presets: Record<string, PresetMetadata>;
}

export interface AppliedMarker {
  preset: string;
  appliedAt: string;
  merge: boolean;
  scoutVersion: string;
}

export interface ApplyOptions {
  merge?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

export interface ApplyResult {
  written: string[];
  skipped: string[];
  wouldWrite: string[];
}

export interface SaveOptions {
  description?: string;
  tags?: string[];
  overwrite?: boolean;
}

export interface CleanOptions {
  cache?: boolean;
  orphans?: boolean;
  preset?: string;
  all?: boolean;
  dryRun?: boolean;
}

export interface CleanResult {
  removed: string[];
  freedBytes: number;
}

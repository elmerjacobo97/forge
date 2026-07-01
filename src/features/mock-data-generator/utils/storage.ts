import { BUILTIN_PRESETS } from "./presets";
import type { Preset, Schema } from "./types";

const PRESETS_KEY = "forge_mock-data-generator_presets:v1";
const SCHEMA_KEY = "forge_mock-data-generator_schema:v1";
const MAX_USER_PRESETS = 50;

export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [...BUILTIN_PRESETS];
    const parsed = JSON.parse(raw) as Preset[];
    return [...BUILTIN_PRESETS, ...parsed];
  } catch {
    return [...BUILTIN_PRESETS];
  }
}

function loadUserPresetsRaw(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

function saveUserPresets(presets: Preset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function savePreset(preset: Preset): void {
  const userPresets = loadUserPresetsRaw();
  const capped = [preset, ...userPresets].slice(0, MAX_USER_PRESETS);
  saveUserPresets(capped);
}

export function deletePreset(id: string): void {
  const userPresets = loadUserPresetsRaw();
  saveUserPresets(userPresets.filter((p) => p.id !== id));
}

export function loadCurrentSchema(): Schema | null {
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Schema;
  } catch {
    return null;
  }
}

export function saveCurrentSchema(schema: Schema): void {
  localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
}

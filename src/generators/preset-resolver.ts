export type PresetName = 'solo' | 'solo-full-auto' | 'team';

export interface PresetConfig {
  downstream: string;
  R8_actor: string;
  auto_merge: boolean;
}

const PRESETS: Record<PresetName, PresetConfig> = {
  solo: {
    downstream: 'approve-only',
    R8_actor: 'human',
    auto_merge: true,
  },
  'solo-full-auto': {
    downstream: 'full-auto',
    R8_actor: 'skip',
    auto_merge: true,
  },
  team: {
    downstream: 'review-and-approve',
    R8_actor: 'human',
    auto_merge: true,
  },
};

export function resolvePreset(name: string): PresetConfig {
  const preset = PRESETS[name as PresetName];
  if (!preset) throw new Error(`Unknown preset: ${name}. Valid: ${Object.keys(PRESETS).join(', ')}`);
  return preset;
}

export function getPresetNames(): PresetName[] {
  return Object.keys(PRESETS) as PresetName[];
}

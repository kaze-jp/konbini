export type PresetName = 'solo' | 'solo-full-auto' | 'team' | 'custom';

export interface PresetConfig {
  downstream: string;
  R8_actor: string;
  auto_merge: boolean;
}

export interface InitConfig {
  preset: PresetName;
  baseBranch: string;
  downstream: string;
  R8Actor: string;
  autoMerge: boolean;
  gitStrategy: string;
}

const PRESETS: Record<Exclude<PresetName, 'custom'>, PresetConfig> = {
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

const DEFAULTS: Omit<InitConfig, 'preset'> = {
  baseBranch: 'main',
  downstream: 'approve-only',
  R8Actor: 'human',
  autoMerge: true,
  gitStrategy: 'worktree',
};

export function resolvePreset(name: string): PresetConfig {
  if (name === 'custom') {
    return { downstream: DEFAULTS.downstream, R8_actor: DEFAULTS.R8Actor, auto_merge: DEFAULTS.autoMerge };
  }
  const preset = PRESETS[name as Exclude<PresetName, 'custom'>];
  if (!preset) throw new Error(`Unknown preset: ${name}. Valid: ${Object.keys(PRESETS).join(', ')}, custom`);
  return preset;
}

export function getPresetNames(): PresetName[] {
  return [...Object.keys(PRESETS), 'custom'] as PresetName[];
}

export function buildInitConfig(
  presetName: string,
  overrides: Partial<Omit<InitConfig, 'preset'>> = {},
): InitConfig {
  const preset = presetName === 'custom' ? null : PRESETS[presetName as Exclude<PresetName, 'custom'>];

  return {
    preset: presetName as PresetName,
    baseBranch: overrides.baseBranch ?? DEFAULTS.baseBranch,
    downstream: overrides.downstream ?? preset?.downstream ?? DEFAULTS.downstream,
    R8Actor: overrides.R8Actor ?? preset?.R8_actor ?? DEFAULTS.R8Actor,
    autoMerge: overrides.autoMerge ?? preset?.auto_merge ?? DEFAULTS.autoMerge,
    gitStrategy: overrides.gitStrategy ?? DEFAULTS.gitStrategy,
  };
}

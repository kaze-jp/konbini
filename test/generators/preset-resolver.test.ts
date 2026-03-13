import { describe, it, expect } from 'vitest';
import { resolvePreset, getPresetNames, buildInitConfig } from '../../src/generators/preset-resolver.js';

describe('preset-resolver', () => {
  it('resolves solo preset', () => {
    const config = resolvePreset('solo');
    expect(config.downstream).toBe('approve-only');
  });

  it('getPresetNames includes custom', () => {
    expect(getPresetNames()).toContain('custom');
  });

  it('buildInitConfig merges preset defaults with overrides', () => {
    const config = buildInitConfig('solo', { baseBranch: 'develop' });
    expect(config.preset).toBe('solo');
    expect(config.baseBranch).toBe('develop');
    expect(config.downstream).toBe('approve-only');
    expect(config.gitStrategy).toBe('worktree');
  });

  it('buildInitConfig for custom uses provided values', () => {
    const config = buildInitConfig('custom', {
      baseBranch: 'main',
      downstream: 'full-auto',
      autoMerge: false,
      R8Actor: 'skip',
      gitStrategy: 'branch',
    });
    expect(config.downstream).toBe('full-auto');
    expect(config.autoMerge).toBe(false);
    expect(config.gitStrategy).toBe('branch');
  });
});

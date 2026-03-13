import { describe, it, expect } from 'vitest';
import { resolvePreset } from '../../src/generators/preset-resolver.js';

describe('resolvePreset', () => {
  it('resolves solo preset', () => {
    const config = resolvePreset('solo');
    expect(config.downstream).toBe('approve-only');
    expect(config.R8_actor).toBe('human');
  });

  it('resolves solo-full-auto preset', () => {
    const config = resolvePreset('solo-full-auto');
    expect(config.downstream).toBe('full-auto');
    expect(config.R8_actor).toBe('skip');
  });

  it('resolves team preset', () => {
    const config = resolvePreset('team');
    expect(config.downstream).toBe('review-and-approve');
    expect(config.R8_actor).toBe('human');
  });
});

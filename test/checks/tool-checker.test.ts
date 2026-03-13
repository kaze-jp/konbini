import { describe, it, expect } from 'vitest';
import { checkTool } from '../../src/checks/tool-checker.js';

describe('checkTool', () => {
  it('returns true for available tools', async () => {
    const result = await checkTool('git');
    expect(result.available).toBe(true);
  });

  it('returns false for unavailable tools', async () => {
    const result = await checkTool('nonexistent-tool-xyz');
    expect(result.available).toBe(false);
  });
});

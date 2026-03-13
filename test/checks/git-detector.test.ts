import { describe, it, expect, vi } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { detectBaseBranch } from '../../src/checks/git-detector.js';

describe('detectBaseBranch', () => {
  it('parses origin/main from symbolic-ref output', () => {
    vi.mocked(execSync).mockReturnValue('refs/remotes/origin/main\n');
    expect(detectBaseBranch()).toBe('main');
  });

  it('parses origin/develop', () => {
    vi.mocked(execSync).mockReturnValue('refs/remotes/origin/develop\n');
    expect(detectBaseBranch()).toBe('develop');
  });

  it('falls back to main on error', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
    expect(detectBaseBranch()).toBe('main');
  });
});

import { describe, it, expect } from 'vitest';
import { checkPreCommitHooks } from '../../src/checks/hooks-checker.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('checkPreCommitHooks', () => {
  it('returns false when no hooks directory exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-test-'));
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
    const result = checkPreCommitHooks(tmpDir);
    expect(result.hasHooks).toBe(false);
    fs.rmSync(tmpDir, { recursive: true });
  });
});

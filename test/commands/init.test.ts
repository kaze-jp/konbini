import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(__dirname, '../fixtures/templates');

vi.mock('../../src/utils/paths.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/paths.js')>();
  return {
    ...actual,
    getTemplatePath: (rel: string) => path.join(fixtureDir, rel),
  };
});

describe('init command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-init-'));
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('generates expected directory structure', async () => {
    const { initProject } = await import('../../src/commands/init.js');
    await initProject(tmpDir, 'solo');
    expect(fs.existsSync(path.join(tmpDir, '.ao', 'ao.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'orchestrator.md'))).toBe(true);
  });
});

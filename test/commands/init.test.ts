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

import { copyTemplates } from '../../src/generators/template-copier.js';
import { buildInitConfig } from '../../src/generators/preset-resolver.js';

describe('copyTemplates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-init-'));
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('generates ao.yaml with correct values', async () => {
    const config = buildInitConfig('solo', { baseBranch: 'develop' });
    await copyTemplates(tmpDir, config);

    const aoYaml = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(aoYaml).toContain('preset: solo');
    expect(aoYaml).toContain('downstream: approve-only');
    expect(aoYaml).toContain('base_branch: develop');
    expect(aoYaml).toContain('git_strategy: worktree');
  });

  it('generates expected directory structure', async () => {
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await copyTemplates(tmpDir, config);
    expect(fs.existsSync(path.join(tmpDir, '.ao', 'ao.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'orchestrator.md'))).toBe(true);
  });
});

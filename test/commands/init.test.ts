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

vi.mock('../../src/generators/claude-md-injector.js', () => ({
  injectClaudeMd: vi.fn(),
  detectLanguage: vi.fn().mockReturnValue('en'),
  readClaudeMdConfig: vi.fn().mockReturnValue({ language: 'en', path: 'CLAUDE.md' }),
}));

import { copyTemplates } from '../../src/generators/template-copier.js';
import { buildInitConfig } from '../../src/generators/preset-resolver.js';

describe('init — copyTemplates', () => {
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

  it('leaves claude_md placeholders in ao.yaml for init.ts to resolve', async () => {
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await copyTemplates(tmpDir, config);
    const aoYaml = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(aoYaml).toContain('{{CLAUDE_MD_LANG}}');
    expect(aoYaml).toContain('{{CLAUDE_MD_PATH}}');
  });
});

describe('init — initProject', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-init-'));
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('writes claude_md config to ao.yaml', async () => {
    const { initProject } = await import('../../src/commands/init.js');
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await initProject(tmpDir, config, { language: 'en', path: 'CLAUDE.md' });
    const aoContent = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(aoContent).toContain('claude_md:');
    expect(aoContent).toContain('language: en');
    expect(aoContent).toContain('path: CLAUDE.md');
    expect(aoContent).not.toContain('{{CLAUDE_MD_LANG}}');
  });

  it('writes Japanese language choice to ao.yaml', async () => {
    const { initProject } = await import('../../src/commands/init.js');
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await initProject(tmpDir, config, { language: 'ja', path: 'CLAUDE.md' });
    const aoContent = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(aoContent).toContain('language: ja');
    expect(aoContent).not.toContain('language: en');
  });
});

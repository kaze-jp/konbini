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
import { parseInitFlags } from '../../src/commands/init.js';

describe('parseInitFlags', () => {
  it('returns defaults for empty args', () => {
    const flags = parseInitFlags([]);
    expect(flags).toEqual({ yes: false });
  });

  it('parses --yes flag', () => {
    const flags = parseInitFlags(['--yes']);
    expect(flags.yes).toBe(true);
  });

  it('parses -y shorthand', () => {
    const flags = parseInitFlags(['-y']);
    expect(flags.yes).toBe(true);
  });

  it('parses --preset with value', () => {
    const flags = parseInitFlags(['--preset', 'solo']);
    expect(flags.preset).toBe('solo');
  });

  it('parses --branch with value', () => {
    const flags = parseInitFlags(['--branch', 'develop']);
    expect(flags.branch).toBe('develop');
  });

  it('parses --lang with value', () => {
    const flags = parseInitFlags(['--lang', 'ja']);
    expect(flags.lang).toBe('ja');
  });

  it('parses --claude-md-path with value', () => {
    const flags = parseInitFlags(['--claude-md-path', 'docs/CLAUDE.md']);
    expect(flags.claudeMdPath).toBe('docs/CLAUDE.md');
  });

  it('parses all flags combined', () => {
    const flags = parseInitFlags([
      '--yes', '--preset', 'team', '--branch', 'main', '--lang', 'en', '--claude-md-path', 'CLAUDE.md',
    ]);
    expect(flags).toEqual({
      yes: true,
      preset: 'team',
      branch: 'main',
      lang: 'en',
      claudeMdPath: 'CLAUDE.md',
    });
  });

  it('ignores unknown flags', () => {
    const flags = parseInitFlags(['--unknown', 'value', '--yes']);
    expect(flags.yes).toBe(true);
    expect((flags as any).unknown).toBeUndefined();
  });
});

describe('runInit — non-interactive flags', () => {
  let tmpDir: string;
  let mockPrompter: { ask: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-init-'));
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
    mockPrompter = {
      ask: vi.fn().mockResolvedValue(''),
      close: vi.fn(),
    };
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
    exitSpy.mockRestore();
  });

  it('--yes skips all prompts', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter(['--yes'], mockPrompter, tmpDir);
    expect(mockPrompter.ask).not.toHaveBeenCalled();
  });

  it('--preset solo skips preset prompt but prompts for branch and lang', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter(['--preset', 'solo'], mockPrompter, tmpDir);
    const questions = mockPrompter.ask.mock.calls.map((c: string[]) => c[0]);
    expect(questions.some((q: string) => q.includes('Base branch'))).toBe(true);
    expect(questions.some((q: string) => q.includes('Select preset'))).toBe(false);
    expect(questions.some((q: string) => q.includes('Select language'))).toBe(true);
  });

  it('--preset invalid exits with code 1', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await expect(
      runInitWithPrompter(['--preset', 'invalid', '--yes'], mockPrompter, tmpDir)
    ).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('--lang invalid exits with code 1', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await expect(
      runInitWithPrompter(['--lang', 'fr', '--yes'], mockPrompter, tmpDir)
    ).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('--preset custom --yes uses default custom settings without prompting', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter(['--preset', 'custom', '--yes'], mockPrompter, tmpDir);
    expect(mockPrompter.ask).not.toHaveBeenCalled();
  });

  it('--preset custom without --yes prompts for custom settings', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter(['--preset', 'custom'], mockPrompter, tmpDir);
    const questions = mockPrompter.ask.mock.calls.map((c: string[]) => c[0]);
    expect(questions.some((q: string) => q.includes('downstream'))).toBe(true);
  });

  it('--branch "" falls back to auto-detected branch', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter(['--branch', '', '--yes'], mockPrompter, tmpDir);
    expect(mockPrompter.ask).not.toHaveBeenCalled();
  });

  it('no flags preserves full interactive behavior', async () => {
    const { runInitWithPrompter } = await import('../../src/commands/init.js');
    await runInitWithPrompter([], mockPrompter, tmpDir);
    // Should prompt for branch, preset, lang, and path (at least 4 calls)
    expect(mockPrompter.ask.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});

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

  it('leaves claude_md and language placeholders in ao.yaml for init.ts to resolve', async () => {
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await copyTemplates(tmpDir, config);
    const aoYaml = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(aoYaml).toContain('{{CLAUDE_MD_LANG}}');
    expect(aoYaml).toContain('{{CLAUDE_MD_PATH}}');
    expect(aoYaml).toContain('{{LANGUAGE}}');
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
  });

  it('writes top-level language field to ao.yaml', async () => {
    const { initProject } = await import('../../src/commands/init.js');
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await initProject(tmpDir, config, { language: 'ja', path: 'CLAUDE.md' });
    const aoContent = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    // Top-level language field should be set
    const lines = aoContent.split('\n');
    const topLevelLang = lines.find(l => /^language:\s/.test(l));
    expect(topLevelLang).toBeDefined();
    expect(topLevelLang).toContain('ja');
    // Placeholder should be resolved
    expect(aoContent).not.toContain('{{LANGUAGE}}');
  });

  it('sets top-level language to en by default', async () => {
    const { initProject } = await import('../../src/commands/init.js');
    const config = buildInitConfig('solo', { baseBranch: 'main' });
    await initProject(tmpDir, config, { language: 'en', path: 'CLAUDE.md' });
    const aoContent = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    const lines = aoContent.split('\n');
    const topLevelLang = lines.find(l => /^language:\s/.test(l));
    expect(topLevelLang).toBeDefined();
    expect(topLevelLang).toContain('en');
  });
});

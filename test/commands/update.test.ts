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

describe('update command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-update-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('updates agent files', async () => {
    const agentDir = path.join(tmpDir, '.claude', 'agents');
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(path.join(agentDir, 'orchestrator.md'), 'old content');

    const { updateProject } = await import('../../src/commands/update.js');
    await updateProject(tmpDir);
    const content = fs.readFileSync(path.join(agentDir, 'orchestrator.md'), 'utf-8');
    expect(content).not.toBe('old content');
  });

  it('preserves ao.yaml', async () => {
    const aoDir = path.join(tmpDir, '.ao');
    fs.mkdirSync(aoDir, { recursive: true });
    fs.writeFileSync(path.join(aoDir, 'ao.yaml'), 'custom: config');

    const { updateProject } = await import('../../src/commands/update.js');
    await updateProject(tmpDir);
    const content = fs.readFileSync(path.join(aoDir, 'ao.yaml'), 'utf-8');
    expect(content).toBe('custom: config');
  });

  it('preserves memory', async () => {
    const memDir = path.join(tmpDir, '.ao', 'memory', 'review-patterns');
    fs.mkdirSync(memDir, { recursive: true });
    fs.writeFileSync(path.join(memDir, 'security.md'), 'learned pattern');

    const { updateProject } = await import('../../src/commands/update.js');
    await updateProject(tmpDir);
    const content = fs.readFileSync(path.join(memDir, 'security.md'), 'utf-8');
    expect(content).toBe('learned pattern');
  });
});

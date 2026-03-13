import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { copyTemplates } from '../../src/generators/template-copier.js';
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

describe('copyTemplates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates .ao directory structure', async () => {
    await copyTemplates(tmpDir, 'solo');
    expect(fs.existsSync(path.join(tmpDir, '.ao', 'ao.yaml'))).toBe(true);
  });

  it('applies preset to ao.yaml', async () => {
    await copyTemplates(tmpDir, 'solo-full-auto');
    const content = fs.readFileSync(path.join(tmpDir, '.ao', 'ao.yaml'), 'utf-8');
    expect(content).toContain('preset: solo-full-auto');
    expect(content).toContain('downstream: full-auto');
  });

  it('does not overwrite existing ao.yaml', async () => {
    const aoDir = path.join(tmpDir, '.ao');
    fs.mkdirSync(aoDir, { recursive: true });
    fs.writeFileSync(path.join(aoDir, 'ao.yaml'), 'existing: true');
    await copyTemplates(tmpDir, 'solo', { overwrite: false });
    const content = fs.readFileSync(path.join(aoDir, 'ao.yaml'), 'utf-8');
    expect(content).toBe('existing: true');
  });
});

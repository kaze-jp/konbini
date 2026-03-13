import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectLanguage, buildSection, injectSection, injectClaudeMd } from '../../src/generators/claude-md-injector.js';

describe('detectLanguage', () => {
  it('detects Japanese text', () => {
    expect(detectLanguage('このプロジェクトはTypeScriptで書かれています')).toBe('ja');
  });

  it('detects English text', () => {
    expect(detectLanguage('This project is written in TypeScript')).toBe('en');
  });

  it('defaults to en for empty content', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('detects mixed content by majority', () => {
    // Mostly Japanese
    expect(detectLanguage('これは日本語のテキストです。Some English here.')).toBe('ja');
  });

  it('detects katakana as Japanese', () => {
    expect(detectLanguage('プロジェクトのセットアップ')).toBe('ja');
  });

  it('detects kanji as Japanese', () => {
    expect(detectLanguage('設定ファイルの構成')).toBe('ja');
  });

  it('defaults to en for code-only content', () => {
    expect(detectLanguage('const foo = bar()')).toBe('en');
  });
});

describe('buildSection', () => {
  it('wraps template content with markers', () => {
    const result = buildSection('Hello {{VERSION}}', '1.0.0');
    expect(result).toContain('<!-- konbini:sdd:start -->');
    expect(result).toContain('<!-- konbini:sdd:end -->');
    expect(result).toContain('Hello 1.0.0');
  });

  it('replaces {{VERSION}} placeholder', () => {
    const result = buildSection('konbini v{{VERSION}}', '0.2.2');
    expect(result).toContain('konbini v0.2.2');
    expect(result).not.toContain('{{VERSION}}');
  });

  it('includes DO NOT EDIT warning', () => {
    const result = buildSection('content', '1.0.0');
    expect(result).toContain('DO NOT EDIT');
  });
});

describe('injectSection', () => {
  const section = '<!-- konbini:sdd:start -->\nContent\n<!-- konbini:sdd:end -->';

  it('returns section only for empty content', () => {
    const result = injectSection('', section);
    expect(result).toBe(section);
  });

  it('appends section to existing content with no markers', () => {
    const existing = '# My Project\n\nSome description.';
    const result = injectSection(existing, section);
    expect(result).toContain('# My Project');
    expect(result).toContain('Some description.');
    expect(result).toContain('<!-- konbini:sdd:start -->');
    expect(result).toContain('Content');
    expect(result).toContain('<!-- konbini:sdd:end -->');
  });

  it('replaces content between existing markers', () => {
    const existing = '# My Project\n\n<!-- konbini:sdd:start -->\nOld Content\n<!-- konbini:sdd:end -->\n\nUser notes';
    const newSection = '<!-- konbini:sdd:start -->\nNew Content\n<!-- konbini:sdd:end -->';
    const result = injectSection(existing, newSection);
    expect(result).toContain('# My Project');
    expect(result).toContain('New Content');
    expect(result).not.toContain('Old Content');
    expect(result).toContain('User notes');
  });

  it('handles empty content between markers', () => {
    const existing = '<!-- konbini:sdd:start -->\n<!-- konbini:sdd:end -->';
    const result = injectSection(existing, section);
    expect(result).toContain('Content');
  });

  it('removes orphaned start marker and appends new section (broken state)', () => {
    const existing = '# Project\n\n<!-- konbini:sdd:start -->\nBroken';
    const result = injectSection(existing, section);
    expect(result).toContain('# Project');
    expect(result).toContain(section);
    const startCount = (result.match(/<!-- konbini:sdd:start -->/g) ?? []).length;
    expect(startCount).toBe(1);
  });

  it('removes orphaned end marker and appends new section (broken state)', () => {
    const existing = 'Broken\n<!-- konbini:sdd:end -->\n\n# Project';
    const result = injectSection(existing, section);
    expect(result).toContain('# Project');
    expect(result).toContain(section);
    const endCount = (result.match(/<!-- konbini:sdd:end -->/g) ?? []).length;
    expect(endCount).toBe(1);
  });

  it('is idempotent after broken state recovery', () => {
    const existing = '# Project\n\n<!-- konbini:sdd:start -->\nBroken';
    const first = injectSection(existing, section);
    const second = injectSection(first, section);
    expect(first).toBe(second);
  });

  it('preserves whitespace and formatting outside markers', () => {
    const existing = '# Title\n\n\nParagraph with   spaces.\n\n<!-- konbini:sdd:start -->\nOld\n<!-- konbini:sdd:end -->\n\n  Indented line.';
    const newSection = '<!-- konbini:sdd:start -->\nNew\n<!-- konbini:sdd:end -->';
    const result = injectSection(existing, newSection);
    expect(result).toContain('# Title\n\n\nParagraph with   spaces.');
    expect(result).toContain('  Indented line.');
  });
});

describe('injectClaudeMd', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'konbini-claude-md-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates CLAUDE.md when it does not exist', () => {
    injectClaudeMd(tmpDir, { language: 'en', path: 'CLAUDE.md' });
    const result = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('<!-- konbini:sdd:start -->');
    expect(result).toContain('SDD Enforcement Rules');
    expect(result).toContain('<!-- konbini:sdd:end -->');
  });

  it('creates CLAUDE.md with Japanese template', () => {
    injectClaudeMd(tmpDir, { language: 'ja', path: 'CLAUDE.md' });
    const result = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('SDD 強制ルール');
  });

  it('preserves existing content', () => {
    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, '# My Project\n\nCustom rules here.');
    injectClaudeMd(tmpDir, { language: 'en', path: 'CLAUDE.md' });
    const result = fs.readFileSync(claudeMdPath, 'utf-8');
    expect(result).toContain('# My Project');
    expect(result).toContain('Custom rules here.');
    expect(result).toContain('<!-- konbini:sdd:start -->');
  });

  it('is idempotent', () => {
    injectClaudeMd(tmpDir, { language: 'en', path: 'CLAUDE.md' });
    const first = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    injectClaudeMd(tmpDir, { language: 'en', path: 'CLAUDE.md' });
    const second = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(first).toBe(second);
  });

  it('updates section on language change', () => {
    injectClaudeMd(tmpDir, { language: 'en', path: 'CLAUDE.md' });
    injectClaudeMd(tmpDir, { language: 'ja', path: 'CLAUDE.md' });
    const result = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('SDD 強制ルール');
    expect(result).not.toContain('SDD Enforcement Rules');
  });

  it('creates parent directories for custom path', () => {
    injectClaudeMd(tmpDir, { language: 'en', path: 'docs/CLAUDE.md' });
    const result = fs.readFileSync(path.join(tmpDir, 'docs', 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('<!-- konbini:sdd:start -->');
  });
});

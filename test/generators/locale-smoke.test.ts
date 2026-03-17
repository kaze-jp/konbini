import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getTemplatePath } from '../../src/utils/paths.js';

const LOCALES = ['en', 'ja'];
const REQUIRED_FILES = ['ears-patterns.md', 'section-headers.yaml', 'boilerplate.yaml'];

const EARS_PATTERNS_EN = ['Ubiquitous', 'Event-Driven', 'State-Driven', 'Optional', 'Unwanted'];
const EARS_PATTERNS_JA = ['常時要件', 'イベント駆動要件', '状態駆動要件', '条件付き要件', '異常系要件'];

const SECTION_HEADER_KEYS = [
  'requirements_init:',
  'requirements:',
  'design:',
  'tasks:',
];

describe('locale files', () => {
  for (const locale of LOCALES) {
    describe(`${locale} locale`, () => {
      for (const file of REQUIRED_FILES) {
        it(`${file} exists`, () => {
          const filePath = getTemplatePath(`locales/${locale}/${file}`);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }
    });
  }

  it('ears-patterns.md (en) contains all 5 EARS patterns', () => {
    const content = fs.readFileSync(getTemplatePath('locales/en/ears-patterns.md'), 'utf-8');
    for (const pattern of EARS_PATTERNS_EN) {
      expect(content).toContain(pattern);
    }
  });

  it('ears-patterns.md (ja) contains all 5 EARS patterns', () => {
    const content = fs.readFileSync(getTemplatePath('locales/ja/ears-patterns.md'), 'utf-8');
    for (const pattern of EARS_PATTERNS_JA) {
      expect(content).toContain(pattern);
    }
  });

  it('section-headers.yaml has same top-level keys across all locales', () => {
    const enContent = fs.readFileSync(getTemplatePath('locales/en/section-headers.yaml'), 'utf-8');
    const jaContent = fs.readFileSync(getTemplatePath('locales/ja/section-headers.yaml'), 'utf-8');

    for (const key of SECTION_HEADER_KEYS) {
      expect(enContent).toContain(key);
      expect(jaContent).toContain(key);
    }
  });

  it('boilerplate.yaml has same keys across all locales', () => {
    const enContent = fs.readFileSync(getTemplatePath('locales/en/boilerplate.yaml'), 'utf-8');
    const jaContent = fs.readFileSync(getTemplatePath('locales/ja/boilerplate.yaml'), 'utf-8');

    // Extract keys (lines matching "key: value" at top level)
    const extractKeys = (content: string) =>
      content.split('\n')
        .filter(l => /^\w+:/.test(l.trim()) && !l.trim().startsWith('#'))
        .map(l => l.trim().split(':')[0]);

    const enKeys = extractKeys(enContent);
    const jaKeys = extractKeys(jaContent);

    expect(enKeys.length).toBeGreaterThan(0);
    expect(enKeys).toEqual(jaKeys);
  });
});

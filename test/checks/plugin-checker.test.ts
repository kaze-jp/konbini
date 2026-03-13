import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkPlugins } from '../../src/checks/plugin-checker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../fixtures/installed_plugins.json');

describe('checkPlugins', () => {
  it('detects installed and missing plugins', () => {
    const results = checkPlugins(fixturePath);
    const featureDev = results.find((r) => r.name === 'feature-dev');
    const codeReview = results.find((r) => r.name === 'code-review');
    const superpowers = results.find((r) => r.name === 'superpowers');

    expect(featureDev?.available).toBe(true);
    expect(superpowers?.available).toBe(true);
    expect(codeReview?.available).toBe(false);
  });

  it('returns all false when file does not exist', () => {
    const results = checkPlugins('/nonexistent/path.json');
    expect(results.every((r) => !r.available)).toBe(true);
  });
});

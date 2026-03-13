import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { getTemplatePath } from '../../src/utils/paths.js';

const REQUIRED_TEMPLATES = [
  'agents/orchestrator.md',
  'agents/implementer.md',
  'agents/reviewer.md',
  'config/ao.yaml.template',
  'memory/index.md.template',
];

const REQUIRED_KEYWORDS: Record<string, string[]> = {
  'agents/orchestrator.md': ['Phase 1', 'Phase 1.5', 'R4', 'R5', 'R6', 'R7', 'R8', 'escalation', 'ao.yaml'],
  'agents/implementer.md': ['TDD', 'Red', 'Green', 'Refactor', 'worktree', 'TaskUpdate'],
  'agents/reviewer.md': ['security', 'quality', 'frontend', 'backend', 'memory', 'ao-review'],
  'config/ao.yaml.template': ['{{PRESET}}', '{{DOWNSTREAM}}', 'schema_version'],
};

describe('template files', () => {
  for (const template of REQUIRED_TEMPLATES) {
    it(`${template} exists`, () => {
      const fullPath = getTemplatePath(template);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }

  for (const [template, keywords] of Object.entries(REQUIRED_KEYWORDS)) {
    it(`${template} contains required keywords`, () => {
      const content = fs.readFileSync(getTemplatePath(template), 'utf-8');
      for (const keyword of keywords) {
        expect(content).toContain(keyword);
      }
    });
  }
});

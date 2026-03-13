import { describe, it, expect } from 'vitest';
import { getTemplatePath, getTargetPaths } from '../../src/utils/paths.js';

describe('getTemplatePath', () => {
  it('resolves to templates directory relative to package', () => {
    const result = getTemplatePath('agents/orchestrator.md');
    expect(result).toContain('templates/agents/orchestrator.md');
  });
});

describe('getTargetPaths', () => {
  it('returns correct target directories for a project root', () => {
    const root = '/test/project';
    const paths = getTargetPaths(root);
    expect(paths.aoConfig).toBe('/test/project/.ao/ao.yaml');
    expect(paths.agents).toBe('/test/project/.claude/agents');
    expect(paths.commands).toBe('/test/project/.claude/commands/kiro');
    expect(paths.memory).toBe('/test/project/.ao/memory');
    expect(paths.steering).toBe('/test/project/.ao/steering');
    expect(paths.rules).toBe('/test/project/.kiro/settings/rules');
    expect(paths.specTemplates).toBe('/test/project/.kiro/settings/templates/specs');
  });
});

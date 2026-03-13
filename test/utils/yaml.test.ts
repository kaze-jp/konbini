import { describe, it, expect } from 'vitest';
import { parseTopLevelYaml, parseNestedYamlValue } from '../../src/utils/yaml.js';

describe('parseTopLevelYaml', () => {
  it('parses top-level keys only', () => {
    const input = 'preset: solo\nschema_version: 1\nautonomy:\n  upstream: manual';
    const result = parseTopLevelYaml(input);
    expect(result.preset).toBe('solo');
    expect(result.schema_version).toBe(1);
    // nested keys are ignored
    expect(result.upstream).toBeUndefined();
  });

  it('ignores comments', () => {
    const result = parseTopLevelYaml('# comment\npreset: team');
    expect(result.preset).toBe('team');
  });
});

describe('parseNestedYamlValue', () => {
  const yaml = `preset: solo
schema_version: 1
claude_md:
  language: ja
  path: CLAUDE.md
autonomy:
  upstream: manual
  downstream: approve-only`;

  it('reads nested value claude_md.language', () => {
    expect(parseNestedYamlValue(yaml, 'claude_md.language')).toBe('ja');
  });

  it('reads nested value claude_md.path', () => {
    expect(parseNestedYamlValue(yaml, 'claude_md.path')).toBe('CLAUDE.md');
  });

  it('reads nested value autonomy.downstream', () => {
    expect(parseNestedYamlValue(yaml, 'autonomy.downstream')).toBe('approve-only');
  });

  it('returns undefined for non-existent top-level key', () => {
    expect(parseNestedYamlValue(yaml, 'nonexistent.key')).toBeUndefined();
  });

  it('returns undefined for non-existent nested key', () => {
    expect(parseNestedYamlValue(yaml, 'claude_md.nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty content', () => {
    expect(parseNestedYamlValue('', 'claude_md.language')).toBeUndefined();
  });

  it('handles boolean values', () => {
    const input = 'config:\n  enabled: true\n  disabled: false';
    expect(parseNestedYamlValue(input, 'config.enabled')).toBe('true');
    expect(parseNestedYamlValue(input, 'config.disabled')).toBe('false');
  });
});

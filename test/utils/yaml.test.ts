import { describe, it, expect } from 'vitest';
import { parseTopLevelYaml } from '../../src/utils/yaml.js';

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

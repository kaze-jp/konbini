import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/cli.js';

describe('parseArgs', () => {
  it('parses init command', () => {
    expect(parseArgs(['init'])).toEqual({ command: 'init', args: [] });
  });

  it('parses update command', () => {
    expect(parseArgs(['update'])).toEqual({ command: 'update', args: [] });
  });

  it('parses memory simplify command', () => {
    expect(parseArgs(['memory', 'simplify'])).toEqual({ command: 'memory-simplify', args: [] });
  });

  it('parses config show command', () => {
    expect(parseArgs(['config', 'show'])).toEqual({ command: 'config-show', args: [] });
  });

  it('returns help for no args', () => {
    expect(parseArgs([])).toEqual({ command: 'help', args: [] });
  });
});

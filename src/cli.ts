import { log } from './utils/logger.js';

export interface ParsedCommand {
  command: string;
  args: string[];
}

export function parseArgs(args: string[]): ParsedCommand {
  if (args.length === 0) return { command: 'help', args: [] };

  const [first, second, ...rest] = args;

  if (first === 'memory' && second === 'simplify') {
    return { command: 'memory-simplify', args: rest };
  }
  if (first === 'config' && second === 'show') {
    return { command: 'config-show', args: rest };
  }

  return { command: first, args: args.slice(1) };
}

const HELP = `
  konbini — AI autonomous development framework

  Usage:
    npx konbini init              Initialize konbini in current project
    npx konbini update            Update templates (preserves config & memory)
    npx konbini memory simplify   Consolidate learned review patterns
    npx konbini config show       Show current configuration

  Inspired by cc-sdd (https://github.com/gotalab/cc-sdd)
`;

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'init': {
      const { runInit } = await import('./commands/init.js');
      await runInit(args);
      break;
    }
    case 'update': {
      const { runUpdate } = await import('./commands/update.js');
      await runUpdate(args);
      break;
    }
    case 'memory-simplify': {
      const { runMemorySimplify } = await import('./commands/memory-simplify.js');
      await runMemorySimplify(args);
      break;
    }
    case 'config-show': {
      const { runConfigShow } = await import('./commands/config-show.js');
      await runConfigShow(args);
      break;
    }
    default:
      console.log(HELP);
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});

import { log } from '../utils/logger.js';

export async function runMemorySimplify(_args: string[]) {
  log.header('konbini memory simplify');
  log.info('Memory simplify runs inside a Claude Code session.');
  log.info('');
  log.info('In Claude Code, ask:');
  log.info('  "Consolidate and simplify the review patterns in .ao/memory/"');
  log.info('');
  log.info('The orchestrator also runs this automatically when simplify_threshold (20) is reached.');
}

import { log } from '../utils/logger.js';

export async function runMemorySimplify(_args: string[]) {
  log.header('konbini memory simplify');
  log.info('Memory simplify は Claude Code セッション内で実行されます。');
  log.info('');
  log.info('Claude Code で以下を実行してください:');
  log.info('  「.ao/memory/ の review-patterns を整理・統合してください」');
  log.info('');
  log.info('orchestrator が自動で simplify_threshold (20) に達した際にも実行されます。');
}

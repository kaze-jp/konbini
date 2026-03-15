import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger.js';

export interface HooksCheckResult {
  hasHooks: boolean;
  hasPreCommit: boolean;
}

export function checkPreCommitHooks(projectRoot: string): HooksCheckResult {
  const huskyDir = path.join(projectRoot, '.husky');
  const gitHooksDir = path.join(projectRoot, '.git', 'hooks', 'pre-commit');
  const lintStagedConfig = ['lint-staged.config.js', 'lint-staged.config.mjs', '.lintstagedrc']
    .some((f) => fs.existsSync(path.join(projectRoot, f)));

  const hasHusky = fs.existsSync(huskyDir);
  const hasGitHook = fs.existsSync(gitHooksDir);

  return {
    hasHooks: hasHusky || hasGitHook || lintStagedConfig,
    hasPreCommit: hasGitHook || hasHusky,
  };
}

export function printHooksRecommendation() {
  log.header('Pre-commit Hooks (recommended)');
  log.warn('No pre-commit hooks detected. Consider adding:');
  log.info('  • lint-staged — lint changed files only');
  log.info('  • type-check — type checking');
  log.info('  • test — run related tests');
  log.info('');
  log.warn('Strongly recommended: do not use git commit --no-verify.');
}

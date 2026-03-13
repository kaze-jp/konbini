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
  log.header('Pre-commit Hooks (推奨)');
  log.warn('pre-commit hooks が検出されませんでした。以下の設定を推奨します:');
  log.info('  • lint-staged — 変更ファイルのみ lint');
  log.info('  • type-check — 型チェック');
  log.info('  • test — 関連テストの実行');
  log.info('');
  log.warn('git commit --no-verify は使用しないことを強く推奨します。');
}

import { log } from '../utils/logger.js';

const REQUIRED_PLUGINS = [
  { name: 'feature-dev', purpose: '実装ガイド' },
  { name: 'code-review', purpose: 'PRレビュー' },
  { name: 'superpowers', purpose: 'simplify, brainstorming, TDD等' },
] as const;

export interface PluginCheckResult {
  name: string;
  purpose: string;
  available: boolean;
}

export function checkPlugins(): PluginCheckResult[] {
  return REQUIRED_PLUGINS.map((p) => ({
    ...p,
    available: false,
  }));
}

export function printPluginInstructions(missing: PluginCheckResult[]) {
  if (missing.length === 0) return;
  log.header('Required Claude Code Plugins');
  log.warn('以下のプラグインをインストールしてください:');
  for (const p of missing) {
    log.info(`  ${p.name} — ${p.purpose}`);
  }
  log.info('');
  log.info('Claude Code 内で /install-plugin <name> を実行してください。');
}

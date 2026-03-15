import fs from 'fs';
import path from 'path';
import os from 'os';
import { log } from '../utils/logger.js';

const REQUIRED_PLUGINS = [
  { name: 'feature-dev', purpose: 'implementation guide' },
  { name: 'code-review', purpose: 'PR review' },
  { name: 'superpowers', purpose: 'simplify, brainstorming, TDD' },
] as const;

export interface PluginCheckResult {
  name: string;
  purpose: string;
  available: boolean;
}

function defaultPluginsPath(): string {
  return path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json');
}

export function checkPlugins(pluginsJsonPath?: string): PluginCheckResult[] {
  const filePath = pluginsJsonPath ?? defaultPluginsPath();
  let installedKeys: Set<string> = new Set();

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    installedKeys = new Set(Object.keys(data.plugins ?? {}));
  } catch {
    // ファイルが無い or パース失敗 → 全て未インストール扱い
  }

  return REQUIRED_PLUGINS.map((p) => ({
    ...p,
    available: installedKeys.has(`${p.name}@claude-plugins-official`),
  }));
}

export function printPluginStatus(results: PluginCheckResult[]) {
  log.header('Claude Code Plugins');
  const missing: PluginCheckResult[] = [];
  for (const p of results) {
    if (p.available) {
      log.success(`${p.name} (installed)`);
    } else {
      log.error(`${p.name} — not installed`);
      missing.push(p);
    }
  }
  if (missing.length > 0) {
    log.info('');
    log.warn('Run the following in Claude Code:');
    for (const p of missing) {
      log.info(`  /install-plugin ${p.name}`);
    }
  }
}

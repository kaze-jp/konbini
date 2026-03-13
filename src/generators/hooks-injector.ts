import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger.js';

interface HookEntry {
  matcher: string;
  command: string;
}

interface ClaudeSettings {
  hooks?: {
    PreToolUse?: HookEntry[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const KONBINI_HOOK_MARKER = 'konbini:sdd-guard';

/**
 * Build a hook command that outputs JSON for Claude Code's PreToolUse hook.
 * - On base branch: returns permissionDecision "ask" with reason pointing to CLAUDE.md
 * - On other branches: returns permissionDecision "allow"
 */
function buildGuardCommand(baseBranch: string, claudeMdPath: string): string {
  // The command must output JSON to stdout for Claude Code to parse
  const askReason = `⛔ ${baseBranch}ブランチでの直接編集はSDDルールにより禁止されています。📖 ${claudeMdPath} を読み、/kiro:spec-init から開始してください。`;

  // Shell script that checks branch and outputs appropriate JSON
  return [
    `# ${KONBINI_HOOK_MARKER}`,
    `branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")`,
    `if [ "$branch" = "${baseBranch}" ]; then`,
    `  cat <<'HOOK_JSON'`,
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: askReason,
      },
    }),
    `HOOK_JSON`,
    `else`,
    `  cat <<'HOOK_JSON'`,
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
      },
    }),
    `HOOK_JSON`,
    `fi`,
  ].join('\n');
}

export function injectHooks(projectRoot: string, baseBranch: string, claudeMdPath: string): void {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

  let settings: ClaudeSettings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      log.warn('.claude/settings.json のパースに失敗しました。新規作成します。');
      settings = {};
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.PreToolUse) {
    settings.hooks.PreToolUse = [];
  }

  // Remove existing konbini guard hook if present
  settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
    (hook) => !hook.command.includes(KONBINI_HOOK_MARKER)
  );

  // Add the guard hook
  settings.hooks.PreToolUse.push({
    matcher: 'Edit|Write|MultiEdit',
    command: buildGuardCommand(baseBranch, claudeMdPath),
  });

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  log.success('Claude Code hooks にSDDガードを設定しました');
}

import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger.js';

interface HookCommand {
  type: 'command';
  command: string;
}

interface HookEntry {
  matcher: string;
  hooks: HookCommand[];
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
  const denyReason = `⛔ ${baseBranch}ブランチでの直接編集はSDDルールにより禁止されています。次の手順に従ってください: 1) git worktree で作業ブランチを作成 2) ${claudeMdPath} を読む 3) /kiro:spec-init から開始`;

  return [
    `# ${KONBINI_HOOK_MARKER}`,
    `branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")`,
    `if [ "$branch" = "${baseBranch}" ]; then`,
    `  cat <<'HOOK_JSON'`,
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: denyReason,
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

function isKonbiniHookEntry(entry: HookEntry | Record<string, unknown>): boolean {
  // Check new format: { matcher, hooks: [{ type, command }] }
  if (Array.isArray(entry.hooks)) {
    return (entry.hooks as HookCommand[]).some((h) => h.command?.includes(KONBINI_HOOK_MARKER));
  }
  // Check old format: { matcher, command } (for cleanup of pre-0.2.7 entries)
  if (typeof (entry as Record<string, unknown>).command === 'string') {
    return ((entry as Record<string, unknown>).command as string).includes(KONBINI_HOOK_MARKER);
  }
  return false;
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
    (entry) => !isKonbiniHookEntry(entry)
  );

  // Add the guard hook in correct Claude Code format
  settings.hooks.PreToolUse.push({
    matcher: 'Edit|Write|MultiEdit',
    hooks: [
      {
        type: 'command',
        command: buildGuardCommand(baseBranch, claudeMdPath),
      },
    ],
  });

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  log.success('Claude Code hooks にSDDガードを設定しました');
}

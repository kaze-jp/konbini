import { checkAllTools } from '../checks/tool-checker.js';
import { checkPlugins, printPluginStatus } from '../checks/plugin-checker.js';
import { checkPreCommitHooks, printHooksRecommendation } from '../checks/hooks-checker.js';
import { detectBaseBranch } from '../checks/git-detector.js';
import { copyTemplates } from '../generators/template-copier.js';
import { getPresetNames, buildInitConfig } from '../generators/preset-resolver.js';
import type { InitConfig } from '../generators/preset-resolver.js';
import { log } from '../utils/logger.js';

// --- readline helper ---
export interface Prompter {
  ask(question: string): Promise<string>;
  close(): void;
}

function createPrompter(): Prompter {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return {
    ask: (q: string) => new Promise<string>((resolve) => rl.question(q, resolve)),
    close: () => rl.close(),
  };
}

// --- Step 1: Base branch ---
export async function askBaseBranch(prompter: Prompter): Promise<string> {
  const detected = detectBaseBranch();
  const answer = await prompter.ask(`\n  Base branch: ${detected} (detected) — correct? [Y/n]: `);
  if (answer.trim().toLowerCase() === 'n') {
    const custom = await prompter.ask('  Base branch: ');
    return custom.trim() || detected;
  }
  return detected;
}

// --- Step 2: Preset selection ---
export async function askPreset(prompter: Prompter): Promise<string> {
  log.header('Preset Selection');
  log.info('  1) solo           — 上流承認 + 下流は approve-only（推奨）');
  log.info('  2) solo-full-auto — 上流承認後は完全自律');
  log.info('  3) team           — 上流承認 + 下流は review-and-approve');
  log.info('  4) custom         — 個別に設定');
  const answer = await prompter.ask('\n  Select preset [1]: ');

  const map: Record<string, string> = {
    '1': 'solo', '2': 'solo-full-auto', '3': 'team', '4': 'custom', '': 'solo',
  };
  return map[answer.trim()] ?? 'solo';
}

// --- Step 2b: Custom settings ---
export async function askCustomSettings(prompter: Prompter): Promise<Partial<InitConfig>> {
  log.header('Custom Settings');

  const ds = await prompter.ask('  downstream (approve-only / full-auto / review-and-approve) [approve-only]: ');
  const am = await prompter.ask('  auto_merge (true / false) [true]: ');
  const r8 = await prompter.ask('  R8 pre-merge review (human / ai / skip) [human]: ');
  const gs = await prompter.ask('  git strategy (worktree / branch) [worktree]: ');

  return {
    downstream: ds.trim() || 'approve-only',
    autoMerge: am.trim() === 'false' ? false : true,
    R8Actor: r8.trim() || 'human',
    gitStrategy: gs.trim() || 'worktree',
  };
}

// --- Main: initProject (now accepts InitConfig) ---
export async function initProject(projectRoot: string, config: InitConfig) {
  log.header('konbini init');

  // ツールチェック
  const tools = await checkAllTools();
  for (const tool of tools) {
    if (tool.available) {
      log.success(`${tool.name} ${tool.version ?? ''}`);
    } else {
      log.error(`${tool.name} が見つかりません`);
    }
  }

  // プラグインチェック
  const plugins = checkPlugins();
  printPluginStatus(plugins);

  // Hooks チェック
  const hooks = checkPreCommitHooks(projectRoot);
  if (!hooks.hasHooks) {
    printHooksRecommendation();
  }

  // テンプレート展開
  await copyTemplates(projectRoot, config);

  log.success(`konbini initialized with preset: ${config.preset}`);
  log.info(`  base branch: ${config.baseBranch}`);
  log.info('');
  log.info('Next: Claude Code で /kiro:spec-init <feature> を実行してください');
}

// --- Entry point ---
export async function runInit(args: string[]) {
  const prompter = createPrompter();

  try {
    // Step 1: Base branch
    const baseBranch = await askBaseBranch(prompter);

    // Step 2: Preset
    let presetName = args[0];
    if (!presetName) {
      presetName = await askPreset(prompter);
    }

    const validPresets = getPresetNames();
    if (!validPresets.includes(presetName as any)) {
      log.error(`Invalid preset: ${presetName}. Valid: ${validPresets.join(', ')}`);
      process.exit(1);
    }

    // Step 2b: Custom settings
    let customOverrides: Partial<InitConfig> = {};
    if (presetName === 'custom') {
      customOverrides = await askCustomSettings(prompter);
    }

    const config = buildInitConfig(presetName, { baseBranch, ...customOverrides });

    await initProject(process.cwd(), config);
  } finally {
    prompter.close();
  }
}

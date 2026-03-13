import { checkAllTools } from '../checks/tool-checker.js';
import { checkPlugins, printPluginInstructions } from '../checks/plugin-checker.js';
import { checkPreCommitHooks, printHooksRecommendation } from '../checks/hooks-checker.js';
import { copyTemplates } from '../generators/template-copier.js';
import { getPresetNames } from '../generators/preset-resolver.js';
import { log } from '../utils/logger.js';

export async function initProject(projectRoot: string, preset: string) {
  log.header('konbini init');

  // 1. ツールチェック
  const tools = await checkAllTools();
  for (const tool of tools) {
    if (tool.available) {
      log.success(`${tool.name} ${tool.version ?? ''}`);
    } else {
      log.error(`${tool.name} が見つかりません`);
    }
  }

  // 2. プラグイン案内
  const plugins = checkPlugins();
  printPluginInstructions(plugins);

  // 3. Hooks チェック
  const hooks = checkPreCommitHooks(projectRoot);
  if (!hooks.hasHooks) {
    printHooksRecommendation();
  }

  // 4. テンプレート展開
  await copyTemplates(projectRoot, preset);

  log.success(`konbini initialized with preset: ${preset}`);
  log.info('');
  log.info('Next: Claude Code で /kiro:spec-init <feature> を実行してください');
}

export async function runInit(args: string[]) {
  let preset = args[0];
  const validPresets = getPresetNames();

  if (!preset) {
    // インタラクティブ選択
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

    log.header('Preset Selection');
    log.info('  1) solo           — 上流承認 + 下流は approve-only（推奨）');
    log.info('  2) solo-full-auto — 上流承認後は完全自律');
    log.info('  3) team           — 上流承認 + 下流は review-and-approve');
    const answer = await question('\n  Select preset [1]: ');
    rl.close();

    const map: Record<string, string> = { '1': 'solo', '2': 'solo-full-auto', '3': 'team', '': 'solo' };
    preset = map[answer.trim()] ?? 'solo';
  }

  if (!validPresets.includes(preset as any)) {
    log.error(`Invalid preset: ${preset}. Valid: ${validPresets.join(', ')}`);
    process.exit(1);
  }
  await initProject(process.cwd(), preset);
}

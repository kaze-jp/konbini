import fs from 'fs';
import path from 'path';
import { checkAllTools } from '../checks/tool-checker.js';
import { checkPlugins, printPluginStatus } from '../checks/plugin-checker.js';
import { checkPreCommitHooks, printHooksRecommendation } from '../checks/hooks-checker.js';
import { detectBaseBranch } from '../checks/git-detector.js';
import { copyTemplates } from '../generators/template-copier.js';
import { injectClaudeMd, detectLanguage } from '../generators/claude-md-injector.js';
import type { ClaudeMdConfig } from '../generators/claude-md-injector.js';
import { ensureGitignoreEntries } from '../generators/gitignore-injector.js';
import { getPresetNames, buildInitConfig } from '../generators/preset-resolver.js';
import type { InitConfig } from '../generators/preset-resolver.js';
import { log } from '../utils/logger.js';

// --- CLI flag parser ---
export interface InitFlags {
  yes: boolean;
  preset?: string;
  branch?: string;
  lang?: string;
  claudeMdPath?: string;
}

export function parseInitFlags(args: string[]): InitFlags {
  const flags: InitFlags = { yes: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--yes':
      case '-y':
        flags.yes = true;
        break;
      case '--preset':
        flags.preset = args[++i];
        break;
      case '--branch':
        flags.branch = args[++i];
        break;
      case '--lang':
        flags.lang = args[++i];
        break;
      case '--claude-md-path':
        flags.claudeMdPath = args[++i];
        break;
    }
  }
  return flags;
}

// --- readline helper ---
export interface Prompter {
  ask(question: string): Promise<string>;
  close(): void;
}

async function createPrompter(): Promise<Prompter> {
  const readline = await import('readline');
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

// --- Step 3: CLAUDE.md language & path ---
export async function askClaudeMdConfig(prompter: Prompter, projectRoot: string): Promise<ClaudeMdConfig> {
  const defaultPath = 'CLAUDE.md';
  const existingPath = path.resolve(projectRoot, defaultPath);
  let detectedLang = 'en';
  if (fs.existsSync(existingPath)) {
    const content = fs.readFileSync(existingPath, 'utf-8');
    detectedLang = detectLanguage(content);
  }

  log.header('CLAUDE.md SDD Injection');
  log.info('  1) English');
  log.info('  2) 日本語');
  const langAnswer = await prompter.ask(`\n  Select language [${detectedLang === 'ja' ? '2' : '1'}]: `);
  const langMap: Record<string, string> = { '1': 'en', '2': 'ja', '': detectedLang };
  const language = langMap[langAnswer.trim()] ?? detectedLang;

  const pathAnswer = await prompter.ask(`  CLAUDE.md path [${defaultPath}]: `);
  const claudeMdPath = pathAnswer.trim() || defaultPath;

  return { language, path: claudeMdPath };
}

// --- Main: initProject (now accepts InitConfig) ---
export async function initProject(projectRoot: string, config: InitConfig, claudeMdConfig: ClaudeMdConfig) {
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

  // CLAUDE.md SDD ルール注入
  injectClaudeMd(projectRoot, claudeMdConfig);

  // .gitignore にworktreeディレクトリを追加
  ensureGitignoreEntries(projectRoot);

  // ao.yaml に claude_md 設定を書き込み
  const aoYamlPath = path.join(projectRoot, '.ao', 'ao.yaml');
  if (fs.existsSync(aoYamlPath)) {
    let aoContent = fs.readFileSync(aoYamlPath, 'utf-8');
    if (aoContent.includes('{{CLAUDE_MD_LANG}}')) {
      aoContent = aoContent
        .replace('{{CLAUDE_MD_LANG}}', claudeMdConfig.language)
        .replace('{{CLAUDE_MD_PATH}}', claudeMdConfig.path);
    } else if (!aoContent.includes('claude_md:')) {
      aoContent += `\nclaude_md:\n  language: ${claudeMdConfig.language}\n  path: ${claudeMdConfig.path}\n`;
    } else {
      aoContent = aoContent
        .replace(/claude_md:\n\s+language:\s*.+\n\s+path:\s*.+/,
          `claude_md:\n  language: ${claudeMdConfig.language}\n  path: ${claudeMdConfig.path}`);
    }
    fs.writeFileSync(aoYamlPath, aoContent);
  }

  log.success(`konbini initialized with preset: ${config.preset}`);
  log.info(`  base branch: ${config.baseBranch}`);
  log.info('');
  log.info('Next: Claude Code で /kiro:spec-init <feature> を実行してください');
}

// --- Entry point ---
export async function runInit(args: string[]) {
  const prompter = await createPrompter();

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

    // Step 3: CLAUDE.md config
    const claudeMdConfig = await askClaudeMdConfig(prompter, process.cwd());

    await initProject(process.cwd(), config, claudeMdConfig);
  } finally {
    prompter.close();
  }
}

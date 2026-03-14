# Interactive Init Wizard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `konbini init` をインタラクティブウィザード形式に拡張し、base branch確認・プラグイン検出・custom設定を可能にする

**Architecture:** 既存の init.ts を wizard ステップごとの関数に分割し、InitConfig 型で設定を流す。plugin-checker を実ファイル読み取りに置換。template-copier に base_branch / git_strategy を渡す。

**Tech Stack:** TypeScript, Node.js readline, vitest

---

## File Structure

| File | Role |
|---|---|
| `src/commands/init.ts` | ウィザードフロー（各ステップ呼び出し + initProject） |
| `src/checks/plugin-checker.ts` | installed_plugins.json を読んでプラグイン判定 |
| `src/checks/git-detector.ts` | **新規**: base branch 検出 |
| `src/generators/preset-resolver.ts` | custom プリセット追加、InitConfig 型 |
| `src/generators/template-copier.ts` | base_branch, git_strategy を ao.yaml に反映 |
| `templates/config/ao.yaml.template` | `{{BASE_BRANCH}}`, `{{GIT_STRATEGY}}` 追加 |
| `test/checks/plugin-checker.test.ts` | **新規**: プラグイン検出テスト |
| `test/checks/git-detector.test.ts` | **新規**: base branch 検出テスト |
| `test/commands/init.test.ts` | 新フロー対応に更新 |
| `test/fixtures/templates/config/ao.yaml.template` | fixture更新 |

---

## Chunk 1: Base Branch Detection + Plugin Checker

### Task 1: git-detector — base branch 検出

**Files:**
- Create: `src/checks/git-detector.ts`
- Test: `test/checks/git-detector.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// test/checks/git-detector.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { detectBaseBranch } from '../../src/checks/git-detector.js';

describe('detectBaseBranch', () => {
  it('parses origin/main from symbolic-ref output', () => {
    vi.mocked(execSync).mockReturnValue('refs/remotes/origin/main\n');
    expect(detectBaseBranch()).toBe('main');
  });

  it('parses origin/develop', () => {
    vi.mocked(execSync).mockReturnValue('refs/remotes/origin/develop\n');
    expect(detectBaseBranch()).toBe('develop');
  });

  it('falls back to main on error', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('not found'); });
    expect(detectBaseBranch()).toBe('main');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/checks/git-detector.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/checks/git-detector.ts
import { execSync } from 'child_process';

export function detectBaseBranch(): string {
  try {
    const ref = execSync('git symbolic-ref refs/remotes/origin/HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    // "refs/remotes/origin/main" → "main"
    const parts = ref.split('/');
    return parts[parts.length - 1];
  } catch {
    return 'main';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/checks/git-detector.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/checks/git-detector.ts test/checks/git-detector.test.ts
git commit -m "feat(init): add base branch detection from git"
```

---

### Task 2: plugin-checker — installed_plugins.json を実際に読む

**Files:**
- Modify: `src/checks/plugin-checker.ts`
- Create: `test/checks/plugin-checker.test.ts`
- Create: `test/fixtures/installed_plugins.json`

- [ ] **Step 1: Write fixture and failing test**

```json
// test/fixtures/installed_plugins.json
{
  "version": 2,
  "plugins": {
    "feature-dev@claude-plugins-official": [{ "scope": "user", "installPath": "/tmp", "version": "1.0.0", "installedAt": "2026-01-01T00:00:00Z", "lastUpdated": "2026-01-01T00:00:00Z", "gitCommitSha": "abc" }],
    "superpowers@claude-plugins-official": [{ "scope": "user", "installPath": "/tmp", "version": "1.0.0", "installedAt": "2026-01-01T00:00:00Z", "lastUpdated": "2026-01-01T00:00:00Z", "gitCommitSha": "def" }]
  }
}
```

```typescript
// test/checks/plugin-checker.test.ts
import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkPlugins } from '../../src/checks/plugin-checker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../fixtures/installed_plugins.json');

describe('checkPlugins', () => {
  it('detects installed and missing plugins', () => {
    const results = checkPlugins(fixturePath);
    const featureDev = results.find((r) => r.name === 'feature-dev');
    const codeReview = results.find((r) => r.name === 'code-review');
    const superpowers = results.find((r) => r.name === 'superpowers');

    expect(featureDev?.available).toBe(true);
    expect(superpowers?.available).toBe(true);
    expect(codeReview?.available).toBe(false);
  });

  it('returns all false when file does not exist', () => {
    const results = checkPlugins('/nonexistent/path.json');
    expect(results.every((r) => !r.available)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/checks/plugin-checker.test.ts`
Expected: FAIL — checkPlugins does not accept path argument

- [ ] **Step 3: Rewrite plugin-checker**

```typescript
// src/checks/plugin-checker.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
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
      log.error(`${p.name} — 未インストール`);
      missing.push(p);
    }
  }
  if (missing.length > 0) {
    log.info('');
    log.warn('Claude Code で以下を実行してください:');
    for (const p of missing) {
      log.info(`  /install-plugin ${p.name}`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/checks/plugin-checker.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/checks/plugin-checker.ts test/checks/plugin-checker.test.ts test/fixtures/installed_plugins.json
git commit -m "feat(init): detect installed Claude Code plugins from installed_plugins.json"
```

---

## Chunk 2: Preset Resolver + Template Updates

### Task 3: preset-resolver — custom プリセット + InitConfig 型

**Files:**
- Modify: `src/generators/preset-resolver.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// 既存テストファイルが無いので test/generators/preset-resolver.test.ts を作成
// test/generators/preset-resolver.test.ts
import { describe, it, expect } from 'vitest';
import { resolvePreset, getPresetNames, buildInitConfig } from '../../src/generators/preset-resolver.js';
import type { InitConfig } from '../../src/generators/preset-resolver.js';

describe('preset-resolver', () => {
  it('resolves solo preset', () => {
    const config = resolvePreset('solo');
    expect(config.downstream).toBe('approve-only');
  });

  it('getPresetNames includes custom', () => {
    expect(getPresetNames()).toContain('custom');
  });

  it('buildInitConfig merges preset defaults with overrides', () => {
    const config = buildInitConfig('solo', { baseBranch: 'develop' });
    expect(config.preset).toBe('solo');
    expect(config.baseBranch).toBe('develop');
    expect(config.downstream).toBe('approve-only');
    expect(config.gitStrategy).toBe('worktree');
  });

  it('buildInitConfig for custom uses provided values', () => {
    const config = buildInitConfig('custom', {
      baseBranch: 'main',
      downstream: 'full-auto',
      autoMerge: false,
      R8Actor: 'skip',
      gitStrategy: 'branch',
    });
    expect(config.downstream).toBe('full-auto');
    expect(config.autoMerge).toBe(false);
    expect(config.gitStrategy).toBe('branch');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/generators/preset-resolver.test.ts`
Expected: FAIL — buildInitConfig not exported

- [ ] **Step 3: Rewrite preset-resolver**

```typescript
// src/generators/preset-resolver.ts
export type PresetName = 'solo' | 'solo-full-auto' | 'team' | 'custom';

export interface PresetConfig {
  downstream: string;
  R8_actor: string;
  auto_merge: boolean;
}

export interface InitConfig {
  preset: PresetName;
  baseBranch: string;
  downstream: string;
  R8Actor: string;
  autoMerge: boolean;
  gitStrategy: string;
}

const PRESETS: Record<Exclude<PresetName, 'custom'>, PresetConfig> = {
  solo: {
    downstream: 'approve-only',
    R8_actor: 'human',
    auto_merge: true,
  },
  'solo-full-auto': {
    downstream: 'full-auto',
    R8_actor: 'skip',
    auto_merge: true,
  },
  team: {
    downstream: 'review-and-approve',
    R8_actor: 'human',
    auto_merge: true,
  },
};

const DEFAULTS: Omit<InitConfig, 'preset'> = {
  baseBranch: 'main',
  downstream: 'approve-only',
  R8Actor: 'human',
  autoMerge: true,
  gitStrategy: 'worktree',
};

export function resolvePreset(name: string): PresetConfig {
  if (name === 'custom') {
    return { downstream: DEFAULTS.downstream, R8_actor: DEFAULTS.R8Actor, auto_merge: DEFAULTS.autoMerge };
  }
  const preset = PRESETS[name as Exclude<PresetName, 'custom'>];
  if (!preset) throw new Error(`Unknown preset: ${name}. Valid: ${Object.keys(PRESETS).join(', ')}, custom`);
  return preset;
}

export function getPresetNames(): PresetName[] {
  return [...Object.keys(PRESETS), 'custom'] as PresetName[];
}

export function buildInitConfig(
  presetName: string,
  overrides: Partial<Omit<InitConfig, 'preset'>> = {},
): InitConfig {
  const preset = presetName === 'custom' ? null : PRESETS[presetName as Exclude<PresetName, 'custom'>];

  return {
    preset: presetName as PresetName,
    baseBranch: overrides.baseBranch ?? DEFAULTS.baseBranch,
    downstream: overrides.downstream ?? preset?.downstream ?? DEFAULTS.downstream,
    R8Actor: overrides.R8Actor ?? preset?.R8_actor ?? DEFAULTS.R8Actor,
    autoMerge: overrides.autoMerge ?? preset?.auto_merge ?? DEFAULTS.autoMerge,
    gitStrategy: overrides.gitStrategy ?? DEFAULTS.gitStrategy,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/generators/preset-resolver.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/generators/preset-resolver.ts test/generators/preset-resolver.test.ts
git commit -m "feat(init): add custom preset and InitConfig type"
```

---

### Task 4: ao.yaml.template — プレースホルダー追加

**Files:**
- Modify: `templates/config/ao.yaml.template` (lines 21-22)
- Modify: `test/fixtures/templates/config/ao.yaml.template`

- [ ] **Step 1: Update ao.yaml.template**

In `templates/config/ao.yaml.template`, change:
```yaml
# Before (line 21-22)
git:
  strategy: worktree            # worktree（超推奨） | branch
  base_branch: main             # ベースブランチ（main, develop, 任意のブランチ）

# After
git:
  strategy: {{GIT_STRATEGY}}    # worktree（超推奨） | branch
  base_branch: {{BASE_BRANCH}}  # ベースブランチ（main, develop, 任意のブランチ）
```

- [ ] **Step 2: Update test fixture**

In `test/fixtures/templates/config/ao.yaml.template`, add:
```yaml
preset: {{PRESET}}
schema_version: 1
downstream: {{DOWNSTREAM}}
R8_actor: {{R8_ACTOR}}
auto_merge: {{AUTO_MERGE}}
base_branch: {{BASE_BRANCH}}
git_strategy: {{GIT_STRATEGY}}
```

- [ ] **Step 3: Commit**

```bash
git add templates/config/ao.yaml.template test/fixtures/templates/config/ao.yaml.template
git commit -m "feat(init): add BASE_BRANCH and GIT_STRATEGY placeholders to ao.yaml template"
```

---

### Task 5: template-copier — InitConfig 対応

**Files:**
- Modify: `src/generators/template-copier.ts` (line 32-82)

- [ ] **Step 1: Update copyTemplates signature and replacement logic**

Change `copyTemplates` to accept `InitConfig` instead of `presetName: string`:

```typescript
// src/generators/template-copier.ts — copyTemplates function
import type { InitConfig } from './preset-resolver.js';

export async function copyTemplates(
  projectRoot: string,
  config: InitConfig,
  options: CopyOptions = {}
) {
  const { overwrite = true } = options;
  const paths = getTargetPaths(projectRoot);

  // ... (copyDir calls remain unchanged) ...

  // ao.yaml (テンプレートからプリセット値を適用して生成)
  const aoTemplate = fs.readFileSync(getTemplatePath('config/ao.yaml.template'), 'utf-8');
  const aoContent = aoTemplate
    .replace('{{PRESET}}', config.preset)
    .replace('{{DOWNSTREAM}}', config.downstream)
    .replace('{{R8_ACTOR}}', config.R8Actor)
    .replace('{{AUTO_MERGE}}', String(config.autoMerge))
    .replace('{{BASE_BRANCH}}', config.baseBranch)
    .replace('{{GIT_STRATEGY}}', config.gitStrategy);

  const aoPath = paths.aoConfig;
  if (overwrite || !fs.existsSync(aoPath)) {
    fs.mkdirSync(path.dirname(aoPath), { recursive: true });
    fs.writeFileSync(aoPath, aoContent);
  }

  log.success('テンプレートを展開しました');
}
```

- [ ] **Step 2: Update init.test.ts to pass InitConfig**

Update the existing test to use `buildInitConfig`:

```typescript
// test/commands/init.test.ts — update the import and call
import { buildInitConfig } from '../../src/generators/preset-resolver.js';

it('generates expected directory structure', async () => {
  const { initProject } = await import('../../src/commands/init.js');
  const config = buildInitConfig('solo', { baseBranch: 'main' });
  await initProject(tmpDir, config);
  expect(fs.existsSync(path.join(tmpDir, '.ao', 'ao.yaml'))).toBe(true);
  expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'orchestrator.md'))).toBe(true);
});
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add src/generators/template-copier.ts test/commands/init.test.ts
git commit -m "feat(init): pass InitConfig through template-copier for base_branch/git_strategy"
```

---

## Chunk 3: Init Wizard Flow

### Task 6: init.ts — ウィザード書き直し

**Files:**
- Modify: `src/commands/init.ts`

- [ ] **Step 1: Rewrite init.ts with wizard flow**

```typescript
// src/commands/init.ts
import { checkAllTools } from '../checks/tool-checker.js';
import { checkPlugins, printPluginStatus } from '../checks/plugin-checker.js';
import { checkPreCommitHooks, printHooksRecommendation } from '../checks/hooks-checker.js';
import { detectBaseBranch } from '../checks/git-detector.js';
import { copyTemplates } from '../generators/template-copier.js';
import { getPresetNames, buildInitConfig } from '../generators/preset-resolver.js';
import type { InitConfig } from '../generators/preset-resolver.js';
import { log } from '../utils/logger.js';

// --- readline helper ---
interface Prompter {
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

// --- Main: initProject ---
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
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: Manual smoke test**

Run: `npx tsx src/cli.ts init`
Expected: Full wizard flow — base branch → preset → plugins → tools → hooks → templates

- [ ] **Step 4: Commit**

```bash
git add src/commands/init.ts
git commit -m "feat(init): interactive wizard with base branch, preset, custom, plugin detection"
```

---

### Task 7: Final — update コマンドの整合性確認

**Files:**
- Check: `src/commands/update.ts`

- [ ] **Step 1: Read update.ts and check if it calls copyTemplates**

If `update.ts` calls `copyTemplates(root, presetName)` with the old signature, update it to pass `InitConfig` (reading existing ao.yaml to reconstruct config).

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit if changes were needed**

```bash
git add -u
git commit -m "fix(update): align with new copyTemplates InitConfig signature"
```

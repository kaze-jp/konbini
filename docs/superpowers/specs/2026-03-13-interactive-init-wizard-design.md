# Interactive Init Wizard Design

## Overview

`konbini init` をインタラクティブウィザード形式に拡張し、base branch確認・プラグイン検出・個別設定カスタマイズを可能にする。

## Current State

- プリセット選択の1問のみ（readline）
- base branch: `main` ハードコード
- プラグインチェック: スタブ（常に `available: false`）
- 設定の個別選択: なし（プリセットで一括決定）

## Design

### Wizard Flow

```
konbini init [preset]

Step 1: Base branch 検出・確認
  git symbolic-ref refs/remotes/origin/HEAD でデフォルトブランチを検出
  → "Base branch: main (detected) — correct? [Y/n]"
  → n の場合: "Base branch:" でフリーテキスト入力

Step 2: プリセット選択
  1) solo           — 上流承認 + 下流は approve-only（推奨）
  2) solo-full-auto — 上流承認後は完全自律
  3) team           — 上流承認 + review-and-approve
  4) custom         — 個別に設定
  Select preset [1]:

Step 2b: custom 選択時のみ
  downstream [approve-only]: (approve-only / full-auto / review-and-approve)
  auto_merge [true]: (true / false)
  R8 pre-merge review [human]: (human / ai / skip)
  git strategy [worktree]: (worktree / branch)

Step 3: プラグインチェック
  ~/.claude/plugins/installed_plugins.json を読んで判定
  ✓ feature-dev (installed)
  ✗ code-review — Claude Code で /install-plugin code-review を実行してください

Step 4: ツールチェック（既存）
  ✓ git 2.x.x
  ✓ gh 2.x.x

Step 5: Hooks チェック（既存）

Step 6: テンプレート展開
  base_branch, custom設定値を ao.yaml に反映
```

### CLI引数でプリセットを渡した場合

- Step 2 (プリセット選択) をスキップ
- Step 1 (base branch), Step 3 (プラグイン) は実行する

### Files to Modify

| File | Change |
|---|---|
| `src/commands/init.ts` | ウィザードフロー書き直し。各ステップを関数分割 |
| `src/checks/plugin-checker.ts` | `~/.claude/plugins/installed_plugins.json` を読んで実際のインストール状態を返す |
| `src/generators/preset-resolver.ts` | `custom` プリセット追加。`InitConfig` 型を導入（base_branch, git_strategy含む） |
| `src/generators/template-copier.ts` | `base_branch` パラメータを受け取り ao.yaml に反映 |
| `templates/config/ao.yaml.template` | `main` → `{{BASE_BRANCH}}` プレースホルダー化 |
| `test/commands/init.test.ts` | 新フローに合わせてテスト更新 |

### Data Types

```typescript
// プリセット + カスタム設定を統合した init 設定
interface InitConfig {
  preset: PresetName;          // 'solo' | 'solo-full-auto' | 'team' | 'custom'
  baseBranch: string;          // 検出 or 入力されたブランチ名
  downstream: string;          // 'approve-only' | 'full-auto' | 'review-and-approve'
  R8_actor: string;            // 'human' | 'ai' | 'skip'
  auto_merge: boolean;
  git_strategy: string;        // 'worktree' | 'branch'
}
```

### Plugin Detection

```typescript
// ~/.claude/plugins/installed_plugins.json の構造
interface InstalledPluginsFile {
  version: number;
  plugins: Record<string, Array<{
    scope: string;
    installPath: string;
    version: string;
    installedAt: string;
    lastUpdated: string;
    gitCommitSha: string;
  }>>;
}

// キーは "{name}@{marketplace}" 形式
// required plugins: feature-dev, code-review, superpowers
// 判定: キーが "{name}@claude-plugins-official" で存在すれば installed
```

### Base Branch Detection

```typescript
function detectBaseBranch(): string {
  // 1. git symbolic-ref refs/remotes/origin/HEAD → "refs/remotes/origin/main"
  // 2. パース失敗時は "main" をフォールバック
}
```

### Design Decisions

1. **readline をそのまま使用** — 外部依存（inquirer等）を追加しない
2. **ステップごとに関数分割** — テスタビリティ確保
3. **プラグインは案内のみ** — CLIからインストールするAPIがないため、Claude Code上での `/install-plugin` 実行を推奨
4. **custom は自律レベル + git設定のみ** — quality gates等はao.yaml直接編集。init時に聞いてもデフォルトのままになりがち
5. **base branch は全モードで確認** — 引数でプリセット指定時もbase branchは聞く

### Template Change

`templates/config/ao.yaml.template` の変更:

```yaml
# Before
git:
  base_branch: main

# After
git:
  base_branch: {{BASE_BRANCH}}
```

### Test Strategy

- `initProject` の各ステップを関数分割し、個別にテスト可能にする
- plugin-checker: モック用の installed_plugins.json を fixtures に用意
- base branch検出: execSync をモックして検証
- ウィザード全体のインテグレーションテストは readline をモック

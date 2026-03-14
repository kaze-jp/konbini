# Technical Design: non-interactive-init

## Document Info
- Feature: non-interactive-init
- Status: Draft
- Created: 2026-03-13
- Requirements: ./requirements.md

## Architecture Overview

既存の `runInit()` → `askXxx()` → `initProject()` のフローを維持しつつ、フラグパース層を追加する。`initProject()` は変更しない。

```
CLI args
  │
  ▼
parseInitFlags(args)  ← 新規: フラグを InitFlags に変換
  │
  ▼
runInit(args)         ← 変更: InitFlags を参照して prompt をスキップ
  ├─ askBaseBranch()  ← 変更: flags.branch があればスキップ
  ├─ askPreset()      ← 変更: flags.preset があればスキップ
  ├─ askCustomSettings() ← 変更: flags.yes && custom ならデフォルト適用
  └─ askClaudeMdConfig() ← 変更: flags.lang/claudeMdPath があればスキップ
  │
  ▼
initProject()         ← 変更なし
```

## Component Design

### Component: InitFlags (型定義)
- **Purpose**: CLI フラグのパース結果を表す型
- **Location**: `src/commands/init.ts` 内に定義
- **Interface**:
```typescript
interface InitFlags {
  yes: boolean;
  preset?: string;
  branch?: string;
  lang?: string;
  claudeMdPath?: string;
}
```

### Component: parseInitFlags
- **Purpose**: `string[]` の args からフラグを抽出し `InitFlags` を返す
- **Location**: `src/commands/init.ts` 内の関数
- **Dependencies**: なし（純粋関数）
- **Interface**: `function parseInitFlags(args: string[]): InitFlags`
- **Rationale**: 外部ライブラリを使わず、シンプルなループベースのパーサーで十分。フラグの数が少なく、将来の拡張時も手動で管理可能。

### Component: runInit (変更)
- **Purpose**: フラグに基づいてインタラクティブ/非インタラクティブのフローを制御
- **Location**: `src/commands/init.ts` L154-188
- **変更点**: `parseInitFlags` の結果を各 `askXxx` に渡し、値が既にあればプロンプトをスキップ

### Component: askBaseBranch (変更)
- **Purpose**: branch フラグがあればプロンプトをスキップ
- **Location**: `src/commands/init.ts` L31-39
- **変更後シグネチャ**: フラグ値を `runInit` 側で事前解決し、prompter 呼び出しを条件分岐

### Component: HELP テキスト (変更)
- **Purpose**: 新フラグの使い方を `--help` 出力に追加
- **Location**: `src/cli.ts` L31-41

## API Contracts

### parseInitFlags(args: string[]): InitFlags
- **Input**: CLI 引数配列（例: `['--yes', '--preset', 'solo', '--branch', 'main']`）
- **Output**: `InitFlags` オブジェクト
- **Parsing rules**:
  - `--yes` / `-y`: boolean フラグ（値なし）
  - `--preset <value>`: 次の引数を値として取得
  - `--branch <value>`: 次の引数を値として取得
  - `--lang <value>`: 次の引数を値として取得
  - `--claude-md-path <value>`: 次の引数を値として取得
  - 認識できないフラグは無視（既存の positional arg として扱う）
- **Errors**: パース自体ではエラーを出さない。バリデーションは `runInit` 内で行う。

### runInit(args: string[]): Promise<void>
- **変更後の処理フロー**:
  1. `parseInitFlags(args)` でフラグ抽出
  2. `flags.preset` が指定されている場合、バリデーション（FR-050）
  3. `flags.lang` が指定されている場合、バリデーション（FR-051）
  4. `flags.yes` かつフラグ未指定の項目はデフォルト値で解決
  5. フラグ未指定かつ `!flags.yes` の項目のみ prompter で質問
  6. `initProject()` を呼び出し

## Error Handling Strategy

| Case | Action | Exit Code |
|------|--------|-----------|
| Invalid `--preset` value | `log.error` + valid presets 表示 | 1 |
| Invalid `--lang` value | `log.error` + valid langs 表示 | 1 |
| `--branch ""` (空文字列) | `detectBaseBranch()` にフォールバック | — |

## Testing Strategy

### Unit tests (`test/commands/init.test.ts`)
- `parseInitFlags`: 各フラグの組み合わせパース（`--yes`, `--preset solo`, 複合フラグ、未知フラグ、空配列）
- `runInit` のフロー: prompter のモックを使い、フラグ指定時に `ask` が呼ばれないことを検証

### Integration tests
- `npx konbini init --yes` がゼロ入力で完了すること
- `npx konbini init --preset invalid` がエラー終了すること

### Edge cases
- `--preset custom --yes`: カスタムプロンプトなしでデフォルト値適用
- `--branch "" --yes`: 空文字列でも auto-detect にフォールバック
- フラグなし: 既存の全インタラクティブフロー維持

## Requirements Traceability

| Requirement | Design Component |
|-------------|------------------|
| FR-001 | `runInit` の `flags.yes` 分岐 |
| FR-002 | `runInit` のフラグなし時のパス（変更なし） |
| FR-010 | `parseInitFlags` の `--preset` + `runInit` のスキップロジック |
| FR-011 | `parseInitFlags` の `--branch` + `runInit` のスキップロジック |
| FR-012 | `parseInitFlags` の `--lang` + `runInit` のスキップロジック |
| FR-013 | `parseInitFlags` の `--claude-md-path` + `runInit` のスキップロジック |
| FR-020–FR-023 | `runInit` の `flags.yes` 時デフォルト解決ロジック |
| FR-030 | `runInit` のフラグ個別スキップロジック |
| FR-031 | `runInit` の `custom` + `yes` 分岐 |
| FR-040 | `runInit` の `custom` + `!yes` 分岐 |
| FR-041 | `runInit` の空文字列フォールバック |
| FR-050 | `runInit` の preset バリデーション |
| FR-051 | `runInit` の lang バリデーション |
| NFR-001 | フラグなし時は既存パスを通過 |
| NFR-002 | 手動パーサー（外部依存なし） |
| NFR-010 | `HELP` テキスト更新 |

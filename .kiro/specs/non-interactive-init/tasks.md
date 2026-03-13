# Implementation Tasks: non-interactive-init

## Document Info
- Feature: non-interactive-init
- Total tasks: 5
- Parallelizable: 2 (T-001 と T-002)
- Created: 2026-03-13

## Task Dependency Graph

```
T-001 (parseInitFlags) ──┐
                         ├── T-003 (runInit 改修) ── T-004 (HELP 更新) ── T-005 (統合テスト)
T-002 (parseInitFlags   │
       テスト) ──────────┘
```

## Parallel Execution Groups

| Group | Tasks | 説明 |
|-------|-------|------|
| Group 1 | T-001, T-002 | parseInitFlags 実装とテストは同一ファイルだが独立して着手可能（型定義を先に書けばテストは並行作成可） |
| Group 2 | T-003 | runInit 改修（T-001 完了後） |
| Group 3 | T-004 | HELP テキスト更新（T-003 完了後） |
| Group 4 | T-005 | 統合テスト（全タスク完了後） |

## Tasks

### T-001: InitFlags 型と parseInitFlags 関数の実装 (P)
- **Description**: `InitFlags` インターフェースを定義し、`parseInitFlags(args)` 関数を実装する。ループベースの手動パーサーで `--yes`/`-y`, `--preset`, `--branch`, `--lang`, `--claude-md-path` を処理。
- **Files**: `src/commands/init.ts`
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `InitFlags` 型が export されている
  - [x] `parseInitFlags` が export されている
  - [x] `--yes` / `-y` が `yes: true` にパースされる
  - [x] `--preset solo` が `preset: 'solo'` にパースされる
  - [x] `--branch`, `--lang`, `--claude-md-path` が各フィールドにパースされる
  - [x] 未知のフラグは無視される
  - [x] 空配列で `{ yes: false }` が返る
- **Tests**: T-002 で実施
- **Effort**: Small

### T-002: parseInitFlags の単体テスト (P)
- **Description**: `parseInitFlags` のパース動作を網羅的にテストする。
- **Files**: `test/commands/init.test.ts`
- **Dependencies**: None（T-001 の型定義のみ依存。並行着手可）
- **Acceptance Criteria**:
  - [x] `--yes` 単体のテスト
  - [x] `-y` 短縮形のテスト
  - [x] `--preset <value>` のテスト
  - [x] 全フラグ組み合わせのテスト
  - [x] 空配列のテスト
  - [x] 未知フラグ混在のテスト
- **Tests**: `describe('parseInitFlags', ...)` ブロック
- **Effort**: Small

### T-003: runInit のフラグ対応改修
- **Description**: `runInit` を改修し、`parseInitFlags` の結果に基づいてインタラクティブプロンプトをスキップするロジックを追加。バリデーション（FR-050, FR-051）、デフォルト解決（FR-020–FR-023）、部分フラグ（FR-030）、custom + yes（FR-031）を実装。
- **Files**: `src/commands/init.ts`, `test/commands/init.test.ts`
- **Dependencies**: T-001, T-002
- **Acceptance Criteria**:
  - [x] `--yes` で全プロンプトがスキップされデフォルト値が使われる
  - [x] `--preset solo` 指定でプリセットプロンプトのみスキップ、他は質問される
  - [x] `--preset invalid` でエラー終了（exit code 1）+ valid presets 表示
  - [x] `--lang invalid` でエラー終了（exit code 1）+ valid langs 表示
  - [x] `--preset custom --yes` でカスタムプロンプトなし、デフォルト値適用
  - [x] `--preset custom`（`--yes` なし）でカスタムプロンプト表示
  - [x] `--branch ""`  で auto-detect にフォールバック
  - [x] フラグなしで既存の全インタラクティブ動作が維持される
- **Tests**: `describe('runInit — non-interactive flags', ...)` ブロック（prompter モックで `ask` 呼び出し回数を検証）
- **Effort**: Medium

### T-004: HELP テキストの更新
- **Description**: `src/cli.ts` の HELP 定数に新フラグのドキュメントと非インタラクティブ実行例を追加。
- **Files**: `src/cli.ts`
- **Dependencies**: T-003
- **Acceptance Criteria**:
  - [x] `--yes` / `-y` の説明が含まれる
  - [x] `--preset`, `--branch`, `--lang`, `--claude-md-path` の説明が含まれる
  - [x] 非インタラクティブ one-liner の例が含まれる（例: `npx konbini init --yes`）
- **Tests**: 既存の `test/cli.test.ts` で `--help` 出力にフラグ名が含まれることを検証
- **Effort**: Small

### T-005: 統合テスト・動作確認
- **Description**: ビルド後に実際のコマンドで非インタラクティブ実行の E2E 確認。`npx konbini init --yes` が stdin なしで完了すること、各フラグの組み合わせが正しく動作することを検証。
- **Files**: `test/commands/init.test.ts`
- **Dependencies**: T-003, T-004
- **Acceptance Criteria**:
  - [x] `npx konbini init --yes` が stdin 入力なしで成功する
  - [x] `npx konbini init --preset solo --branch main --lang en --yes` が期待通りの設定で完了する
  - [x] `npx konbini init --preset bad --yes` がエラー終了する
  - [x] 全テストスイートがパスする (`npm test`)
- **Tests**: 統合テストケース追加
- **Effort**: Small

## File Conflict Matrix

| Task | Files | Conflicts With |
|------|-------|---------------|
| T-001 | `src/commands/init.ts` | T-003 |
| T-002 | `test/commands/init.test.ts` | T-003, T-005 |
| T-003 | `src/commands/init.ts`, `test/commands/init.test.ts` | T-001, T-002, T-005 |
| T-004 | `src/cli.ts` | None |
| T-005 | `test/commands/init.test.ts` | T-002, T-003 |

## Requirements Traceability

| Requirement | Tasks |
|------------|-------|
| FR-001 | T-003 |
| FR-002 | T-003 |
| FR-010 | T-001, T-003 |
| FR-011 | T-001, T-003 |
| FR-012 | T-001, T-003 |
| FR-013 | T-001, T-003 |
| FR-020–FR-023 | T-003 |
| FR-030 | T-003 |
| FR-031 | T-003 |
| FR-040 | T-003 |
| FR-041 | T-003 |
| FR-050 | T-003 |
| FR-051 | T-003 |
| NFR-001 | T-003, T-005 |
| NFR-002 | T-001 |
| NFR-010 | T-004 |

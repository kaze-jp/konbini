# Implementation Tasks: claude-md-sdd-injection

## Document Info
- Feature: claude-md-sdd-injection
- Total tasks: 7
- Parallelizable: 2 (T-001, T-002)
- Created: 2026-03-13

## Task Dependency Graph

```
T-001 (templates)  ──┐
                     ├──▶ T-003 (injector core) ──▶ T-004 (injector interactive) ──▶ T-005 (init/update integration)
T-002 (yaml util)  ──┘                                                                        │
                                                                                               ▼
                                                                                        T-006 (ao.yaml template)
                                                                                               │
                                                                                               ▼
                                                                                        T-007 (integration test)
```

## Parallel Execution Groups

| Group | Tasks | Rationale |
|-------|-------|-----------|
| Group 1 | T-001, T-002 | ファイル依存なし。テンプレートとユーティリティは独立 |
| Group 2 | T-003 | T-001, T-002 に依存 |
| Group 3 | T-004 | T-003 に依存 |
| Group 4 | T-005, T-006 | T-004 に依存。ただし T-005 と T-006 はファイルが異なるため並列可だが、T-006 は T-005 で ao.yaml 書き込みロジックが必要なため直列 |
| Group 5 | T-007 | 全タスク完了後 |

## Tasks

### T-001: Language Templates (P)
- **Description**: `templates/claude-md/en.md` と `templates/claude-md/ja.md` を作成。SDD強制ルール、コマンドフロー、スキップ条件、konbini利用の必須事項を含む。`{{VERSION}}` プレースホルダを使用。
- **Files**:
  - `templates/claude-md/en.md` (create)
  - `templates/claude-md/ja.md` (create)
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] en.md に SDD 強制ルール、コマンドフロー、スキップ条件、konbini 必須事項が自然な英語で記述されている
  - [x] ja.md に同等の内容が自然な日本語で記述されている
  - [x] 両ファイルに `{{VERSION}}` プレースホルダが含まれている
  - [x] 内容が FR-040〜FR-043 の要件を満たしている
- **Tests**: テンプレートの静的検証（T-003 のテストでカバー）
- **Effort**: Small

### T-002: yaml.ts Extension for Nested Key Reading (P)
- **Description**: `src/utils/yaml.ts` に `parseNestedYamlValue()` を追加。`claude_md.language` や `claude_md.path` のようなネストされたキーを読み取れるようにする。
- **Files**:
  - `src/utils/yaml.ts` (modify)
  - `test/utils/yaml.test.ts` (create)
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] `parseNestedYamlValue(content, 'claude_md.language')` が正しい値を返す
  - [x] `parseNestedYamlValue(content, 'claude_md.path')` が正しい値を返す
  - [x] 存在しないキーに対して `undefined` を返す
  - [x] 既存の `parseTopLevelYaml` が壊れていない
- **Tests**: `parseNestedYamlValue` のユニットテスト
- **Effort**: Small

### T-003: claude-md-injector Core Functions
- **Description**: `src/generators/claude-md-injector.ts` を作成。`detectLanguage()`, `buildSection()`, `injectSection()` の3つの純粋関数を実装。
- **Files**:
  - `src/generators/claude-md-injector.ts` (create)
  - `test/generators/claude-md-injector.test.ts` (create)
- **Dependencies**: T-001 (テンプレートファイルの形式を確認するため)
- **Acceptance Criteria**:
  - [x] `detectLanguage`: 日本語テキスト→`"ja"`, 英語テキスト→`"en"`, 空→`"en"`
  - [x] `buildSection`: テンプレート + バージョン → マーカー付きセクション
  - [x] `injectSection`: 空コンテンツ、マーカーなし追加、マーカー置換、壊れたマーカー、空マーカー間の全ケース
  - [x] 全関数が純粋関数（副作用なし）
- **Tests**: 各関数の網羅的ユニットテスト（design.md の Testing Strategy セクション参照）
- **Effort**: Medium

### T-004: claude-md-injector Interactive & File I/O Functions
- **Description**: `injectClaudeMd()` と `injectClaudeMdInteractive()` を実装。ファイル読み書き、言語検出、インタラクティブプロンプト、エラーハンドリングを含む。
- **Files**:
  - `src/generators/claude-md-injector.ts` (modify)
  - `test/generators/claude-md-injector.test.ts` (modify)
- **Dependencies**: T-002, T-003
- **Acceptance Criteria**:
  - [x] `injectClaudeMd()` が設定に基づいて CLAUDE.md を正しく生成/更新
  - [x] `injectClaudeMdInteractive()` が言語・パスをインタラクティブに取得
  - [x] CLAUDE.md が存在しない場合に新規作成
  - [x] 親ディレクトリが存在しない場合に自動作成
  - [x] 書き込みエラー時に例外を投げずログ出力して続行
- **Tests**: 一時ディレクトリを使ったファイルI/Oテスト
- **Effort**: Medium

### T-005: init.ts / update.ts Integration
- **Description**: `init.ts` に CLAUDE.md 注入ステップを追加。`update.ts` に ao.yaml からの設定読み取り + CLAUDE.md 更新を追加。
- **Files**:
  - `src/commands/init.ts` (modify)
  - `src/commands/update.ts` (modify)
- **Dependencies**: T-004
- **Acceptance Criteria**:
  - [x] `konbini init` 実行で CLAUDE.md が生成される
  - [x] `konbini init` で選択した言語・パスが ao.yaml に反映される
  - [x] `konbini update` で CLAUDE.md のセクションが最新テンプレートに更新される
  - [x] `konbini update` で ao.yaml に設定がない場合デフォルト値で動作
  - [x] 既存の init/update フローが壊れていない
- **Tests**: 既存テストが通ること（統合テストは T-007）
- **Effort**: Small

### T-006: ao.yaml Template Extension
- **Description**: `templates/config/ao.yaml.template` に `claude_md` セクションを追加。`template-copier.ts` にプレースホルダ置換を追加。
- **Files**:
  - `templates/config/ao.yaml.template` (modify)
  - `src/generators/template-copier.ts` (modify)
- **Dependencies**: T-005
- **Acceptance Criteria**:
  - [x] ao.yaml テンプレートに `claude_md.language` と `claude_md.path` が含まれる
  - [x] `{{CLAUDE_MD_LANG}}` と `{{CLAUDE_MD_PATH}}` が正しく置換される
  - [x] 既存のプレースホルダ置換が壊れていない
- **Tests**: 既存の template-copier テストを更新
- **Effort**: Small

### T-007: Integration & Smoke Test
- **Description**: エンドツーエンドの統合テスト。`konbini init` → CLAUDE.md 確認 → `konbini update` → 冪等性確認 → ユーザーコンテンツ保持確認。
- **Files**:
  - `test/integration/claude-md-injection.test.ts` (create)
- **Dependencies**: T-005, T-006
- **Acceptance Criteria**:
  - [x] init → CLAUDE.md にSDD セクションが存在
  - [x] init × 2 → CLAUDE.md の内容が同一（冪等）
  - [x] 既存コンテンツ付き CLAUDE.md → ユーザーコンテンツ保持
  - [x] update → セクションのみ更新
  - [x] en/ja 両言語でテンプレートが正しく注入される
- **Tests**: この タスク自体がテスト
- **Effort**: Medium

## File Conflict Matrix

| Task | Files | Conflicts With |
|------|-------|---------------|
| T-001 | `templates/claude-md/en.md`, `ja.md` | None |
| T-002 | `src/utils/yaml.ts`, `test/utils/yaml.test.ts` | None |
| T-003 | `src/generators/claude-md-injector.ts`, `test/generators/claude-md-injector.test.ts` | T-004 |
| T-004 | `src/generators/claude-md-injector.ts`, `test/generators/claude-md-injector.test.ts` | T-003 |
| T-005 | `src/commands/init.ts`, `src/commands/update.ts` | None |
| T-006 | `templates/config/ao.yaml.template`, `src/generators/template-copier.ts` | None |
| T-007 | `test/integration/claude-md-injection.test.ts` | None |

## Requirements Traceability

| Requirement | Tasks |
|------------|-------|
| FR-001 (inject on init) | T-005 |
| FR-002 (update on update) | T-005 |
| FR-003 (include version) | T-003 |
| FR-004 (user language) | T-001, T-004 |
| FR-010 (marker comments) | T-003 |
| FR-011 (replace between markers) | T-003 |
| FR-012 (append if no markers) | T-003 |
| FR-013 (create if no file) | T-004 |
| FR-014 (preserve content) | T-003, T-007 |
| FR-020 (auto-detect lang) | T-003 |
| FR-021 (default English) | T-003 |
| FR-022 (interactive lang) | T-004 |
| FR-023 (en/ja support) | T-001 |
| FR-024 (update uses ao.yaml) | T-002, T-005 |
| FR-030 (interactive path) | T-004 |
| FR-031, FR-032 (store in ao.yaml) | T-005, T-006 |
| FR-040–043 (injected content) | T-001 |
| FR-050 (create parent dirs) | T-004 |
| FR-051 (empty between markers) | T-003 |
| FR-052 (broken markers) | T-003 |
| FR-060 (write error) | T-004 |
| FR-061 (no config in update) | T-005 |
| NFR-001 (idempotent) | T-003, T-007 |
| NFR-002 (preserve outside) | T-003, T-007 |
| NFR-010 (separate templates) | T-001 |
| NFR-011 (variable substitution) | T-003 |
| NFR-020 (no parsing interference) | T-003 |
| NFR-021 (follow existing patterns) | T-003, T-004, T-005 |

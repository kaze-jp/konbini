# Implementation Tasks: i18n-ears-templates

## Document Info
- Feature: i18n-ears-templates
- Total tasks: 6
- Parallelizable: 2 tasks marked with (P)
- Created: 2026-03-17

## Task Dependency Graph

```
T-001 (locale files en) ──┐
                          ├──→ T-003 (paths.ts + template-copier) ──→ T-005 (init.ts + ao.yaml.template) ──→ T-006 (integration + smoke)
T-002 (locale files ja) ──┘                                           │
                                                                      │
T-004 (command templates) ────────────────────────────────────────────┘
```

## Parallel Execution Groups

| Group | Tasks | Description |
|-------|-------|-------------|
| Group 1 | T-001, T-002 | ロケールファイル作成（en, ja 独立） |
| Group 2 | T-003 | パス定義 + テンプレートコピー拡張 |
| Group 3 | T-004 | コマンドテンプレートにローカライゼーション指示追記 |
| Group 4 | T-005 | init.ts + ao.yaml.template 拡張 |
| Group 5 | T-006 | 統合テスト + スモークテスト |

## Tasks

### T-001: English ロケールファイル作成 (P)

- **Description**: `templates/locales/en/` ディレクトリを作成し、既存の英語テンプレートから `ears-patterns.md`, `section-headers.yaml`, `boilerplate.yaml` を作成する。`ears-patterns.md` は既存の `templates/rules/ears-format.md` の内容をベースにする。
- **Files**:
  - Create: `templates/locales/en/ears-patterns.md`
  - Create: `templates/locales/en/section-headers.yaml`
  - Create: `templates/locales/en/boilerplate.yaml`
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `ears-patterns.md` に5つのEARSパターン（Ubiquitous, Event-Driven, State-Driven, Optional, Unwanted）のテンプレートと例が英語で記述されている
  - [ ] `section-headers.yaml` に `requirements_init`, `requirements`, `design`, `tasks` の各セクションヘッダーが定義されている
  - [ ] `boilerplate.yaml` にステータスラベル、next-step指示等の汎用テキストが定義されている
- **Tests**: T-006 のスモークテストでカバー
- **Effort**: Small

### T-002: Japanese ロケールファイル作成 (P)

- **Description**: `templates/locales/ja/` ディレクトリを作成し、T-001 の英語版と同一キーセットで日本語ロケールファイルを作成する。EARS パターンは issue #12 で定義された日本語構文を使用する。
- **Files**:
  - Create: `templates/locales/ja/ears-patterns.md`
  - Create: `templates/locales/ja/section-headers.yaml`
  - Create: `templates/locales/ja/boilerplate.yaml`
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] `ears-patterns.md` に5つのEARSパターンが日本語で記述されている（"システムは〜すること" 等）
  - [ ] `section-headers.yaml` が T-001 の `en` 版と同一キーセットを持つ
  - [ ] `boilerplate.yaml` が T-001 の `en` 版と同一キーセットを持つ
- **Tests**: T-006 のスモークテストでカバー
- **Effort**: Small

### T-003: paths.ts + template-copier.ts 拡張

- **Description**: `TargetPaths` に `locales` フィールドを追加し、`copyTemplates()` でロケールディレクトリをコピーするようにする。
- **Files**:
  - Modify: `src/utils/paths.ts`
  - Modify: `src/generators/template-copier.ts`
  - Modify: `test/utils/paths.test.ts`
  - Modify: `test/generators/template-copier.test.ts`
- **Dependencies**: T-001, T-002
- **Acceptance Criteria**:
  - [ ] `getTargetPaths()` が `locales: path.join(projectRoot, '.kiro', 'settings', 'locales')` を返す
  - [ ] `copyTemplates()` が `templates/locales/` を `.kiro/settings/locales/` にコピーする
  - [ ] 既存テスト + 新規テストがすべてパスする
- **Tests**:
  - `paths.test.ts`: `locales` フィールドの存在と正しいパスを検証
  - `template-copier.test.ts`: コピー後にロケールディレクトリが存在することを検証
- **Effort**: Small

### T-004: コマンドテンプレートにローカライゼーション指示追記

- **Description**: `spec-init.md`, `spec-requirements.md`, `spec-design.md`, `spec-tasks.md` の各コマンドテンプレートに、ロケールファイル読み込みと適用の指示セクションを追記する。
- **Files**:
  - Modify: `templates/commands/spec-init.md`
  - Modify: `templates/commands/spec-requirements.md`
  - Modify: `templates/commands/spec-design.md`
  - Modify: `templates/commands/spec-tasks.md`
- **Dependencies**: T-001, T-002
- **Acceptance Criteria**:
  - [ ] 各コマンドテンプレートに `## Localization` セクションが追記されている
  - [ ] 言語解決の優先順位（`language` → `claude_md.language` → `en`）が明記されている
  - [ ] フォールバック時の警告メッセージ指示が含まれている
  - [ ] `spec-requirements.md` には `ears-patterns.md` 読み込み指示が含まれている
- **Tests**: T-006 のスモークテストでカバー
- **Effort**: Small

### T-005: init.ts + ao.yaml.template 拡張

- **Description**: `ao.yaml.template` にトップレベル `language` フィールドを追加し、`init.ts` の `initProject()` と `template-copier.ts` の `copyTemplates()` で `{{LANGUAGE}}` プレースホルダーを置換する。
- **Files**:
  - Modify: `templates/config/ao.yaml.template`
  - Modify: `src/generators/template-copier.ts`
  - Modify: `test/commands/init.test.ts`
- **Dependencies**: T-003
- **Acceptance Criteria**:
  - [ ] `ao.yaml.template` にトップレベル `language: {{LANGUAGE}}` が追加されている（コメント付き）
  - [ ] `copyTemplates()` が `{{LANGUAGE}}` を設定値で置換する
  - [ ] `--lang ja` で初期化した場合、生成された `ao.yaml` に `language: ja` が含まれる
  - [ ] `--lang` 未指定のデフォルトで `language: en` が設定される
  - [ ] 既存テストがすべてパスする
- **Tests**:
  - `init.test.ts`: `--lang ja` / `--lang en` / デフォルトの各ケースで `ao.yaml` の `language` フィールドを検証
- **Effort**: Medium

### T-006: 統合テスト + スモークテスト

- **Description**: ロケールファイルの整合性スモークテスト、および `konbini init --lang ja` の統合テストを追加する。
- **Files**:
  - Modify: `test/templates/smoke.test.ts`
  - Create: `test/generators/locale-smoke.test.ts`
- **Dependencies**: T-003, T-004, T-005
- **Acceptance Criteria**:
  - [ ] 各ロケールディレクトリに `ears-patterns.md`, `section-headers.yaml`, `boilerplate.yaml` が存在することを検証
  - [ ] `ja` ロケールが `en` ロケールと同一キーセットを持つことを検証
  - [ ] `ears-patterns.md` に5つのEARSパターンが含まれることを検証
  - [ ] すべてのテストがパスする（`npm test`）
  - [ ] 型チェックがパスする（`npx tsc --noEmit`）
- **Tests**: このタスク自体がテスト作成タスク
- **Effort**: Medium

## File Conflict Matrix

| Task | Files | Conflicts With |
|------|-------|---------------|
| T-001 | `templates/locales/en/*` (create) | None |
| T-002 | `templates/locales/ja/*` (create) | None |
| T-003 | `src/utils/paths.ts`, `src/generators/template-copier.ts`, `test/utils/paths.test.ts`, `test/generators/template-copier.test.ts` | T-005 (`template-copier.ts`) |
| T-004 | `templates/commands/spec-*.md` | None |
| T-005 | `templates/config/ao.yaml.template`, `src/generators/template-copier.ts`, `test/commands/init.test.ts` | T-003 (`template-copier.ts`) |
| T-006 | `test/templates/smoke.test.ts`, `test/generators/locale-smoke.test.ts` (create) | None |

## Requirements Traceability

| Requirement | Tasks |
|------------|-------|
| FR-001, FR-002 | T-005 |
| FR-003 | T-001, T-002 |
| FR-004 | T-001 |
| FR-005 | T-002 |
| FR-010, FR-011, FR-012, FR-013 | T-004 |
| FR-014 | T-001, T-002 |
| FR-020, FR-021, FR-022 | T-001, T-002, T-003 |
| FR-030, FR-031, FR-032 | T-005 |
| FR-040, FR-041, FR-042 | T-004 (指示内で定義) |
| FR-050, FR-051 | T-001, T-002, T-003, T-004 (アーキテクチャで保証) |
| NFR-001 | T-003 (静的ファイル読み取りのみ) |
| NFR-010, NFR-011 | T-005 (デフォルト `en`) |
| NFR-012 | T-005 |
| NFR-020, NFR-021 | T-001, T-002, T-006 |

---

**Status:** ⏳ Awaiting R3 approval
**Next:** After approval, run `/kiro:spec-impl` or `/kiro:ao-run` to begin implementation.

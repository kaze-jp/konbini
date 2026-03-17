# Technical Design: i18n-ears-templates

## Document Info
- Feature: i18n-ears-templates
- Status: Draft
- Created: 2026-03-17
- Requirements: ./requirements.md

## Architecture Overview

既存の `claude-md-injector.ts` が採用している言語別テンプレートファイル方式（`templates/claude-md/{lang}.md`）を踏襲し、specテンプレートにも同じパターンを適用する。

```
templates/
├── claude-md/          # 既存（変更なし）
│   ├── en.md
│   └── ja.md
├── locales/            # 新規: specドキュメント用ロケール
│   ├── en/
│   │   ├── ears-patterns.md
│   │   ├── section-headers.yaml
│   │   └── boilerplate.yaml
│   └── ja/
│       ├── ears-patterns.md
│       ├── section-headers.yaml
│       └── boilerplate.yaml
├── spec-templates/     # 既存（変更なし — ヘッダーをプレースホルダー化）
│   ├── requirements-init.md
│   ├── requirements.md
│   ├── tasks.md
│   └── research.md
├── rules/
│   └── ears-format.md  # 既存（変更なし — コマンドテンプレートが動的注入）
└── commands/           # 既存（ロケール読み込みの指示を追記）
    ├── spec-init.md
    ├── spec-requirements.md
    ├── spec-design.md
    └── spec-tasks.md
```

**設計方針**: コマンドテンプレート（`.md`）はAIエージェントへの指示書であり、TypeScriptコードではない。言語切り替えはロケールファイルを提供し、コマンドテンプレートに「ロケールファイルを読み込んで適用せよ」と指示を追記する方式を採る。

```
┌──────────────┐    reads     ┌─────────────┐
│  ao.yaml     │ ──────────→  │ language: ja │
│  (language)  │              └──────┬──────┘
└──────────────┘                     │
                                     ▼
┌──────────────────┐    resolves   ┌───────────────────────┐
│ Command Template │ ────────────→ │ templates/locales/ja/  │
│ (spec-init.md)   │               │  ├ ears-patterns.md    │
│                  │               │  ├ section-headers.yaml│
│                  │               │  └ boilerplate.yaml    │
└──────────────────┘               └───────────────────────┘
         │
         ▼
┌──────────────────┐
│ Generated spec   │  ← section headers + EARS patterns in Japanese
│ (requirements.md)│
└──────────────────┘
```

## Component Design

### Component: Locale Files (`templates/locales/{lang}/`)

- **Purpose**: 各言語のEARS構文パターン、セクションヘッダー、ボイラープレートテキストを格納
- **Location**: `templates/locales/en/`, `templates/locales/ja/`
- **Dependencies**: なし（静的ファイル）
- **Interface**: AIエージェントがファイルを読み取り、生成物に反映

#### `ears-patterns.md`

EARS構文パターンとその例を言語別に記述。`ears-format.md` のローカライズ版として機能する。

```markdown
# EARS Format Rules ({lang})

## Patterns

### Ubiquitous
**Template**: "システムは<action>すること"  (ja)
**Example**: "システムはすべての保存データをAES-256で暗号化すること"

### Event-Driven
**Template**: "<event>した場合、システムは<action>すること"
...
```

#### `section-headers.yaml`

specドキュメントの各セクションヘッダーをキーバリュー形式で管理。

```yaml
# section-headers.yaml (ja)
requirements_init:
  title: "{{FEATURE_NAME}} — 要件定義（初期）"
  overview: "概要"
  user_stories: "ユーザーストーリー"
  functional: "機能要件"
  non_functional: "非機能要件"
  open_questions: "未解決事項"
  next_step: "**次のステップ:** `/kiro:spec-requirements` を実行して完全なEARS形式の要件に展開してください。"

requirements:
  title: "{{FEATURE_NAME}} — 要件定義"
  subtitle: "requirements-init から EARS 形式で展開"
  ubiquitous: "常時要件"
  event_driven: "イベント駆動要件"
  state_driven: "状態駆動要件"
  optional: "条件付き要件"
  unwanted: "異常系要件"
  acceptance_criteria: "受入基準"
  constraints: "制約"
  dependencies: "依存関係"
  status_awaiting: "⏳ R1 承認待ち"
  next_step: "承認後、`/kiro:spec-design` を実行して技術設計を作成してください。"

design:
  title: "{{FEATURE_NAME}} — 技術設計"
  architecture_overview: "アーキテクチャ概要"
  component_design: "コンポーネント設計"
  api_contracts: "API コントラクト"
  data_models: "データモデル"
  testing_strategy: "テスト戦略"
  requirements_traceability: "要件トレーサビリティ"

tasks:
  title: "{{FEATURE_NAME}} — 実装タスク"
  parallel_analysis: "並列分析"
  tasks: "タスク"
  file_conflict_analysis: "ファイル競合分析"
  status_awaiting: "⏳ R3 承認待ち"
  next_step: "承認後、`/kiro:spec-impl` または `/kiro:ao-run` を実行して実装を開始してください。"
```

#### `boilerplate.yaml`

ステータスラベルや汎用テキスト。

```yaml
# boilerplate.yaml (ja)
created_by: "Created by `/kiro:spec-init`"
expanded_from: "requirements-init から EARS 形式で展開"
generated_from: "承認済み設計から生成"
status_draft: "ドラフト"
status_awaiting_r1: "⏳ R1 承認待ち"
status_awaiting_r2: "⏳ R2 承認待ち"
status_awaiting_r3: "⏳ R3 承認待ち"
```

### Component: Language Resolution Logic (in command templates)

- **Purpose**: `ao.yaml` から言語設定を読み取り、対応するロケールディレクトリを解決する
- **Location**: 各コマンドテンプレート（`spec-init.md`, `spec-requirements.md`, `spec-design.md`, `spec-tasks.md`）に指示として追記
- **Dependencies**: `ao.yaml`, `templates/locales/`
- **Interface**: コマンドテンプレート内のテキスト指示

追記する指示の内容:

```markdown
## Localization

1. Read `.ao/ao.yaml` and extract the `language` field (top-level).
   - If not present, fall back to `claude_md.language`.
   - If neither exists, default to `en`.
2. Read the locale files from `.kiro/settings/locales/{language}/`:
   - `section-headers.yaml` for section header text
   - `ears-patterns.md` for EARS syntax patterns (spec-requirements only)
   - `boilerplate.yaml` for status labels and boilerplate
3. If the locale directory does not exist, fall back to `en` and warn the user.
4. Apply the localized text when generating the spec document.
```

### Component: `ao.yaml` Schema Extension

- **Purpose**: トップレベル `language` フィールドを追加
- **Location**: `templates/config/ao.yaml.template`
- **Dependencies**: なし
- **Interface**: 既存の `parseTopLevelYaml()` で読み取り可能（トップレベルキー）

変更内容:
```yaml
# ao.yaml.template に追加
language: {{LANGUAGE}}  # en, ja — spec document language
```

### Component: `init.ts` Extension

- **Purpose**: `language` フィールドの初期値設定、ロケールファイルのコピー
- **Location**: `src/commands/init.ts`, `src/generators/template-copier.ts`
- **Dependencies**: `parseTopLevelYaml()`, `getTemplatePath()`
- **Interface**: 既存の `InitFlags`, `InitConfig` 型を拡張

#### `init.ts` の変更

- `ao.yaml` テンプレートの `{{LANGUAGE}}` プレースホルダーを `claudeMdConfig.language` で置換
- `language` フィールドは `claude_md.language` と同じ値を設定（将来的に独立可能）

#### `template-copier.ts` の変更

- `copyTemplates()` に `locales` ディレクトリのコピーを追加:
  ```typescript
  // Locales
  copyDir(getTemplatePath('locales'), paths.locales, overwrite);
  ```

#### `paths.ts` の変更

- `TargetPaths` に `locales` フィールドを追加:
  ```typescript
  locales: path.join(projectRoot, '.kiro', 'settings', 'locales'),
  ```

## API Contracts

### `parseTopLevelYaml()` (既存、変更なし)

- **Signature**: `parseTopLevelYaml(content: string): Record<string, unknown>`
- **Input**: `ao.yaml` のファイル内容（文字列）
- **Output**: トップレベルキーのオブジェクト。`language` フィールドが文字列として含まれる
- **Errors**: パース不能な行は無視される（既存動作）
- **Example**: `{ preset: 'solo', language: 'ja', schema_version: 1 }`

### `getTemplatePath()` (既存、変更なし)

- **Signature**: `getTemplatePath(relativePath: string): string`
- **Input**: `'locales/ja/section-headers.yaml'` 等の相対パス
- **Output**: 絶対パス
- **Errors**: パスの存在確認は呼び出し側の責任

### Language resolution (コマンドテンプレート内のロジック)

- **Input**: `ao.yaml` の内容
- **Output**: ISO 639-1 言語コード（`'en'` | `'ja'`）
- **Resolution order**:
  1. `ao.yaml` のトップレベル `language` フィールド
  2. `ao.yaml` の `claude_md.language` フィールド
  3. デフォルト `'en'`
- **Errors**: 未サポート言語コード → `'en'` にフォールバック + 警告メッセージ

## Data Models

### Locale Directory Structure

- **Fields**:
  - `ears-patterns.md`: Markdown ファイル（EARS 5パターンのテンプレートと例）
  - `section-headers.yaml`: YAML ファイル（セクション識別子 → ローカライズ済みヘッダー文字列）
  - `boilerplate.yaml`: YAML ファイル（ステータスラベル等の汎用テキスト）
- **Validation**:
  - 各ロケールディレクトリは3ファイルすべてを含むこと
  - `en` ロケールは必須（フォールバック先）
  - YAML ファイルのキーは `en` ロケールと同一であること
- **Relationships**: `en` ロケールがリファレンス実装、他ロケールは同一キーセットを持つ

### `ao.yaml` Schema (追加フィールド)

- **Fields**:
  - `language`: `string` (ISO 639-1, デフォルト `'en'`)
- **Validation**: `['en', 'ja']` のいずれか（未サポート値は `'en'` にフォールバック）
- **Relationships**: `claude_md.language` と初期値は同一、将来的に独立可能

## State Management

状態管理は不要。すべての言語解決は `ao.yaml` の静的読み取りで完結する。ロケールファイルも静的アセットとしてコピーされるのみ。

## Error Handling Strategy

| Error | Handling | User Message |
|-------|----------|-------------|
| `language` フィールドなし | `claude_md.language` → `'en'` にフォールバック | なし（暗黙のデフォルト） |
| 未サポート言語コード | `'en'` にフォールバック | `"Warning: Language '{code}' is not supported. Falling back to English."` |
| ロケールディレクトリなし | `en` ロケールを使用 | `"Warning: Locale '{lang}' not found. Using English."` |
| ロケールファイル一部欠損 | 欠損キーのみ `en` からフォールバック | `"Warning: Missing key '{key}' in {lang} locale. Using English default."` |
| YAML パースエラー | `en` ロケール全体にフォールバック | `"Error: Malformed YAML in {file}. Falling back to English locale."` |

## Testing Strategy

### Unit Tests

- `test/utils/locale-resolver.test.ts` (新規想定 — ロケール解決ロジックをユーティリティ化する場合):
  - `language` フィールドの読み取りと優先順位
  - 未サポート言語のフォールバック
  - ロケールファイル不在時のフォールバック

### Integration Tests

- `test/generators/template-copier.test.ts` (既存に追加):
  - `copyTemplates()` がロケールディレクトリを正しくコピーすることを検証
  - `en` と `ja` の両ロケールが含まれることを検証

- `test/commands/init.test.ts` (既存に追加):
  - `--lang ja` 指定時に `ao.yaml` の `language: ja` が設定されること
  - デフォルト（`--lang` なし）で `language: en` が設定されること

### Smoke Tests

- `test/templates/smoke.test.ts` (既存に追加):
  - 各ロケールディレクトリに必要な3ファイルが存在すること
  - `section-headers.yaml` が `en` と同じキーセットを持つこと
  - `ears-patterns.md` に5つのEARSパターンが含まれること

### Edge Cases

- `ao.yaml` に `language` も `claude_md.language` もない場合 → `en`
- `language: zh`（未サポート）→ `en` フォールバック + 警告
- ロケールディレクトリはあるが一部ファイルが欠損 → 部分フォールバック

## Security Considerations

- ロケールファイルはパッケージに同梱される静的アセットのみ。ユーザー入力による任意ファイル読み取りのリスクなし
- `language` フィールドは許可リスト（`['en', 'ja']`）で検証。パストラバーサル攻撃を防止

## Requirements Traceability

| Requirement | Design Component |
|-------------|-----------------|
| FR-001 | `ao.yaml` Schema Extension (`language` field) + Language Resolution Logic |
| FR-002 | `ao.yaml` Schema Extension (fallback to `claude_md.language` → `en`) |
| FR-003, FR-004, FR-005 | Locale Files (`templates/locales/en/`, `templates/locales/ja/`) |
| FR-010, FR-011, FR-012, FR-013 | Command Templates (localization instructions) + Locale Files |
| FR-014 | `ears-patterns.md` per locale |
| FR-020, FR-021, FR-022 | Locale Directory Structure |
| FR-030, FR-031, FR-032 | `ao.yaml` Schema Extension + Language Resolution Logic |
| FR-040, FR-041, FR-042 | Error Handling Strategy (fallback chain) |
| FR-050, FR-051 | Architecture (new locale = new directory, no command changes) |
| NFR-001 | Static file reads only, no computation overhead |
| NFR-010, NFR-011 | Backward compatibility (default `en`, same structure) |
| NFR-012 | `ao.yaml.template` update |
| NFR-020, NFR-021 | Locale Directory Structure (self-contained, en as reference) |

---

**Status:** ⏳ Awaiting R2 approval
**Next:** After approval, run `/kiro:spec-tasks` to generate implementation tasks.

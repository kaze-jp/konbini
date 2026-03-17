# Feature: i18n-ears-templates

## Overview

SDDワークフローで生成される上流ドキュメント（要件定義・設計・タスク）の言語を、プロジェクトの言語設定に応じて切り替えられるようにする。現在はEARS構文やセクションヘッダーが英語固定であり、日本語プロジェクトでは意思決定者（非エンジニア含む）にとって読みづらい。

## Product Context

konbiniはSpec-Driven Development（SDD）フレームワークであり、要件→設計→タスク→実装のワークフローを提供する。上流ドキュメントはプロジェクトオーナーや意思決定者が読むため、母語での生成が重要。既にCLAUDE.mdテンプレートでは `en.md` / `ja.md` の多言語対応が存在し、`ao.yaml` に `claude_md.language` 設定がある。

## Initial Requirements

### Functional Requirements

- **FR-001**: When the user runs `spec-init`, the system shall generate `requirements-init.md` in the language specified by the project's language setting.
- **FR-002**: When the user runs `spec-requirements`, the system shall generate EARS-formatted requirements using localized syntax patterns matching the project's language setting.
- **FR-003**: The system shall provide EARS syntax patterns for at least English (en) and Japanese (ja).
- **FR-004**: When the language is set to `ja`, the system shall use Japanese EARS patterns:
  - Ubiquitous: "システムは<action>すること"
  - Event-driven: "<event>した場合、システムは<action>すること"
  - State-driven: "<state>の間、システムは<action>すること"
  - Optional: "<condition>の場合、システムは<action>すること"
  - Unwanted: "<unwanted>が発生した場合、システムは<action>すること"
- **FR-005**: When the language is set to `en`, the system shall use the existing English EARS patterns (no behavioral change).
- **FR-006**: The system shall provide localized section headers for `requirements-init.md`, `requirements.md`, `design.md`, and `tasks.md` templates.
- **FR-007**: Where a language is not supported, the system shall fall back to English (en) as the default language.
- **FR-008**: The system shall read the language setting from `ao.yaml` configuration (`claude_md.language` or a new dedicated field).
- **FR-009**: When adding a new language, a developer shall only need to add a new locale file without modifying existing command templates.

### Non-Functional Requirements

- **NFR-001**: The system shall support adding new languages without modifying core command logic (extensibility).
- **NFR-002**: The localization mechanism shall not increase spec generation time by more than 100ms.
- **NFR-003**: The system shall maintain backward compatibility — existing English-only projects shall continue to work without configuration changes.

### Constraints

- 既存の `ao.yaml` スキーマとの互換性を維持する
- テンプレートファイルは Markdown + Mustache プレースホルダー形式を踏襲する
- CLAUDE.md の多言語対応（`templates/claude-md/en.md`, `ja.md`）と設計を統一する

### Assumptions

- 初期リリースでは `en` と `ja` の2言語をサポートし、他言語は後続で追加可能な構造とする
- EARS構文パターンはテンプレートファイルとして管理し、コマンドロジックには埋め込まない
- `ao.yaml` の `claude_md.language` を上流ドキュメントの言語設定としても流用する（専用フィールド追加は必要に応じて検討）

### Open Questions

- OQ-001: `claude_md.language` を流用するか、`spec.language` のような専用フィールドを新設するか？
- OQ-002: コマンドテンプレート（`spec-init.md` 等）自体も多言語化するか、それとも生成物のみ対象とするか？
- OQ-003: `ears-format.md` ルールファイルも言語別にするか、1ファイル内に複数言語を記述するか？

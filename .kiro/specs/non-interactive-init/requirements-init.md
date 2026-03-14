# Feature: non-interactive-init

## Overview
`konbini init` コマンドに非インタラクティブモードを追加し、CLI フラグですべての設定を渡せるようにする。AI エージェント（Claude Code 等）が readline プロンプトなしで konbini を初期化できるようにすることが目的。

## Product Context
konbini は Spec-Driven Development (SDD) のセットアップツール。ターゲットユーザーには AI エージェント経由で開発環境を構築するケースが増えており、インタラクティブ入力への依存がボトルネックとなっている。

## Initial Requirements

### Functional Requirements
- FR-001: When `--yes` (or `-y`) flag is provided, the system shall skip all interactive prompts and use default values or explicitly passed flags.
- FR-002: Where `--preset <name>` flag is provided, the system shall use the specified preset without prompting.
- FR-003: Where `--branch <name>` flag is provided, the system shall use the specified base branch without prompting.
- FR-004: Where `--lang <en|ja>` flag is provided, the system shall use the specified language for CLAUDE.md without prompting.
- FR-005: Where `--claude-md-path <path>` flag is provided, the system shall use the specified path for CLAUDE.md without prompting.
- FR-006: When `--yes` flag is used without other flags, the system shall use sensible defaults: detected base branch, `solo` preset, auto-detected language, `CLAUDE.md` path.
- FR-007: When individual flags (e.g. `--preset`, `--branch`) are provided without `--yes`, the system shall skip the corresponding prompt but still prompt for unspecified options.

### Non-Functional Requirements
- NFR-001: The system shall maintain full backward compatibility — existing interactive behavior must remain unchanged when no flags are passed.
- NFR-002: The system shall exit with a non-zero code and clear error message if an invalid preset name is provided via `--preset`.

### Constraints
- 既存の `Prompter` インターフェースと `initProject()` 関数のシグネチャは可能な限り維持する。
- 新しい依存関係の追加は最小限に抑える（引数パースは手動または既存ライブラリで対応）。

### Assumptions
- AI エージェントは `--yes` フラグまたは個別フラグを使って非インタラクティブに実行する想定。
- `custom` プリセットを `--yes` で使う場合、カスタム設定のデフォルト値が適用される。

### Open Questions
- OQ-001: 引数パースに既存のライブラリ（commander 等）を使うか、手動パースで済ませるか？
- OQ-002: `--json` 出力オプションも同時に追加すべきか？（エージェントが結果をパースしやすくなる）

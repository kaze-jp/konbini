# Feature: claude-md-sdd-injection

## Overview

`konbini init` / `konbini update` 実行時に、プロジェクトの CLAUDE.md へ SDD（Spec-Driven Development）ワークフロー強制ルールを自動注入する。これにより、AIが実装依頼を受けた際にSDDフローを無視して直接コードを書くことを防ぐ。

## Product Context

konbini は AI 自律開発フレームワーク。コマンド内部にはフロー強制チェックがあるが、コマンドが呼ばれる前の段階にガードがない。CLAUDE.md への行動制約注入により、AIがコマンドを呼ぶ前の段階でSDDフローを強制する。

実際に kusa プロジェクトで、AIがSDDフローを完全に無視して直接実装に飛んだ事例が発生している（Issue #4）。

## Initial Requirements

### Functional Requirements

- FR-001: When `konbini init` is executed, the system shall inject an SDD enforcement section into the project's CLAUDE.md.
- FR-002: When `konbini update` is executed, the system shall update the SDD enforcement section in CLAUDE.md to the latest version.
- FR-003: Where a CLAUDE.md already exists in the project, the system shall use marker comments to delimit the injected section and replace only that section (idempotent update).
- FR-004: Where no CLAUDE.md exists in the project, the system shall create a new CLAUDE.md containing the injected section.
- FR-005: When injecting the SDD enforcement section, the system shall write it in the user's preferred language.
- FR-006: Where an existing CLAUDE.md contains content, the system shall auto-detect the language of that content and use it as the default language.
- FR-007: Where no existing CLAUDE.md content is available for language detection, the system shall default to English.
- FR-008: When running `konbini init`, the system shall allow the user to specify the language interactively (with the detected/default language as the pre-selected option).
- FR-009: The injected section shall include: SDD workflow enforcement rules, the required command sequence (`spec-init` → `spec-requirements` → `spec-design` → `spec-tasks` → `ao-run`/`spec-impl`), skip conditions (explicit user instruction to skip), and konbini usage essentials.
- FR-010: When running `konbini init`, the system shall allow the user to confirm or change the CLAUDE.md file path interactively, defaulting to project root `CLAUDE.md`.
- FR-011: The system shall store the chosen language and CLAUDE.md path in `ao.yaml` for use by `konbini update`.

### Non-Functional Requirements

- NFR-001: The injection shall be idempotent — running `konbini init` or `konbini update` multiple times shall produce the same result.
- NFR-002: The system shall preserve all user-written content in CLAUDE.md outside the marker-delimited section.
- NFR-003: The marker comments shall be unobtrusive and clearly indicate they are managed by konbini.

### Constraints

- Must follow existing template-copier patterns in `template-copier.ts`.
- Must not break existing `konbini init` / `konbini update` flows.
- Language templates must be maintainable — adding a new language should be straightforward.

### Assumptions

- CLAUDE.md is the standard file for AI behavioral instructions in Claude Code projects.
- Marker comments in markdown (e.g., `<!-- konbini:start -->` / `<!-- konbini:end -->`) will not interfere with Claude Code's parsing of CLAUDE.md.

### Open Questions

- ~~OQ-001: en, ja の2言語で初期リリース~~ → **決定: en/ja の2言語**
- ~~OQ-002: 注入セクションにkonbiniバージョンを含めるか~~ → **決定: 含める**
- ~~OQ-003: `ao.yaml` の設定キー名~~ → **決定: `claude_md.language`, `claude_md.path`**

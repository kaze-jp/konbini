# Feature: parallel-specialist-review

## Overview

Orchestrator の Phase 6（PRレビュー）で、複数の specialist（security, quality, frontend, backend）を真に並列実行するようにする。現状は1つの Reviewer エージェント内で順次処理されているが、specialist 毎に独立したサブエージェントを spawn して並列レビューを実現する。

## Product Context

konbini の Spec-Driven Development ワークフローにおいて、Phase 6 のコードレビューは品質保証の重要なフェーズ。レビュー速度の向上と specialist 間の context 汚染防止が目的。

## Initial Requirements

### Functional Requirements

FR-001: When Phase 6 review is triggered, the orchestrator shall spawn separate Reviewer sub-agents for each selected specialist, rather than invoking a single `/code-review:code-review` skill.

FR-002: When multiple specialists are selected, the orchestrator shall launch all specialist Reviewer agents in parallel using the Agent tool.

FR-003: When all specialist Reviewer agents complete, the orchestrator shall aggregate their findings into a unified review result.

FR-004: Where specialist findings contradict each other, the orchestrator shall preserve both findings and post a contradiction note as a GH comment.

FR-005: The reviewer agent shall accept a `specialist` parameter that restricts its review to a single specialist perspective.

FR-006: When running in single-specialist mode, the reviewer shall skip specialist selection logic and use only the specified perspective.

FR-007: When Phase 7 re-review is triggered, the orchestrator shall use the same parallel specialist spawning mechanism as Phase 6.

### Non-Functional Requirements

NFR-001: The parallel review execution shall complete faster than sequential execution for 2+ specialists.

NFR-002: Each specialist Reviewer agent shall operate in an isolated context to prevent cross-specialist context pollution.

### Constraints

- 変更対象は `templates/agents/orchestrator.md` と `templates/agents/reviewer.md` のプロンプトのみ（TypeScript コード変更なし）
- `test/fixtures/templates/agents/` 配下のテスト用テンプレートも同期が必要
- `.claude/agents/` 配下のインスタンスも同期が必要

### Assumptions

- Claude Code の Agent tool は複数の並列 spawn をサポートしている
- 各 specialist Reviewer は GH コメント投稿を行わず、findings を返すのみ（集約と投稿は Orchestrator が担当）

### Open Questions

（なし — すべて解決済み）

### Resolved Questions

- ~~OQ-001: Phase 7（Fix Loop）で re-review する際も並列実行にするか？~~ → **Yes。Phase 7 の re-review も同様に並列実行する。**

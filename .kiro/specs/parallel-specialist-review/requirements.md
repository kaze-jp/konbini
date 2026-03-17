# Requirements: parallel-specialist-review

## Document Info
- Feature: parallel-specialist-review
- Status: Draft
- Created: 2026-03-17
- Issue: #11

## Functional Requirements

### Core Behavior — Orchestrator 並列 Dispatch

FR-001: When Phase 6 review is triggered with multiple selected specialists, the orchestrator shall spawn a separate Reviewer sub-agent for each specialist using the Agent tool.

FR-002: When spawning multiple Reviewer sub-agents, the orchestrator shall launch all of them in parallel within a single tool-call message.

FR-003: When spawning a Reviewer sub-agent, the orchestrator shall pass the specialist name (e.g. `security`, `quality`, `frontend`, `backend`) in the agent prompt.

FR-004: When only one specialist is selected, the orchestrator shall spawn a single Reviewer sub-agent for that specialist.

### Core Behavior — Reviewer Single-Specialist Mode

FR-010: The reviewer agent shall accept a specialist parameter in its prompt that restricts review to a single specialist perspective.

FR-011: When a specialist parameter is provided, the reviewer shall skip the specialist selection logic and use only the specified perspective.

FR-012: When a specialist parameter is provided, the reviewer shall return its findings as structured output (not post GH comments directly).

### Findings Aggregation

FR-020: When all specialist Reviewer sub-agents complete, the orchestrator shall collect and aggregate their findings into a unified review result.

FR-021: Where specialist findings contradict each other, the orchestrator shall preserve both findings and post a contradiction note as a GH comment with format `🤖 [ao-review/note]`.

FR-022: When aggregating findings, the orchestrator shall post each finding as a GH review comment with the format `🤖 [ao-review/<specialist>] <finding>`.

### Phase 7 Re-Review

FR-030: When Phase 7 re-review is triggered, the orchestrator shall use the same parallel specialist spawning mechanism as Phase 6.

FR-031: When Phase 7 re-review is triggered, the orchestrator shall re-spawn Reviewer sub-agents only for specialists that produced findings in the previous iteration.

### Edge Cases

FR-040: When a specialist Reviewer sub-agent fails or times out, the orchestrator shall log the failure and continue with results from the remaining specialists.

FR-041: Where no specialists are selected by auto-select, the orchestrator shall fall back to running all specialists.

## Non-Functional Requirements

### Performance

NFR-001: The parallel review execution shall complete faster than sequential execution when 2 or more specialists are selected.

### Isolation

NFR-010: Each specialist Reviewer sub-agent shall operate in an isolated context to prevent cross-specialist context pollution.

NFR-011: Each specialist Reviewer sub-agent shall independently load relevant memory patterns from `.ao/memory/review-patterns/`.

## Constraints

- 変更対象は `templates/agents/orchestrator.md` と `templates/agents/reviewer.md` のプロンプトのみ（TypeScript コード変更なし）
- `test/fixtures/templates/agents/` 配下のテスト用テンプレートも同期が必要
- `.claude/agents/` 配下のインスタンスも同期が必要

## Acceptance Criteria

1. Phase 6 で複数 specialist が選択された場合、Orchestrator が specialist 毎に別々の Reviewer サブエージェントを Agent tool で並列 spawn する
2. 各 Reviewer は指定された単一 specialist のみでレビューを実行する
3. Orchestrator が全 Reviewer の結果を集約し、GH コメントとして投稿する
4. Phase 7 の re-review でも同じ並列メカニズムが使われる
5. specialist 間の context 汚染が発生しない

## Traceability

| Init | Expanded |
|------|----------|
| FR-001 | FR-001, FR-002, FR-003, FR-004 |
| FR-002 | FR-002 |
| FR-003 | FR-020, FR-021, FR-022 |
| FR-004 | FR-021 |
| FR-005 | FR-010 |
| FR-006 | FR-011, FR-012 |
| FR-007 | FR-030, FR-031 |
| NFR-001 | NFR-001 |
| NFR-002 | NFR-010, NFR-011 |

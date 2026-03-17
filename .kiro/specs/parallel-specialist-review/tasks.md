# Implementation Tasks: parallel-specialist-review

## Document Info
- Feature: parallel-specialist-review
- Total tasks: 4
- Parallelizable: 2 (T-001, T-002)
- Created: 2026-03-17

## Task Dependency Graph

```
T-001 (reviewer.md) ──┐
                       ├──→ T-003 (sync copies) ──→ T-004 (checklist verify)
T-002 (orchestrator.md)┘
```

## Parallel Execution Groups

| Group | Tasks | Rationale |
|-------|-------|-----------|
| Group 1 | T-001, T-002 | 異なるファイルを編集、依存関係なし |
| Group 2 | T-003 | T-001, T-002 の変更を他の箇所にコピー |
| Group 3 | T-004 | 最終検証 |

## Tasks

### T-001: Reviewer に Single-Specialist Mode を追加 (P)

- **Description**: `reviewer.md` に Single-Specialist Mode セクションを追加し、既存の multi-specialist 文言を更新する
- **Files**:
  - `templates/agents/reviewer.md` (modify)
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Single-Specialist Mode セクションが Specialist Selection セクションの前に追加されている
  - [x] specialist パラメータを受け取り、単一 perspective のみでレビューする指示が記述されている
  - [x] findings を structured output（file, line, severity, finding, suggestion）で返す指示がある
  - [x] GH コメントを直接投稿しない旨が明記されている
  - [x] 既存の L234 "run them in parallel" の文言が "run each selected perspective sequentially" に更新されている
  - [x] single-specialist mode でない場合（直接 `/code-review:code-review` で呼ばれた場合）は既存フロー維持
- **Tests**: N/A（プロンプトファイル）
- **Effort**: Small

### T-002: Orchestrator Phase 6 + Phase 7 を並列 dispatch に変更 (P)

- **Description**: Phase 6 の Step 4-5 を並列 Agent spawn + findings 集約に書き換え、Phase 7 の Step 6 も同じパターンに変更する
- **Files**:
  - `templates/agents/orchestrator.md` (modify)
- **Dependencies**: None
- **Acceptance Criteria**:
  - [x] Phase 6 Step 4: specialist 毎に Agent tool で Reviewer サブエージェントを spawn する指示に変更
  - [x] Phase 6 Step 4: 全 specialist を単一メッセージ内で並列 launch する指示がある
  - [x] Phase 6 Step 4: prompt に specialist 名、PR diff、review focus brief、memory patterns を含む
  - [x] Phase 6 Step 5: findings 集約ロジック（collect → contradiction detect → post）が記述されている
  - [x] Phase 6 Step 5: agent 失敗時のスキップ + GH note 投稿の指示がある
  - [x] Phase 7 Step 6: `/code-review:code-review` → 並列 specialist spawn に変更
  - [x] Phase 7 Step 6: 前回 findings があった specialist のみ re-spawn する指示がある
  - [x] Skills to invoke から `/code-review:code-review` を削除（直接 Agent tool を使うため）
- **Tests**: N/A（プロンプトファイル）
- **Effort**: Medium

### T-003: テンプレートコピーの同期

- **Description**: `templates/agents/` の変更を `test/fixtures/templates/agents/` と `.claude/agents/` にコピーする
- **Files**:
  - `test/fixtures/templates/agents/reviewer.md` (modify)
  - `test/fixtures/templates/agents/orchestrator.md` (modify)
  - `.claude/agents/reviewer.md` (modify)
  - `.claude/agents/orchestrator.md` (modify)
- **Dependencies**: T-001, T-002
- **Acceptance Criteria**:
  - [x] `test/fixtures/templates/agents/reviewer.md` が `templates/agents/reviewer.md` と同一内容
  - [x] `test/fixtures/templates/agents/orchestrator.md` が `templates/agents/orchestrator.md` と同一内容
  - [x] `.claude/agents/reviewer.md` が `templates/agents/reviewer.md` と同一内容
  - [x] `.claude/agents/orchestrator.md` が `templates/agents/orchestrator.md` と同一内容
- **Tests**: N/A
- **Effort**: Small

### T-004: 最終検証チェックリスト

- **Description**: 全ファイルの整合性と要件の網羅性を確認する
- **Files**: None (read-only verification)
- **Dependencies**: T-003
- **Acceptance Criteria**:
  - [x] 3箇所のテンプレートが完全一致（diff 確認）
  - [x] orchestrator.md で Phase 6 の並列 dispatch が正しく記述されている
  - [x] orchestrator.md で Phase 7 の re-review が並列パターンに変更されている
  - [x] reviewer.md に Single-Specialist Mode が追加されている
  - [x] 既存の reviewer.md の multi-specialist フローが壊れていない
  - [x] 全 FR/NFR が設計通りカバーされている
- **Tests**: N/A
- **Effort**: Small

## File Conflict Matrix

| Task | Files | Conflicts With |
|------|-------|---------------|
| T-001 | `templates/agents/reviewer.md` | None |
| T-002 | `templates/agents/orchestrator.md` | None |
| T-003 | `test/fixtures/…/reviewer.md`, `test/fixtures/…/orchestrator.md`, `.claude/agents/reviewer.md`, `.claude/agents/orchestrator.md` | None (runs after T-001, T-002) |
| T-004 | None (read-only) | None |

## Requirements Traceability

| Requirement | Tasks |
|------------|-------|
| FR-001 | T-002 |
| FR-002 | T-002 |
| FR-003 | T-002 |
| FR-004 | T-002 |
| FR-010 | T-001 |
| FR-011 | T-001 |
| FR-012 | T-001 |
| FR-020 | T-002 |
| FR-021 | T-002 |
| FR-022 | T-002 |
| FR-030 | T-002 |
| FR-031 | T-002 |
| FR-040 | T-002 |
| FR-041 | T-002 |
| NFR-001 | T-002 |
| NFR-010 | T-001, T-002 |
| NFR-011 | T-001 |

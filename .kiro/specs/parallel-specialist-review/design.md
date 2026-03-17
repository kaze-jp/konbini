# Technical Design: parallel-specialist-review

## Document Info
- Feature: parallel-specialist-review
- Status: Draft
- Created: 2026-03-17
- Requirements: ./requirements.md

## Architecture Overview

### Before (現状)

```
Orchestrator (Phase 6, Step 4)
  └── /code-review:code-review (1回呼び出し)
        └── Reviewer (1エージェント)
              ├── security perspective   ← 順次
              ├── quality perspective    ← 順次
              ├── frontend perspective   ← 順次
              └── backend perspective    ← 順次
              └── findings を集約 → 返却
```

### After (変更後)

```
Orchestrator (Phase 6, Step 4)
  ├── specialist selection (変更なし)
  │
  ├── Agent spawn: Reviewer --specialist=security    ┐
  ├── Agent spawn: Reviewer --specialist=quality     │ 並列
  ├── Agent spawn: Reviewer --specialist=frontend    │ (単一メッセージ内)
  └── Agent spawn: Reviewer --specialist=backend     ┘
  │
  ├── findings 集約
  ├── 矛盾検出
  └── GH コメント投稿 (Step 5 — 変更なし)
```

**設計判断**: Orchestrator 側で並列 dispatch する（Issue #11 Option 1）。
- 理由: Orchestrator がコーディネーターとして specialist 割り当てを制御する責務を持つのが自然。Reviewer は「レビューする」ことに集中できる。

## Component Design

### Component: Orchestrator Phase 6 — Step 4 (並列レビュー dispatch)

- **Purpose**: specialist 毎に Reviewer サブエージェントを並列 spawn し、findings を集約する
- **Location**: `templates/agents/orchestrator.md` — Phase 6 セクション（L415–L443）
- **Dependencies**: Reviewer agent（single-specialist モード）

**変更内容**:

現在の Step 4:
```
4. Run multi-specialist review via /code-review:code-review.
   ...
   Run selected specialists in parallel.
```

変更後の Step 4:
```
4. Spawn parallel specialist reviews.

   For each selected specialist, spawn a Reviewer sub-agent using the Agent tool:

   Agent(
     description: "<specialist> code review",
     subagent_type: "feature-dev:code-reviewer",
     prompt: """
       You are reviewing this PR as a **<specialist> specialist only**.

       PR diff: <diff content or gh pr diff command>
       Review focus brief: <from .ao/context/>
       Memory patterns: <relevant patterns from .ao/memory/review-patterns/>

       Review ONLY from the <specialist> perspective.
       Return findings as a structured list:
       - file: <path>
         line: <number>
         severity: critical | warning | suggestion
         finding: <description>
         suggestion: <fix recommendation>
     """
   )

   Launch ALL specialist agents in a single message to execute in parallel.

   After all agents complete, collect their findings.
```

### Component: Orchestrator Phase 6 — Step 5 (findings 集約 + GH 投稿)

- **Purpose**: 並列 Reviewer の結果を集約し、矛盾検出して GH コメントを投稿する
- **Location**: `templates/agents/orchestrator.md` — Phase 6 セクション（L427–L443）
- **Dependencies**: なし（既存ロジックの責務移動）

**変更内容**:

Step 5 に「集約」ロジックを追加:
```
5. Aggregate findings and post review comments to GitHub.

   a. Collect findings from all specialist Reviewer agents.
   b. Detect contradictions: if two specialists produce conflicting recommendations
      for the same file+line, flag as contradiction.
   c. Post each finding as GH review comment (format unchanged):
      🤖 [ao-review/<specialist>] <finding>
   d. Post contradiction notes where detected:
      🤖 [ao-review/note] Contradictory findings between <A> and <B> specialists.
   e. If a specialist agent failed/timed out, post a note:
      🤖 [ao-review/note] <specialist> review was skipped due to agent failure.
```

### Component: Orchestrator Phase 7 — Step 6 (re-review の並列化)

- **Purpose**: Fix loop の re-review でも同じ並列メカニズムを使う
- **Location**: `templates/agents/orchestrator.md` — Phase 7 セクション（L479）
- **Dependencies**: Phase 6 の並列 dispatch と同じパターン

**変更内容**:

現在の Step 6:
```
6. Re-run /code-review:code-review on the updated diff.
```

変更後:
```
6. Re-run parallel specialist reviews on the updated diff.
   - Spawn Reviewer sub-agents ONLY for specialists that produced findings
     in the previous iteration.
   - Use the same Agent tool parallel spawn pattern as Phase 6 Step 4.
   - Collect and aggregate findings (same as Phase 6 Step 5).
```

### Component: Reviewer — Single-Specialist Mode

- **Purpose**: 指定された単一 specialist のみでレビューを実行するモード
- **Location**: `templates/agents/reviewer.md` — Specialist Selection セクション（L195–L238）
- **Dependencies**: なし

**変更内容**:

Specialist Selection セクションの先頭に追加:
```
## Single-Specialist Mode

When invoked with a specific specialist parameter in the prompt (e.g.,
"You are reviewing as a **security specialist only**"), operate in
single-specialist mode:

1. Skip the specialist selection logic entirely.
2. Use ONLY the specified specialist perspective for the review.
3. Do NOT post GH comments directly. Return findings as structured output:
   - file: <path>
   - line: <number>
   - severity: critical | warning | suggestion
   - finding: <description>
   - suggestion: <fix recommendation>
4. The orchestrator will handle GH comment posting and aggregation.

When NOT in single-specialist mode (i.e., invoked via /code-review:code-review
directly), use the existing multi-specialist flow unchanged.
```

既存の L234 の文言を更新:
```
Before: "When multiple specialists are selected, run them in parallel and
         aggregate their findings."
After:  "When running in multi-specialist mode (not single-specialist),
         run each selected perspective sequentially and aggregate findings."
```

## State Management

状態管理の変更はなし。Agent tool の並列 spawn は Claude Code のランタイムが管理する。Orchestrator は各 Agent の返却値（findings リスト）を受け取り、メモリ上で集約するだけ。

## Error Handling Strategy

| Error | Recovery | FR |
|-------|----------|-----|
| Specialist agent タイムアウト | 他の specialist の結果で続行、スキップした旨を GH コメントに記録 | FR-040 |
| Specialist agent エラー | 同上 | FR-040 |
| Auto-select で specialist が 0 件 | 全 specialist をフォールバック実行 | FR-041 |
| 全 specialist が失敗 | Escalation — 人間介入を要求 | — |

## Testing Strategy

この変更はプロンプト（.md ファイル）のみであり、自動テストの対象外。

検証方法:
1. テンプレートファイルの同期確認: `templates/agents/` → `test/fixtures/templates/agents/` → `.claude/agents/` の3箇所が一致すること
2. 実際の PR で Phase 6 を実行し、Agent tool の並列 spawn が行われることを目視確認

## Security Considerations

セキュリティ上の変更なし。各 Reviewer サブエージェントは既存の Reviewer と同じ権限で動作する。

## Requirements Traceability

| Requirement | Design Component |
|-------------|------------------|
| FR-001 | Orchestrator Phase 6 Step 4 — specialist 毎に Agent spawn |
| FR-002 | Orchestrator Phase 6 Step 4 — 単一メッセージで並列 launch |
| FR-003 | Orchestrator Phase 6 Step 4 — prompt に specialist 名を含める |
| FR-004 | Orchestrator Phase 6 Step 4 — 1 specialist でも同じパターン |
| FR-010 | Reviewer Single-Specialist Mode セクション |
| FR-011 | Reviewer Single-Specialist Mode — selection logic スキップ |
| FR-012 | Reviewer Single-Specialist Mode — structured output で返却 |
| FR-020 | Orchestrator Phase 6 Step 5a — findings 集約 |
| FR-021 | Orchestrator Phase 6 Step 5d — contradiction note |
| FR-022 | Orchestrator Phase 6 Step 5c — GH コメント投稿 |
| FR-030 | Orchestrator Phase 7 Step 6 — 同じ並列メカニズム |
| FR-031 | Orchestrator Phase 7 Step 6 — 前回 findings の specialist のみ |
| FR-040 | Error Handling — agent failure 時の続行 |
| FR-041 | Error Handling — auto-select 0件でフォールバック |
| NFR-001 | Architecture — 並列 spawn で実現 |
| NFR-010 | Architecture — 別エージェントで context 分離 |
| NFR-011 | Reviewer Single-Specialist Mode — 各自が memory patterns を読み込み |

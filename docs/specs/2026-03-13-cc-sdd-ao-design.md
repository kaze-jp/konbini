# konbini — AI自律開発フレームワーク

> Inspired by [cc-sdd](https://github.com/gotalab/cc-sdd) (Spec-Driven Development by Gota)

## Overview

konbini（コンビニ）は、Spec-Driven Development (SDD) に **Agent Orchestrator (AO)** を組み合わせた、AI自律開発フレームワーク。cc-sdd の構造化された仕様駆動ワークフローをベースに、自律実行・学習ループ・マルチエージェントレビューを追加した独立プロジェクト。

人間は上流（仕様・設計・タスク分解）を承認するだけ。実装からマージまでをAIが自律的に完結させる。

### ポジショニング

| | cc-sdd | konbini |
|---|---|---|
| 誰が動かす | 人間がコマンドを順番に叩く | AIが自律で回す、人間はチェックポイントのみ |
| Git | 特に規定なし | Worktree完全分離、ベースブランチ固定（推奨） |
| レビュー | Reviewerエージェントはある | マルチ専門家レビュー + GHコメント + 学習ループ |
| コンテキスト | 実装者が自分で読む | Phase 1.5で事前注入 |
| 失敗時 | 人間が判断 | approveまで自律リトライ + エスカレーション |
| 思想 | 仕様駆動 | 仕様駆動 + AI自律運転 |

cc-sdd が「設計図の作り方」、konbini が「設計図を渡したら勝手に家を建てる仕組み」。

### ターゲットユーザー

- **ソロ開発者**: 1人でAIに自律開発させたい人
- **小規模チーム（2-5人）**: AIエージェントをチームメンバーのように使いたい人

### cc-sdd との関係

cc-sdd にインスパイアされた独立プロジェクト。SDD のコンセプト（EARS形式要件、構造化設計、タスク分解）を踏襲しつつ、Agent Orchestrator に最適化した構造でゼロから構築する。cc-sdd の変更は定期的に watch し、有用なアップデートがあれば取り込む。

### 対応環境

- **AI環境**: Claude Code のみ（v0.1）
- **Git ホスティング**: GitHub のみ（v0.1）。GitLab / Bitbucket は対象外。

---

## Prerequisites

konbini は以下のツール・プラグインに依存する。

### 必須ツール

| ツール | 用途 | インストール |
|--------|------|-------------|
| [Claude Code](https://claude.com/claude-code) | AI開発環境 | `npm install -g @anthropic-ai/claude-code` |
| [gh CLI](https://cli.github.com/) | GitHub操作（PR作成、レビューコメント） | `brew install gh` |
| Git | バージョン管理（worktree対応） | OS標準 or `brew install git` |

### 必須 Claude Code プラグイン

| プラグイン | 用途 | スキル |
|-----------|------|--------|
| feature-dev | 実装ガイド | `/feature-dev:feature-dev` |
| code-review | PRレビュー | `/code-review:code-review` |
| superpowers | simplify, brainstorming, TDD等 | `/simplify`, `/superpowers:brainstorming` 等 |

`npx konbini init` 実行時にプラグインの有無を検出し、不足があればインストール手順を表示する。

### 推奨設定

| 設定 | 値 | 理由 |
|------|-----|------|
| `bypass permissions` | ON | 自律運転に必要。自己責任 |

---

## Architecture

### リポジトリ構造

```
konbini/
├── src/                        # TypeScript CLI
│   ├── cli.ts                  # npx konbini init / update / memory simplify
│   ├── generators/             # テンプレート → ユーザーPJへの展開
│   └── utils/
├── templates/
│   ├── agents/
│   │   ├── orchestrator.md     # AOメインループ
│   │   ├── implementer.md      # TDD実装ワーカー
│   │   └── reviewer.md         # マルチ視点レビュー
│   ├── commands/               # kiro互換コマンド（spec-init等）
│   ├── rules/                  # EARS, 設計原則, タスク生成
│   └── config/
│       └── ao.yaml.template    # デフォルト設定テンプレート
├── package.json                # npm パッケージ
└── tsconfig.json
```

### ユーザーPJに生成されるもの

```
user-project/
├── .claude/
│   ├── agents/
│   │   ├── orchestrator.md     # AOオーケストレーター
│   │   ├── implementer.md      # 実装エージェント
│   │   └── reviewer.md         # レビューエージェント
│   └── commands/kiro/          # 12コマンド
├── .ao/
│   ├── ao.yaml                 # 設定ファイル（唯一の設定ポイント）
│   ├── steering/               # プロジェクト方針
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── structure.md
│   └── memory/
│       ├── index.md            # メモリインデックス
│       ├── review-patterns/    # レビュー学習パターン
│       └── project-context/    # 学んだアーキテクチャ・規約
└── .kiro/
    └── settings/
        ├── rules/              # EARS, 設計原則, タスク生成ルール
        └── templates/          # spec, steering テンプレート
```

- `.claude/` — Claude Code が読むエージェント・コマンド
- `.ao/` — AO独自の設定・メモリ
- `.kiro/` — SDD共有ルール・テンプレート

---

## Configuration: ao.yaml

ユーザーが触る唯一の設定ファイル。

```yaml
# .ao/ao.yaml

# --- プリセット ---
# solo:           R1-R3 human, R4-R7 ai, R8 human → downstream: approve-only（推奨デフォルト）
# solo-full-auto: R1-R3 human, R4-R7 ai, R8 skip → downstream: full-auto
# team:           R1-R3 human, R4-R7 ai, R8 human → downstream: review-and-approve
# custom:         個別設定
preset: solo
schema_version: 1

# --- 自律レベル ---
autonomy:
  upstream: manual              # manual（人間が承認）
  downstream: approve-only      # full-auto | approve-only | review-and-approve
  auto_merge: true              # downstream承認後に自動マージ
  bypass_permissions: true      # 推奨ON（自律運転、自己責任）

# --- Git 戦略 ---
git:
  strategy: worktree            # worktree（超推奨） | branch
  base_branch: main             # ベースブランチ（main, develop, 任意のブランチ）
  lock_base_branch: true        # ベースブランチを直接変更しない（推奨）
  branch_prefix: konbini/

# --- 推奨スキル（Claude Code 標準プラグイン依存） ---
skills:
  # 上流（設計フェーズ）
  brainstorming: /superpowers:brainstorming
  writing_plans: /superpowers:writing-plans

  # R4: 実装
  implementation: /feature-dev:feature-dev
  tdd: /superpowers:test-driven-development
  parallel_dispatch: /superpowers:dispatching-parallel-agents
  subagent_dev: /superpowers:subagent-driven-development
  worktree: /superpowers:using-git-worktrees
  debugging: /superpowers:systematic-debugging

  # R5: 統合・検証
  simplify: /simplify
  verification: /superpowers:verification-before-completion

  # R6-R7: レビュー
  code_review: /code-review:code-review
  requesting_review: /superpowers:requesting-code-review
  receiving_review: /superpowers:receiving-code-review

  # R8後: 完了
  finishing_branch: /superpowers:finishing-a-development-branch

# --- スキル依存関係 ---
dependencies:
  required_plugins:
    - name: feature-dev
      purpose: 実装ガイド
    - name: code-review
      purpose: PRレビュー
    - name: superpowers
      purpose: simplify, brainstorming, TDD等
  required_tools:
    - name: gh
      purpose: GitHub操作（PR, レビューコメント）
  # プラグイン/ツール不足時の挙動（init時 + runtime両方に適用）
  # warn:  警告を出して続行（該当スキルをスキップ）
  # block: 停止してインストールを要求
  # skip:  無言でスキップ（非推奨）
  fallback: warn

# --- レビューブレイクポイント ---
# preset で自動設定されるが、個別に上書き可能
reviews:
  R1_requirements:
    actor: human
    description: "要件の承認"

  R2_design:
    actor: human
    description: "技術設計の承認"

  R3_tasks:
    actor: human
    description: "タスク分解の承認"

  R4_implementation:
    actor: ai
    use_team_agents: true       # 並列タスクを TeamCreate で分散実行（推奨）
    tdd: true                   # TDD必須（Red → Green → Refactor）
    description: "並列実装（Team Agents + TDD） + 品質ゲート"

  R5_integration:
    actor: ai
    description: "統合 + Simplify"

  R6_pr_review:
    actor: ai
    skill: /code-review:code-review
    specialists:
      - security
      - quality
      - frontend
      - backend
    auto_select: true
    memory_inject: true
    description: "PR作成 + マルチ専門家PRレビュー"

  R7_fix_loop:
    actor: ai
    simplify_between: auto
    max_iterations: 10        # 安全弁。到達時は人間にエスカレーション
    escalation_trigger:
      type: same_issue        # 同一指摘の繰り返しを検出
      count: 3                # 3回続いたらエスカレーション
    description: "修正 → simplify(自律) → 再レビュー（approveまで）"

  R8_pre_merge:
    actor: human
    description: "マージ前の最終承認"

  # 共通エスカレーション設定
  # ask_human: ターミナルでブロック（入力待ち）+ PR に GH comment で状況説明
  # トリガー条件:
  #   - R7 が max_iterations に到達
  #   - R7 で同一指摘が escalation_trigger 回連続
  #   - R5 でマージ競合が自動解決不能
  #   - 品質ゲートが quality_gates.max_retries 回連続失敗
  on_escalation: ask_human

# --- 品質ゲート ---
quality_gates:
  # PJ固有で上書き可能。未設定の場合は package.json / tsconfig 等から自動検出
  commands:
    typecheck: bun tsc --noEmit
    lint: bun lint
    test: bun test
    build: bun build
  # lint warnings のみ（error なし）は pass とする
  treat_warnings_as: pass     # pass | fail
  max_retries: 3              # 品質ゲート失敗時のリトライ上限

# --- TDD ---
tdd:
  enabled: true               # 超推奨。Red → Green → Refactor
  skill: /superpowers:test-driven-development
  # 各 implementer が TDD サイクルで実装する
  # テストが先、実装が後。テストが通るまでコードを書く

# --- Pre-commit Hooks ---
pre_commit_hooks:
  # konbini は hooks の内容を規定しない（PJ固有のため）
  # ただし init 時に hooks が未設定なら警告 + 推奨事項を表示する
  recommended:
    - lint-staged（変更ファイルのみ lint）
    - type-check（型チェック）
    - test（関連テストの実行）
  # git commit --no-verify は禁止を強く推奨
  warn_no_verify: true

# --- Simplify ---
simplify:
  skill: /simplify
  per_task: false               # 各並列タスク内では走らせない
  required_points:
    - after_integration         # R5: 統合後（必須）
    - before_pr_review          # R6: PRレビュー前（必須）
  auto_points:
    - after_review_fixes        # R7: 修正後、再レビュー前（自律判断）
  skip_if_diff_lines_under: 5

# --- レビューコメント（GitHub） ---
review_comments:
  enabled: true
  prefix: "\U0001F916"         # AIコメントであることを明示
  format: "[ao-{role}]"        # [ao-review/security], [ao-fix] 等
  auto_resolve: true            # 修正後に自分でresolve
  sync_to_memory: true          # コメント履歴をmemoryに同期

# --- 学習ループ ---
memory:
  enabled: true
  simplify_threshold: 20        # パターンがN個溜まったら自動整理
```

---

## Orchestrator Execution Loop

AOの心臓部分。上流承認後、下流を自律実行する。

### フロー全体図

```
┌──────────────────────────────────────────────────────┐
│  上流（人間が承認）※ worktree で実行                   │
│                                                        │
│  R1: spec-init → requirements（EARS形式）              │
│  R2: design（アーキテクチャ・コンポーネント設計）       │
│  R3: tasks（並列分析付きタスク分解）                   │
│                        ↓ 承認                          │
├──────────────────────────────────────────────────────┤
│  下流（AOが自律実行）                                   │
│                                                        │
│  Phase 1: タスク分析 + ブランチ作成                    │
│  Phase 1.5: コンテキスト生成（実装者への事前注入）     │
│      ↓                                                 │
│  R4: 並列実装（Team Agents × 各worktree）              │
│      /superpowers:dispatching-parallel-agents           │
│      /superpowers:using-git-worktrees                   │
│      /feature-dev:feature-dev + /superpowers:tdd        │
│      /superpowers:systematic-debugging（問題発生時）    │
│      品質ゲート（型チェック, lint, test, build）        │
│      ↓                                                 │
│  R5: 統合（1つのworktreeにマージ）+ Simplify           │
│      /superpowers:verification-before-completion        │
│      /simplify                                          │
│      ↓                                                 │
│  R6: PR作成 + /code-review:code-review                 │
│      /superpowers:requesting-code-review                │
│      マルチ専門家レビュー + memory注入                  │
│      gh pr comment で指摘（🤖 [ao-review/xxx]）        │
│      ↓                                                 │
│  R7: 修正ループ（approveまで）                         │
│      /superpowers:receiving-code-review                 │
│      コード修正 → simplify(自律) → 再レビュー          │
│      gh pr comment で解決報告 + resolve                 │
│      ↓                                                 │
│  R8: マージ前レビュー（設定次第で human/ai）           │
│      人間フィードバック → memory蓄積                    │
│      ↓                                                 │
│  マージ + /superpowers:finishing-a-development-branch   │
│      ↓                                                 │
│  次タスクがあれば Phase 1 へ                            │
└──────────────────────────────────────────────────────┘
```

### autonomy.downstream による分岐

| 設定 | R8（マージ前） | マージ |
|------|----------------|--------|
| `full-auto` | スキップ | 自動 |
| `approve-only` | 人間が承認のみ | 承認後自動 |
| `review-and-approve` | 人間がコードレビュー + 承認 | 承認後自動 |

### Phase 1: タスク分析 + ブランチ作成

R3 で承認されたタスク一覧を受け取り、実行準備を行う。

**入力**: `.kiro/specs/<feature>/tasks.md`（承認済み）
**処理**:
1. タスク一覧をパースし、依存関係グラフを構築
2. (P) マーク付きタスクを並列実行グループに分類
3. 各タスク用の worktree ブランチを作成（`konbini/<feature>-task-N`）
4. 順次実行タスクの実行順序を決定

**出力**: 実行計画（並列グループ + 順次キュー）
**失敗時**: タスクファイルのパースエラー → 人間にエスカレーション

### Phase 1.5: 動的コンテキスト生成

並列実装の前に、各タスクの実装者に対してコードベースの文脈を事前注入する。

**入力**: タスク定義 + コードベース
**処理**: orchestrator が各タスクについて以下を生成
**出力**: 各 worktree の `.ao/context/` に Markdown ファイルとして配置

- **TaskContextBrief** (`task-context.md`):
  - このタスクが触るファイル群の既存パターン（命名規則、import慣例等）
  - 前タスクの出力との integration points
  - 関連する steering / memory のエントリ
- **ReviewFocusBrief** (`review-focus.md`):
  - 変更カテゴリ（UI / API / DB / 認証 etc.）
  - memory から注入すべきレビューパターン
  - 特に注意すべき品質観点

**失敗時**: コンテキスト生成失敗 → 実装者はコンテキストなしで続行（degraded mode）。致命的ではない。

実装者がトークンを浪費してコンテキストを探す無駄を排除する。

---

## Review System

### レビューブレイクポイント一覧

```
上流（設計フェーズ）
  R1: Requirements レビュー     human     要件の承認
  R2: Design レビュー           human     技術設計の承認
  R3: Tasks レビュー            human     タスク分解の承認

下流（実装フェーズ）
  R4: 並列実装 + 品質ゲート     ai        Team Agents + TDD + 各worktree
  R5: 統合 + Simplify           ai        マージ + コード整理
  R6: PR作成 + PRレビュー       ai        /code-review + 専門家 + memory
  R7: 修正ループ                ai        approveまで自律リトライ
  R8: マージ前レビュー          human/ai  設定次第
```

各ブレイクポイントの `actor` は ao.yaml で `human | ai | skip` に設定可能。

### マルチ専門家レビュー（R6）

変更ファイルに応じて専門家エージェントを自動選択:

| 専門家 | トリガー |
|--------|----------|
| security | 認証・認可・入力バリデーション系の変更 |
| quality | テスト・エラーハンドリング系の変更 |
| frontend | UI コンポーネント・スタイリングの変更 |
| backend | API・DB・サーバーサイドロジックの変更 |

`auto_select: true` で自動、`false` で全specialist を毎回起動。

複数 specialist が選択された場合は**並列実行**し、結果を集約する。specialist 間で矛盾する指摘がある場合は、両方を GH comment として残し、R7 修正ループで orchestrator が判断する。

### R5: 統合フェーズ（並列 worktree マージ）

並列タスクの worktree を1つの統合ブランチにマージする最もリスクの高いフェーズ。

**処理**:
1. 統合用 worktree を新規作成（`konbini/<feature>-integration`）
2. 各タスク worktree の変更を順次マージ
3. マージ競合が発生した場合:
   - **自動解決可能**（import順序、空行等）→ orchestrator が解決
   - **自動解決不可能** → 人間にエスカレーション（diff を GH comment で提示）
4. 統合後に全品質ゲートを再実行（個別 worktree で通っても統合で壊れる可能性）
5. Simplify 実行

**失敗時**: 品質ゲート失敗 → 自動修正 → リトライ（`quality_gates.max_retries` 回まで）。マージ競合解決不能 → 人間エスカレーション。

**前提**: R3 のタスク分解で (P) マークされたタスクは、ファイル競合が起きにくいよう分解されている。タスク生成ルールがこれを強制する。

### GitHub レビューコメント

AIがGH上でレビューコメントを残し、自分で修正・resolveする。

```
指摘:
  🤖 [ao-review/security] 認証チェックがmiddlewareではなく
  route handlerにあります。middleware に移動してください。

修正報告:
  🤖 [ao-fix] middleware に移動しました (abc1234)
  → コメントをresolve

人間の介入（任意）:
  「この指摘は的外れ。route handler で正しい」
  → memoryに取り込み、次回以降のレビューに反映
```

- 全履歴がGH上で追える（透明性）
- 人間がいつでもコメントで介入可能
- コメント履歴が memory の蓄積ソースになる

**実装メモ**: GH review thread の resolve には GraphQL API（`resolveReviewThread` mutation）を使用する。`gh api graphql` 経由で実行。

---

## Learning Loop (Memory + Simplify)

### メモリ構造

```
.ao/memory/
├── index.md                    # メモリインデックス
├── review-patterns/
│   ├── security.md             # セキュリティ系の指摘パターン
│   ├── naming.md               # 命名規則の指摘
│   ├── error-handling.md       # エラー処理の指摘
│   └── ...
└── project-context/
    ├── architecture.md         # 学んだアーキテクチャ判断
    └── conventions.md          # 学んだコーディング規約
```

### 蓄積フロー

```
R8: 人間レビュー / GHコメント
  「認証系は必ずmiddlewareでやって、route handlerに書かないで」
       ↓
  review-patterns/security.md に追記:
    - 認証ロジックはmiddlewareに集約。route handlerに書かない。
       ↓
  次回の /code-review 時にこのパターンを注入
       ↓
  AIレビューが「route handlerに認証ロジックがあります」を自動検出
```

### 並列実行時のメモリ書き込み

複数の AO ランが同時に走る場合（2つの feature を並行開発等）、memory への書き込みが競合する可能性がある。

**方針**: memory への書き込みは orchestrator のみが行う（implementer / reviewer は読み取り専用）。orchestrator は1つの feature につき1つしか走らないため、同一 feature 内での競合は発生しない。feature 間の競合は、マージ時に orchestrator が last-write-wins で統合し、競合があれば `.ao/memory/conflicts.md` に記録して次回 simplify 時に解消する。

`.ao/memory/` は **Git tracked**（`.gitignore` に入れない）。チームで memory を共有するため。

### Memory Simplify

メモリはただ溜めるだけではなく、定期的に整理・統合・要約して洗練させる。

**自動発動**: `simplify_threshold: 20` — パターンが20件を超えたら自動実行
**手動実行**: `npx konbini memory simplify`

Simplify の処理:
1. 重複を統合（「SQL injection対策」が3パターン → 1つに）
2. 古い/解決済みのパターンを削除
3. 抽象度を上げる（個別ケース → 原則に昇格）
4. 矛盾するパターンを検出・解消

---

## CLI

### コマンド一覧

```bash
# 初期セットアップ
npx konbini init
# → プラグインチェック → ファイル生成 → プリセット選択

# テンプレート更新（設定・memoryは保持）
npx konbini update

# メモリ手動simplify
npx konbini memory simplify

# 設定確認
npx konbini config show
```

### init の流れ

1. 前提ツールチェック（gh CLI, Git）
2. Claude Code プラグインチェック（feature-dev, code-review, superpowers）
3. 不足があればインストール手順を表示
4. Pre-commit hooks チェック — 未設定なら推奨事項を表示（lint-staged, type-check, test）
5. プリセット選択（solo / solo-full-auto / team）
6. `.ao/`, `.claude/agents/`, `.claude/commands/kiro/`, `.kiro/settings/` を生成
7. `ao.yaml` にプリセット設定を書き込み

### update の流れ

1. 現在のバージョンと最新を比較
2. テンプレートファイル（agents, commands, rules）のみ上書き
3. `.ao/ao.yaml` と `.ao/memory/` は保持（ユーザーの設定・学習データを壊さない）
4. ユーザーがエージェントファイルをカスタマイズしていた場合、diff を表示して上書き確認を求める

**注意**: `ao.yaml` に `schema_version` フィールドを持たせ、破壊的変更時はマイグレーション手順を表示する。

---

## Distribution

- **配布**: npm パッケージ
- **インストール**: `npx konbini init` でユーザーPJにファイル生成（cc-sdd と同じ方式）
- **ライセンス**: MIT
- **リポジトリ**: GitHub（独立リポジトリ）

---

## Scope: v0.1

v0.1 に含めるもの:

- SDD基盤（spec → design → tasks → impl）
- AOオーケストレーター（自律実行ループ）
- Worktree分離（デフォルトON、branch方式にフォールバック可能）
- マルチエージェントレビュー（4専門家 + auto_select）
- GitHub レビューコメント（🤖 prefix + auto_resolve）
- 学習ループ（memory蓄積 + simplify）
- ao.yaml 設定（3プリセット + 個別上書き）
- CLI（init / update / memory simplify / config show）

v0.1 に含めないもの:

- Claude Code 以外の環境対応
- Web UI / ダッシュボード
- チーム間のmemory共有機能

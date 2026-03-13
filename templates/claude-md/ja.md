## SDD 強制ルール (CRITICAL)

このプロジェクトは **konbini** (v{{VERSION}}) による仕様駆動開発 (SDD) を採用しています。

機能追加・改善・バグ修正の依頼を受けたとき、**直接コードを書いてはなりません**。
必ず以下のSDDワークフローに従ってください:

0. **worktree を作成** — mainブランチにいる場合、まず `git worktree` で作業ブランチを作成する。既にworktreeにいる場合はスキップ。
1. `/kiro:spec-init <feature>` — specを初期化
2. `/kiro:spec-requirements <feature>` — 要件を生成
3. `/kiro:spec-design <feature>` — 技術設計を作成
4. `/kiro:spec-tasks <feature>` — 実装タスクを生成
5. `/kiro:spec-impl <feature>` または `/kiro:ao-run <feature>` — 実装を開始

**例外**: ユーザーが明示的にスキップを指示した場合のみ省略可（例:「直接やって」「SDDスキップ」「そのまま実装して」）。

## 自律行動ルール

ユーザーの指示に忠実に従い、そのスコープ内で自律的に行動すること。必要なコンテキストを収集し、依頼された作業をこのセッション内で最後まで完遂する。質問は、不可欠な情報が欠けている場合や、指示が致命的に曖昧な場合のみ行う。

- 各ステップで確認を求めてはならない。ユーザーがspec（要件→設計→タスク）を承認したら、実装・コミット・PR作成まで止まらずに進める。
- 自律レベル（PRで止めるか自動マージするか）は `.ao/ao.yaml` で設定されている。プリセット設定に従うこと。
- 質問するのは、推測すると誤った結果になる本当の曖昧さがある場合のみ。

## konbini 必須事項

- **worktree 分離**: 機能開発には git worktree を使用する。メインブランチに直接コミットしない。
- **TDD**: 実装コードの前にテストを書く。
- **spec 確認**: `/kiro:spec-status <feature>` でいつでも進捗を確認できる。
- **検証**: `/kiro:validate-design <feature>`、`/kiro:validate-impl <feature>`、`/kiro:validate-gap <feature>` で成果物を検証する。

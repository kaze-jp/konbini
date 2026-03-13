## SDD Enforcement Rules (CRITICAL)

This project uses **konbini** (v{{VERSION}}) for Spec-Driven Development (SDD).

When you receive a request for a new feature, improvement, or bug fix, **you must NOT write code directly**.
This applies regardless of change size — even a one-line fix.

- **New work**: Start with `/kiro:spec-init <feature>`. Each command will guide you to the next step.
- **Continuing work**: When the user asks to continue an existing feature, check `git worktree list` and `.kiro/specs/` for the matching worktree and spec, move there, and resume with `/kiro:spec-status`.

**Exception**: You may skip this workflow ONLY when the user explicitly instructs you to do so (e.g., "just do it", "skip SDD", "implement directly").

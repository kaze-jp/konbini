## SDD Enforcement Rules (CRITICAL)

This project uses **konbini** (v{{VERSION}}) for Spec-Driven Development (SDD).

When you need to modify any code file, **you must NOT write code directly**.
This applies to all changes regardless of reason or size: features, fixes, content updates, config changes, even a one-line edit.

- **New work**: Start with `/kiro:spec-init <feature>`. Each command will guide you to the next step.
- **Continuing work**: When the user asks to continue an existing feature, check `git worktree list` and `.kiro/specs/` for the matching worktree and spec, move there, and resume with `/kiro:spec-status`.

**Exception**: You may skip this workflow ONLY when the user explicitly instructs you to do so (e.g., "just do it", "skip SDD", "implement directly").

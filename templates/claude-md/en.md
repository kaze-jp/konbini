## SDD Enforcement Rules (CRITICAL)

This project uses **konbini** (v{{VERSION}}) for Spec-Driven Development (SDD).

When you receive a request for a new feature, improvement, or bug fix, **you must NOT write code directly**.
Always follow the SDD workflow below:

0. **Create a worktree** — If you are on the main branch, first create a `git worktree` for the feature branch. Skip if already in a worktree.
1. `/kiro:spec-init <feature>` — Initialize the spec
2. `/kiro:spec-requirements <feature>` — Generate requirements
3. `/kiro:spec-design <feature>` — Create technical design
4. `/kiro:spec-tasks <feature>` — Generate implementation tasks
5. `/kiro:spec-impl <feature>` or `/kiro:ao-run <feature>` — Start implementation

**Exception**: You may skip this workflow ONLY when the user explicitly instructs you to do so (e.g., "just do it", "skip SDD", "implement directly").

## Autonomy Rules

Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

- Do NOT ask for confirmation at each step. Once the user has approved the spec (requirements → design → tasks), proceed through implementation, commit, and PR creation without stopping.
- The autonomy level (whether to stop at PR or auto-merge) is configured in `.ao/ao.yaml`. Follow the preset settings.
- Ask questions only when there is genuine ambiguity that would lead to incorrect results if you guessed.

## konbini Essentials

- **Worktree isolation**: Use git worktrees for feature work. Never commit directly to the main branch.
- **TDD**: Write failing tests before implementation code.
- **Spec status**: Run `/kiro:spec-status <feature>` to check progress at any time.
- **Validation**: Use `/kiro:validate-design <feature>`, `/kiro:validate-impl <feature>`, `/kiro:validate-gap <feature>` to verify work.

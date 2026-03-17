# Initialize Feature Spec

Initialize a new feature specification directory and generate initial requirements.

## Usage

```
/kiro:spec-init <feature-name>
```

## Instructions

0. **Worktree guard** — Before anything else, check if you are working in a git worktree (not on the main/master branch). If you are on the main branch, **stop and create a worktree first** using the `superpowers:using-git-worktrees` skill or `git worktree add`. Do NOT proceed with spec initialization until you are in an isolated worktree.

1. **Steering check** — Check if `.ao/steering/` directory exists with the core documents (`product.md`, `tech.md`, `structure.md`).
   - **If `.ao/steering/` does not exist** (first time): Stop and run `/kiro:steering` to establish project context before continuing. This creates the steering documents by analyzing the codebase. Do NOT proceed with spec initialization until steering is complete.
   - **If `.ao/steering/` exists**: Read all three steering documents (`product.md`, `tech.md`, `structure.md`) to understand the product vision, technology stack, and project structure.

2. **Create the spec directory** at `.kiro/specs/$FEATURE_NAME/`.

3. **Gather feature information** by asking the user:
   - What is the feature's purpose?
   - Who are the target users?
   - What problem does it solve?
   - Are there any known constraints?

4. **Generate `requirements-init.md`** in the spec directory with the following structure:

```markdown
# Feature: <feature-name>

## Overview
<Brief description of the feature and its purpose>

## Product Context
<Relevant context from product.md>

## Initial Requirements

### Functional Requirements
<List requirements using EARS format>

### Non-Functional Requirements
<Performance, security, accessibility requirements using EARS format>

### Constraints
<Known constraints and limitations>

### Assumptions
<Assumptions made during requirements gathering>

### Open Questions
<Questions that need answers before proceeding>
```

5. **Localization** — Determine the output language for the generated document:
   1. Read `.ao/ao.yaml` and extract the top-level `language` field.
   2. If not present, fall back to `claude_md.language`.
   3. If neither exists, default to `en`.
   4. Read the locale files from `.kiro/settings/locales/{language}/`:
      - `section-headers.yaml` → use `requirements_init.*` keys for section headers
      - `ears-patterns.md` → use localized EARS patterns for requirements
      - `boilerplate.yaml` → use localized status labels and boilerplate text
   5. If the locale directory does not exist, fall back to `en` and warn: `"Warning: Locale '{lang}' not found. Using English."`
   6. Apply the localized text when generating the spec document.

6. **Apply EARS format** for all requirements using the patterns from the locale's `ears-patterns.md`. If no locale was loaded, use the default English patterns:
   - Ubiquitous: "The <system> shall <action>"
   - Event-driven: "When <event>, the <system> shall <action>"
   - State-driven: "While <state>, the <system> shall <action>"
   - Optional: "Where <condition>, the <system> shall <action>"
   - Unwanted: "If <unwanted>, the <system> shall <action>"

7. **Confirm with the user** that the initial requirements capture their intent before finalizing.

8. **Report** the created file path and suggest running `/kiro:spec-requirements` next to expand into full requirements.

## Output

- `.kiro/specs/<feature-name>/requirements-init.md`

## Notes

- Feature names should use kebab-case (e.g., `user-auth`, `payment-flow`).
- If `.ao/steering/` does not exist, the steering check in step 1 will create it before proceeding.
- Each requirement should be individually numbered (e.g., FR-001, NFR-001).

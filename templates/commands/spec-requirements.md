# Expand Requirements

Expand initial requirements into a full, structured requirements document using EARS format.

## Usage

```
/kiro:spec-requirements <feature-name>
```

## Instructions

1. **Read the initial requirements** from `.kiro/specs/$FEATURE_NAME/requirements-init.md`. If it does not exist, instruct the user to run `/kiro:spec-init` first.

2. **Read steering documents** for additional context:
   - `.ao/steering/product.md` for product goals
   - `.ao/steering/tech.md` for technical constraints
   - `.ao/steering/structure.md` for codebase conventions

3. **Localization** — Determine the output language for the generated document:
   1. Read `.ao/ao.yaml` and extract the top-level `language` field.
   2. If not present, fall back to `claude_md.language`.
   3. If neither exists, default to `en`.
   4. Read the locale files from `.kiro/settings/locales/{language}/`:
      - `section-headers.yaml` → use `requirements.*` keys for section headers
      - `ears-patterns.md` → use localized EARS patterns for all requirement statements
      - `boilerplate.yaml` → use localized status labels and boilerplate text
   5. If the locale directory does not exist, fall back to `en` and warn: `"Warning: Locale '{lang}' not found. Using English."`
   6. Apply the localized text when generating the spec document.

4. **Expand each initial requirement** by:
   - Breaking compound requirements into atomic statements
   - Adding missing edge cases and error scenarios
   - Ensuring each requirement is testable and measurable
   - Applying the correct EARS pattern for each requirement type

5. **Apply EARS format rules strictly** (using patterns from the locale's `ears-patterns.md`):
   - Every requirement MUST follow one of the five EARS patterns
   - No ambiguous language (avoid "should", "may", "might")
   - Each requirement must be independently verifiable
   - Requirements must not describe implementation details

6. **Generate `requirements.md`** with this structure:

```markdown
# Requirements: <feature-name>

## Document Info
- Feature: <name>
- Status: Draft
- Created: <date>

## Functional Requirements

### Core Behavior
FR-001: <EARS formatted requirement>
FR-002: ...

### User Interactions
FR-010: ...

### Edge Cases
FR-020: ...

### Error Handling
FR-030: ...

## Non-Functional Requirements

### Performance
NFR-001: ...

### Security
NFR-010: ...

### Accessibility
NFR-020: ...

## Acceptance Criteria
<High-level acceptance criteria for the feature>

## Traceability
<Map from requirements-init items to expanded requirements>
```

7. **Validate completeness**: Ensure every item from `requirements-init.md` is addressed in the expanded document.

8. **Report** the output path and suggest `/kiro:spec-design` as the next step.

## Output

- `.kiro/specs/<feature-name>/requirements.md`

## Notes

- Do not remove or weaken any requirement from the initial set.
- If a requirement is unclear, add it to an "Open Questions" section rather than guessing.
- Number requirements with gaps (FR-001, FR-010, FR-020) to allow insertions later.

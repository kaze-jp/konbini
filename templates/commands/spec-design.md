# Create Technical Design

Generate a technical design document from approved requirements.

## Usage

```
/kiro:spec-design <feature-name>
```

## Instructions

1. **Read the requirements** from `.kiro/specs/$FEATURE_NAME/requirements.md`. If it does not exist, instruct the user to run `/kiro:spec-requirements` first.

2. **Read steering documents** for technical constraints:
   - `.ao/steering/tech.md` for technology stack, patterns, and conventions
   - `.ao/steering/structure.md` for project structure and file organization
   - `.ao/steering/product.md` for product context

3. **Localization** — Determine the output language for the generated document:
   1. Read `.ao/ao.yaml` and extract the top-level `language` field.
   2. If not present, fall back to `claude_md.language`.
   3. If neither exists, default to `en`.
   4. Read the locale files from `.kiro/settings/locales/{language}/`:
      - `section-headers.yaml` → use `design.*` keys for section headers
      - `boilerplate.yaml` → use localized status labels and boilerplate text
   5. If the locale directory does not exist, fall back to `en` and warn: `"Warning: Locale '{lang}' not found. Using English."`
   6. Apply the localized text when generating the spec document.

4. **Generate `design.md`** with the following sections:

```markdown
# Technical Design: <feature-name>

## Document Info
- Feature: <name>
- Status: Draft
- Created: <date>
- Requirements: ./requirements.md

## Architecture Overview
<High-level architecture description and diagram (ASCII or Mermaid)>

## Component Design

### Component: <name>
- **Purpose**: <what it does>
- **Location**: <file path>
- **Dependencies**: <other components>
- **Interface**: <public API>

### Component: <name>
...

## API Contracts

### <Endpoint/Function>
- **Signature**: <full signature>
- **Input**: <parameters with types and validation>
- **Output**: <return type and structure>
- **Errors**: <error cases and codes>
- **Example**: <usage example>

## Data Models

### <Model Name>
- **Fields**: <field definitions with types>
- **Validation**: <validation rules>
- **Relationships**: <references to other models>

## State Management
<How state flows through the system>

## Error Handling Strategy
<Error categories, recovery strategies, user-facing messages>

## Testing Strategy
- Unit test targets
- Integration test boundaries
- Edge cases to cover

## Security Considerations
<Authentication, authorization, data protection>

## Requirements Traceability
<Map each requirement ID to the design component(s) that fulfill it>
```

5. **Design principles to follow**:
   - Every architecture decision must include rationale
   - Component boundaries must be explicit with clear interfaces
   - API contracts must specify all error cases
   - Data models must include validation rules
   - Design for testability; avoid tight coupling
   - No premature optimization

6. **Validate** that every requirement from `requirements.md` is addressed in the design.

7. **Report** the output path and suggest `/kiro:spec-tasks` as the next step.

## Output

- `.kiro/specs/<feature-name>/design.md`

## Notes

- Prefer existing patterns from the codebase over introducing new ones.
- If a requirement cannot be satisfied with the current tech stack, note it as a constraint.
- Keep the design at the right level of abstraction; avoid pseudo-code unless clarity demands it.

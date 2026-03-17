# Requirements: i18n-ears-templates

## Document Info
- Feature: i18n-ears-templates
- Status: Draft
- Created: 2026-03-17
- Source: requirements-init.md, GitHub Issue #12

## Functional Requirements

### Core Behavior

FR-001: The system shall read the language setting from the `language` field in `ao.yaml` to determine the output language for all spec documents.

FR-002: Where `ao.yaml` does not contain a `language` field, the system shall default to English (`en`).

FR-003: The system shall provide locale files containing localized EARS syntax patterns, section headers, and boilerplate text for each supported language.

FR-004: The system shall provide a locale file for English (`en`) containing the following EARS patterns:
- Ubiquitous: "The <system> shall <action>"
- Event-driven: "When <event>, the <system> shall <action>"
- State-driven: "While <state>, the <system> shall <action>"
- Optional: "Where <condition>, the <system> shall <action>"
- Unwanted: "If <unwanted situation>, the <system> shall <action>"

FR-005: The system shall provide a locale file for Japanese (`ja`) containing the following EARS patterns:
- Ubiquitous: "システムは<action>すること"
- Event-driven: "<event>した場合、システムは<action>すること"
- State-driven: "<state>の間、システムは<action>すること"
- Optional: "<condition>の場合、システムは<action>すること"
- Unwanted: "<unwanted>が発生した場合、システムは<action>すること"

### Document Generation

FR-010: When the user runs `spec-init`, the system shall generate `requirements-init.md` with section headers and boilerplate text in the configured language.

FR-011: When the user runs `spec-requirements`, the system shall generate `requirements.md` with EARS-formatted requirement patterns in the configured language.

FR-012: When the user runs `spec-design`, the system shall generate `design.md` with section headers in the configured language.

FR-013: When the user runs `spec-tasks`, the system shall generate `tasks.md` with section headers and task description templates in the configured language.

FR-014: The system shall localize the `ears-format.md` rules file content based on the configured language, providing pattern templates and examples in the target language.

### Locale File Structure

FR-020: The system shall store locale files under `templates/locales/{lang}/` where `{lang}` is the ISO 639-1 language code.

FR-021: Each locale directory shall contain the following files:
- `ears-patterns.md` — Localized EARS syntax patterns with examples
- `section-headers.yaml` — Mapping of section identifiers to localized header strings
- `boilerplate.yaml` — Localized boilerplate text for templates (e.g., status labels, next-step instructions)

FR-022: The system shall use `section-headers.yaml` to resolve section header text when generating spec documents.

### Configuration

FR-030: The system shall support a `language` field at the top level of `ao.yaml` for specifying the spec document language.

FR-031: When the `language` field is present in `ao.yaml`, the system shall use it for both CLAUDE.md generation and spec document generation.

FR-032: Where `claude_md.language` exists but top-level `language` does not, the system shall fall back to `claude_md.language` for backward compatibility.

### Edge Cases

FR-040: Where the configured language has no corresponding locale directory, the system shall fall back to English (`en`) and emit a warning message.

FR-041: When a locale file is missing a specific key, the system shall fall back to the English locale value for that key.

FR-042: Where a locale file contains malformed YAML, the system shall emit an error message identifying the file and fall back to the English locale.

### Extensibility

FR-050: When adding support for a new language, a developer shall only need to create a new locale directory under `templates/locales/{lang}/` with the required files.

FR-051: The system shall not require modifications to command templates (`spec-init.md`, `spec-requirements.md`, `spec-design.md`, `spec-tasks.md`) when adding a new language.

## Non-Functional Requirements

### Performance

NFR-001: The locale file loading shall not increase spec generation time by more than 100ms.

### Compatibility

NFR-010: The system shall maintain full backward compatibility — existing projects without a `language` setting shall produce identical English output.

NFR-011: The system shall not alter the structure or numbering scheme of generated spec documents regardless of language.

NFR-012: The `ao.yaml.template` shall include the `language` field with a default value of `en` and a comment explaining available options.

### Maintainability

NFR-020: Each locale shall be fully self-contained in its directory with no cross-references to other locale directories.

NFR-021: The English locale shall serve as the reference implementation — all other locales shall have the same file structure and keys.

## Acceptance Criteria

- [ ] AC-1: A project with `language: ja` in `ao.yaml` generates `requirements-init.md` with Japanese section headers and EARS patterns.
- [ ] AC-2: A project with `language: ja` in `ao.yaml` generates `requirements.md` with Japanese EARS syntax patterns.
- [ ] AC-3: A project with `language: en` (or no `language` field) generates spec documents identical to the current English-only behavior.
- [ ] AC-4: A project with `language: zh` (unsupported) falls back to English and emits a warning.
- [ ] AC-5: Adding a new `templates/locales/ko/` directory with required files enables Korean spec generation without code changes.
- [ ] AC-6: Existing command template files (`spec-init.md`, etc.) remain unmodified after this feature is implemented.

## Traceability

| Init Req | Expanded To | Description |
|----------|-------------|-------------|
| FR-001 | FR-010, FR-011 | spec-init/requirements generation in configured language |
| FR-002 | FR-011, FR-014 | EARS-formatted requirements with localized patterns |
| FR-003 | FR-004, FR-005 | English and Japanese EARS patterns |
| FR-004 | FR-005 | Japanese EARS patterns (detailed) |
| FR-005 | FR-004 | English EARS patterns (no change) |
| FR-006 | FR-010, FR-011, FR-012, FR-013, FR-022 | Localized section headers across all templates |
| FR-007 | FR-040, FR-041, FR-042 | Fallback to English for unsupported/missing locales |
| FR-008 | FR-001, FR-030, FR-031, FR-032 | Language setting from ao.yaml |
| FR-009 | FR-050, FR-051 | Extensibility — new locale = new directory only |
| NFR-001 | NFR-020 | Extensibility via maintainability |
| NFR-002 | NFR-001 | Performance constraint preserved |
| NFR-003 | NFR-010, NFR-011 | Backward compatibility |

---

**Status:** ⏳ Awaiting R1 approval
**Next:** After approval, run `/kiro:spec-design` to create technical design.

# Requirements: claude-md-sdd-injection

## Document Info
- Feature: claude-md-sdd-injection
- Status: Draft
- Created: 2026-03-13
- Source: [GitHub Issue #4](https://github.com/kaze-jp/konbini/issues/4)

## Functional Requirements

### Core Behavior

FR-001: When `konbini init` is executed, the system shall inject an SDD enforcement section into the project's CLAUDE.md.

FR-002: When `konbini update` is executed, the system shall update the SDD enforcement section in CLAUDE.md to the latest template version.

FR-003: The injected section shall include the konbini version that generated it.

FR-004: When injecting the SDD enforcement section, the system shall write it in the user's preferred language.

### CLAUDE.md File Management

FR-010: Where a CLAUDE.md already exists at the configured path, the system shall inject the section using marker comments (`<!-- konbini:sdd:start -->` / `<!-- konbini:sdd:end -->`).

FR-011: Where a CLAUDE.md already exists and contains a konbini-managed section (identified by marker comments), the system shall replace only the content between the markers.

FR-012: Where a CLAUDE.md already exists but contains no konbini-managed section, the system shall append the marker-delimited section to the end of the file.

FR-013: Where no CLAUDE.md exists at the configured path, the system shall create a new file containing only the marker-delimited section.

FR-014: The system shall preserve all content in CLAUDE.md outside the marker-delimited section, including whitespace and formatting.

### Language Handling

FR-020: Where an existing CLAUDE.md contains content outside the markers, the system shall auto-detect the language and use it as the default for the injection language prompt.

FR-021: Where no existing CLAUDE.md content is available for language detection, the system shall default to English (`en`).

FR-022: When running `konbini init`, the system shall prompt the user to select the language interactively, showing the detected/default language as the pre-selected option.

FR-023: The system shall support English (`en`) and Japanese (`ja`) as injection languages.

FR-024: When running `konbini update`, the system shall use the language stored in `ao.yaml` without prompting.

### Interactive Configuration (init only)

FR-030: When running `konbini init`, the system shall prompt the user to confirm or change the CLAUDE.md file path, defaulting to `CLAUDE.md` (project root).

FR-031: The system shall store the chosen language in `ao.yaml` under `claude_md.language`.

FR-032: The system shall store the chosen CLAUDE.md path in `ao.yaml` under `claude_md.path`.

### Injected Content

FR-040: The injected section shall contain an SDD workflow enforcement rule stating that the AI must not write code directly when receiving a feature, improvement, or bugfix request.

FR-041: The injected section shall contain the required command sequence: `spec-init` → `spec-requirements` → `spec-design` → `spec-tasks` → `ao-run` / `spec-impl`.

FR-042: The injected section shall specify the exception condition: the user explicitly instructs to skip SDD (e.g., "直接やって", "skip SDD").

FR-043: The injected section shall contain konbini usage essentials (worktree usage, available commands overview).

### Edge Cases

FR-050: Where the configured CLAUDE.md path points to a location inside a non-existent directory, the system shall create the necessary parent directories.

FR-051: Where the marker comments exist but contain no content between them, the system shall inject the full section content.

FR-052: Where only one marker comment exists (start without end, or vice versa), the system shall treat the file as having no konbini-managed section and append a new properly-delimited section.

### Error Handling

FR-060: If the CLAUDE.md file cannot be written (permission error, read-only filesystem), the system shall display an error message and continue the init/update process without failing entirely.

FR-061: If `ao.yaml` does not contain `claude_md` settings when running `konbini update`, the system shall use defaults (`language: en`, `path: CLAUDE.md`).

## Non-Functional Requirements

### Idempotency

NFR-001: Running `konbini init` or `konbini update` multiple times with the same configuration shall produce identical CLAUDE.md content within the marker-delimited section.

NFR-002: Running `konbini init` or `konbini update` shall not modify any content outside the marker-delimited section.

### Maintainability

NFR-010: Language templates shall be stored as separate files (one per language) so that adding a new language requires only adding a new template file.

NFR-011: The template format shall support variable substitution for dynamic values (e.g., konbini version).

### Compatibility

NFR-020: The marker comments shall not interfere with Claude Code's parsing of CLAUDE.md.

NFR-021: The injection mechanism shall follow existing patterns in `template-copier.ts`.

## Acceptance Criteria

1. After `konbini init`, the project's CLAUDE.md contains an SDD enforcement section in the selected language.
2. After `konbini update`, the SDD enforcement section is updated to the latest version without affecting user content.
3. Running `konbini init` twice produces the same CLAUDE.md content.
4. A project with existing CLAUDE.md content retains that content after injection.
5. Language and path settings are persisted in `ao.yaml` and respected by `konbini update`.
6. Both `en` and `ja` templates produce correct, natural-sounding content.

## Traceability

| Init Requirement | Expanded Requirements |
|---|---|
| FR-001 (inject on init) | FR-001, FR-010–FR-014 |
| FR-002 (update on update) | FR-002, FR-024 |
| FR-003 (marker comments) | FR-010, FR-011, FR-012, FR-051, FR-052 |
| FR-004 (create if missing) | FR-013, FR-050 |
| FR-005 (user language) | FR-004, FR-023 |
| FR-006 (auto-detect lang) | FR-020 |
| FR-007 (default English) | FR-021 |
| FR-008 (interactive lang) | FR-022 |
| FR-009 (injected content) | FR-040, FR-041, FR-042, FR-043 |
| FR-010 (interactive path) | FR-030 |
| FR-011 (store in ao.yaml) | FR-031, FR-032, FR-061 |
| NFR-001 (idempotent) | NFR-001, NFR-002 |
| NFR-002 (preserve content) | FR-014, NFR-002 |
| NFR-003 (unobtrusive markers) | NFR-020 |

# Requirements: non-interactive-init

## Document Info
- Feature: non-interactive-init
- Status: Draft
- Created: 2026-03-13

## Functional Requirements

### Core Behavior
FR-001: When `--yes` or `-y` flag is provided, the system shall skip all interactive prompts and resolve every setting from explicit flags or defaults.
FR-002: When no flags are provided, the system shall behave identically to the current interactive flow.

### Flag-Based Configuration
FR-010: Where `--preset <name>` flag is provided, the system shall use the specified preset name without displaying the preset selection prompt.
FR-011: Where `--branch <name>` flag is provided, the system shall use the specified branch name without displaying the base branch prompt.
FR-012: Where `--lang <en|ja>` flag is provided, the system shall use the specified language for CLAUDE.md injection without displaying the language selection prompt.
FR-013: Where `--claude-md-path <path>` flag is provided, the system shall use the specified path for CLAUDE.md without displaying the path prompt.

### Default Resolution (--yes mode)
FR-020: When `--yes` flag is used without `--branch`, the system shall use the auto-detected base branch (via `detectBaseBranch()`).
FR-021: When `--yes` flag is used without `--preset`, the system shall use the `solo` preset.
FR-022: When `--yes` flag is used without `--lang`, the system shall use the auto-detected language (via `detectLanguage()` on existing CLAUDE.md, falling back to `en`).
FR-023: When `--yes` flag is used without `--claude-md-path`, the system shall use `CLAUDE.md` as the default path.

### Partial Flag Usage
FR-030: When individual flags are provided without `--yes`, the system shall skip the prompt for each specified flag but still prompt interactively for unspecified options.
FR-031: When `--preset` and `--yes` are both provided with value `custom`, the system shall apply default custom settings (downstream: `approve-only`, autoMerge: `true`, R8Actor: `human`, gitStrategy: `worktree`) without prompting.

### Edge Cases
FR-040: When `--preset custom` is provided without `--yes`, the system shall skip the preset selection prompt but still display the custom settings prompts.
FR-041: When `--branch` is provided with an empty string, the system shall fall back to the auto-detected base branch.

### Error Handling
FR-050: When `--preset` is provided with an invalid preset name, the system shall exit with code 1 and print an error message listing valid presets.
FR-051: When `--lang` is provided with a value other than `en` or `ja`, the system shall exit with code 1 and print an error message listing valid languages.

## Non-Functional Requirements

### Compatibility
NFR-001: The system shall maintain full backward compatibility — no existing interactive behavior shall change when no flags are passed.
NFR-002: The system shall not introduce new runtime dependencies for argument parsing.

### Usability
NFR-010: The `--help` output shall document all new flags with usage examples including a non-interactive one-liner.

## Acceptance Criteria
- `npx konbini init --yes` completes without any stdin input and produces the same output as the interactive flow with all defaults accepted.
- `npx konbini init --preset solo --branch main --lang en --yes` completes silently with the specified settings.
- `npx konbini init --preset solo` skips the preset prompt but still prompts for branch and language.
- `npx konbini init` (no flags) behaves identically to the current implementation.
- Invalid `--preset` or `--lang` values produce clear error messages and exit code 1.

## Traceability

| Init Req | Expanded Reqs |
|----------|---------------|
| FR-001 | FR-001, FR-020–FR-023, FR-031 |
| FR-002 | FR-010 |
| FR-003 | FR-011 |
| FR-004 | FR-012 |
| FR-005 | FR-013 |
| FR-006 | FR-020–FR-023 |
| FR-007 | FR-030, FR-040 |
| NFR-001 | NFR-001 |
| NFR-002 | FR-050, FR-051 |
| OQ-001 | NFR-002 (resolved: 手動パース、新依存なし) |
| OQ-002 | スコープ外（将来の拡張として検討可） |

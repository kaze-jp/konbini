# konbini

AI autonomous development framework inspired by [cc-sdd](https://github.com/gotalab/cc-sdd).

**Spec-Driven Development + Agent Orchestrator** — 人間は上流（仕様・設計・タスク分解）を承認するだけ。実装からマージまでをAIが自律的に完結させる。

## Quick Start

```bash
npx konbini init
```

プリセットを選択:
1. **solo** — 上流承認 + 下流は approve-only（推奨）
2. **solo-full-auto** — 上流承認後は完全自律
3. **team** — 上流承認 + 下流は review-and-approve

## Prerequisites

### Required Tools

| Tool | Purpose | Install |
|------|---------|---------|
| [Claude Code](https://claude.com/claude-code) | AI development environment | `npm i -g @anthropic-ai/claude-code` |
| [gh CLI](https://cli.github.com/) | GitHub operations (PR, review) | `brew install gh` |
| Git | Version control (worktree support) | OS standard |

### Required Claude Code Plugins

| Plugin | Purpose |
|--------|---------|
| [feature-dev](https://github.com/anthropics/claude-code-plugins) | Implementation guide |
| [code-review](https://github.com/anthropics/claude-code-plugins) | PR review |
| [superpowers](https://github.com/anthropics/claude-code-plugins) | TDD, brainstorming, simplify |

## Workflow

```
┌──────────────────────────────────────────────────┐
│  Upstream (Human approves)                       │
│                                                  │
│  R1: Requirements (EARS format)                  │
│  R2: Technical Design                            │
│  R3: Task Breakdown (parallel analysis)          │
│                    ↓ Approved                     │
├──────────────────────────────────────────────────┤
│  Downstream (AO autonomous execution)            │
│                                                  │
│  Phase 1:   Task analysis + branch creation      │
│  Phase 1.5: Context generation for workers       │
│  R4: Parallel implementation (TDD + worktree)    │
│  R5: Integration + Simplify                      │
│  R6: PR + Multi-specialist review                │
│  R7: Fix loop (until approve)                    │
│  R8: Pre-merge review (configurable)             │
│  → Merge + next task                             │
└──────────────────────────────────────────────────┘
```

## Configuration

All configuration lives in `.ao/ao.yaml`. Key settings:

```yaml
preset: solo                    # solo | solo-full-auto | team
autonomy:
  downstream: approve-only      # full-auto | approve-only | review-and-approve
git:
  strategy: worktree            # worktree | branch
  base_branch: main
tdd:
  enabled: true                 # TDD mandatory (Red → Green → Refactor)
```

### Presets

| Preset | R8 (Pre-merge) | Merge |
|--------|----------------|-------|
| `solo` | Human approval | Auto after approval |
| `solo-full-auto` | Skip | Auto |
| `team` | Human review + approval | Auto after approval |

## Review Breakpoints

| Phase | Actor | Description |
|-------|-------|-------------|
| R1 | Human | Requirements approval |
| R2 | Human | Design approval |
| R3 | Human | Task breakdown approval |
| R4 | AI | Parallel implementation + quality gates |
| R5 | AI | Integration + Simplify |
| R6 | AI | PR + multi-specialist review |
| R7 | AI | Fix loop until approve |
| R8 | Configurable | Pre-merge review |

## Learning Loop

konbini accumulates review patterns in `.ao/memory/`:
- Review findings are saved as patterns
- Patterns are injected into future reviews
- Auto-simplify when patterns exceed threshold (default: 20)

## Commands

```bash
npx konbini init              # Initialize in current project
npx konbini update            # Update templates (preserves config & memory)
npx konbini memory simplify   # Consolidate review patterns
npx konbini config show       # Show configuration
```

### Claude Code Commands (after init)

```
/kiro:spec-init <feature>     # Start new feature spec
/kiro:spec-requirements       # Expand to EARS requirements
/kiro:spec-design             # Create technical design
/kiro:spec-tasks              # Generate implementation tasks
/kiro:ao-run <feature>        # Launch autonomous execution
/kiro:spec-status             # Check progress
```

## Project Structure (generated)

```
your-project/
├── .claude/
│   ├── agents/               # AI agent definitions
│   └── commands/kiro/        # SDD commands
├── .ao/
│   ├── ao.yaml               # Configuration (single source of truth)
│   ├── steering/             # Product, tech, structure docs
│   └── memory/               # Learned patterns
└── .kiro/
    └── settings/
        ├── rules/            # EARS, design, task rules
        └── templates/        # Spec templates
```

## Credits

- [cc-sdd](https://github.com/gotalab/cc-sdd) by Gota — The original Spec-Driven Development framework
- Built for [Claude Code](https://claude.com/claude-code) by Anthropic

## License

MIT

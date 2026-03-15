# 🏪 konbini

[![GitHub stars](https://img.shields.io/github/stars/kaze-jp/konbini?style=social)](https://github.com/kaze-jp/konbini)
[![npm version](https://img.shields.io/npm/v/@kaze-jp/konbini)](https://www.npmjs.com/package/@kaze-jp/konbini)
[![npm downloads](https://img.shields.io/npm/dw/@kaze-jp/konbini)](https://www.npmjs.com/package/@kaze-jp/konbini)

**AI autonomous development framework** — Humans approve specs and design. AI handles everything from implementation to merge.

🧩 Spec-Driven Development (SDD) with an Agent Orchestrator, built for [Claude Code](https://claude.com/claude-code). Inspired by [cc-sdd](https://github.com/gotalab/cc-sdd).

## 🤔 Why konbini?

Most AI coding tools stop at code suggestions or completions. You still review diffs, manage branches, write tests, and submit PRs yourself.

konbini automates the **entire development pipeline**:

1. 🧑 **You** define *what* to build (requirements, design, task breakdown)
2. 🤖 **AI** handles *how* — implementation, testing, PRs, code review, and merge

| | Copilot / Cursor | Aider | Devin | **konbini** |
|---|---|---|---|---|
| Code suggestions | ✅ | ✅ | ✅ | ✅ |
| Spec-driven workflow | ❌ | ❌ | ❌ | ✅ |
| Integrated TDD | ❌ | ❌ | ❌ | ✅ |
| Parallel worktree impl | ❌ | ❌ | ❌ | ✅ |
| Auto PR + multi-specialist review | ❌ | ❌ | ✅ | ✅ |
| Self-improving review patterns | ❌ | ❌ | ❌ | ✅ |

📦 Zero runtime dependencies. One command to set up. Works with any project.

## 📋 Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Claude Code](https://claude.com/claude-code) | AI development environment (Pro/Max plan required) | `npm i -g @anthropic-ai/claude-code` |
| [gh CLI](https://cli.github.com/) | GitHub operations (PRs, reviews) | `brew install gh` → `gh auth login` |
| Git | Version control (worktree support) | Included with most OS |

### 🔌 Recommended Claude Code Plugins

| Plugin | Purpose | Install |
|--------|---------|---------|
| superpowers | TDD, brainstorming, planning | `claude plugin install superpowers` |
| feature-dev | Guided feature implementation | `claude plugin install feature-dev` |
| code-review | Multi-specialist PR review | `claude plugin install code-review` |

## 🚀 Quick Start

```bash
npx @kaze-jp/konbini init
```

The init wizard will ask you to:
1. Confirm your base branch (auto-detected)
2. Select a preset (`solo`, `solo-full-auto`, or `team`)
3. Choose CLAUDE.md language (English / Japanese)

After init, open Claude Code and say:

> "Read https://github.com/kaze-jp/konbini and help me get started."

Or jump right in:

```
/kiro:spec-init add-user-auth
```

### CLI Flags

Skip the wizard with flags:

```bash
npx @kaze-jp/konbini init --yes                          # Accept all defaults
npx @kaze-jp/konbini init --preset solo-full-auto        # Specify preset
npx @kaze-jp/konbini init --lang en --branch main        # Specify language and branch
```

## ⚙️ How It Works

```
┌──────────────────────────────────────────────────┐
│  👆 Upstream (Human approves)                    │
│                                                  │
│  spec-init          → Define feature             │
│  spec-requirements  → EARS requirements          │
│  spec-design        → Technical design           │
│  spec-tasks         → Task breakdown             │
│                    ↓ Approved                    │
├──────────────────────────────────────────────────┤
│  🤖 Downstream (AI autonomous — ao-run)          │
│                                                  │
│  Phase 1: Task analysis + branch creation        │
│  Phase 2: Context generation for workers         │
│  Phase 3: Parallel implementation (TDD)          │
│  Phase 4: Integration + Simplify                 │
│  Phase 5: Production readiness check             │
│  Phase 6: PR + Multi-specialist review           │
│  Phase 7: Fix loop (until approve)               │
│  Phase 8: Pre-merge review (configurable)        │
│  → Merge + next task                             │
└──────────────────────────────────────────────────┘
```

## 🔍 Phase Overview

| Phase | Actor | Description |
|-------|-------|-------------|
| Upstream | 🧑 Human | Requirements → Design → Tasks (approve each) |
| Phase 1 | 🤖 AI | Task analysis + branch creation |
| Phase 2 | 🤖 AI | Context generation for workers |
| Phase 3 | 🤖 AI | Parallel implementation (TDD + worktree) |
| Phase 4 | 🤖 AI | Integration + Simplify |
| Phase 5 | ⚙️ Configurable | Production readiness check |
| Phase 6 | 🤖 AI | PR + multi-specialist review |
| Phase 7 | 🤖 AI | Fix loop until approve |
| Phase 8 | ⚙️ Configurable | Pre-merge review |

## 🎛️ Configuration

`npx @kaze-jp/konbini init` creates the following presets:

| Preset | Description | Phase 8 (Pre-merge) | Merge |
|--------|-------------|---------------------|-------|
| `solo` (default) | Human approves upstream, approve-only downstream | Human approval | Auto after approval |
| `solo-full-auto` | Human approves upstream, fully autonomous downstream | Skip | Auto |
| `team` | Human approves upstream, review-and-approve downstream | Human review + approval | Auto after approval |

All configuration lives in `.ao/ao.yaml`. Key settings:

```yaml
preset: solo
autonomy:
  downstream: approve-only      # full-auto | approve-only | review-and-approve
git:
  strategy: worktree            # worktree | branch
  base_branch: main
tdd:
  enabled: true                 # TDD mandatory (Red → Green → Refactor)
```

See the full configuration reference in [`templates/config/ao.yaml.template`](templates/config/ao.yaml.template) for all available options including `skills`, `reviews`, `quality_gates`, `dependencies`, and more.

## 💻 Commands

### CLI

```bash
npx @kaze-jp/konbini init              # Initialize in current project
npx @kaze-jp/konbini update            # Update templates (preserves config & memory)
npx @kaze-jp/konbini memory simplify   # Consolidate review patterns
npx @kaze-jp/konbini config show       # Show configuration
```

### ⚡ Claude Code Slash Commands (available after init)

**Core workflow:**

```
/kiro:spec-init <feature>     # Start new feature spec
/kiro:spec-requirements       # Expand to EARS requirements
/kiro:spec-design             # Create technical design
/kiro:spec-tasks              # Generate implementation tasks
/kiro:spec-impl               # Start implementation phase
/kiro:ao-run <feature>        # Launch autonomous execution
/kiro:spec-status             # Check progress
```

**Validation & steering:**

```
/kiro:validate-design         # Validate technical design
/kiro:validate-impl           # Validate implementation against spec
/kiro:validate-gap            # Gap analysis between spec and code
/kiro:steering                # Manage product/tech context docs
/kiro:steering-custom         # Add custom steering document
```

## 📁 Project Structure (generated by init)

```
your-project/
├── .claude/
│   ├── agents/               # 🤖 AI agent definitions
│   └── commands/kiro/        # ⚡ SDD slash commands
├── .ao/
│   ├── ao.yaml               # ⚙️ Configuration (single source of truth)
│   ├── steering/             # 📄 Product, tech, structure docs
│   └── memory/
│       ├── review-patterns/  # 🧠 Learned review patterns
│       └── project-context/  # 📋 Project context
└── .kiro/
    └── settings/
        ├── rules/            # 📏 EARS, design, task rules
        └── templates/        # 📝 Spec templates
```

## 🧠 Learning Loop

konbini accumulates review patterns in `.ao/memory/`:
- 📝 Review findings are saved as patterns
- 💉 Patterns are injected into future reviews (Phase 2, 6, 7)
- 🔄 Auto-simplify when patterns exceed threshold (default: 20)

## 🙏 Credits

- [cc-sdd](https://github.com/gotalab/cc-sdd) by Gota — The original Spec-Driven Development framework
- Built for [Claude Code](https://claude.com/claude-code) by Anthropic

## 📄 License

MIT

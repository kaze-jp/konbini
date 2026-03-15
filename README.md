# 🏪 konbini

[![GitHub stars](https://img.shields.io/github/stars/kaze-jp/konbini?style=social)](https://github.com/kaze-jp/konbini)
[![npm version](https://img.shields.io/npm/v/@kaze-jp/konbini)](https://www.npmjs.com/package/@kaze-jp/konbini)
[![npm downloads](https://img.shields.io/npm/dw/@kaze-jp/konbini)](https://www.npmjs.com/package/@kaze-jp/konbini)

**AI autonomous development framework** — Humans approve specs and design. AI handles everything from implementation to merge.

🧩 Spec-Driven Development (SDD) with an Agent Orchestrator, built for [Claude Code](https://claude.com/claude-code). Inspired by [cc-sdd](https://github.com/gotalab/cc-sdd).

## 🤔 Why konbini?

Traditional AI-assisted coding still requires you to write code, review diffs, and manage branches manually. konbini flips this:

1. 🧑 **You** define *what* to build (requirements, design, task breakdown)
2. 🤖 **AI** handles *how* — implementation, testing, PRs, code review, and merge

📦 Zero runtime dependencies. One command to set up. Works with any project.

## 🚀 Quick Start

```bash
npx @kaze-jp/konbini init
```

Then open Claude Code and say:

> "Read https://github.com/kaze-jp/konbini and help me get started."

Claude will understand your project's configuration and guide you through the workflow.

Or jump right in:

```
/kiro:spec-init add-user-auth
```

## 📋 Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Claude Code](https://claude.com/claude-code) | AI development environment (Pro/Max plan required) | `npm i -g @anthropic-ai/claude-code` |
| [gh CLI](https://cli.github.com/) | GitHub operations (PRs, reviews) | `brew install gh` → `gh auth login` |
| Git | Version control (worktree support) | Included with most OS |

### 🔌 Recommended Claude Code Plugins

| Plugin | Purpose | Install |
|--------|---------|---------|
| [superpowers](https://github.com/anthropics/claude-code-plugins) | TDD, brainstorming, planning | `claude plugin install superpowers` |
| [feature-dev](https://github.com/anthropics/claude-code-plugins) | Guided feature implementation | `claude plugin install feature-dev` |
| [code-review](https://github.com/anthropics/claude-code-plugins) | Multi-specialist PR review | `claude plugin install code-review` |

## ⚙️ How It Works

```
┌──────────────────────────────────────────────────┐
│  👆 Upstream (Human approves)                    │
│                                                  │
│  R1: Requirements (EARS format)                  │
│  R2: Technical Design                            │
│  R3: Task Breakdown (parallel analysis)          │
│                    ↓ Approved                    │
├──────────────────────────────────────────────────┤
│  🤖 Downstream (AI autonomous execution)         │
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

## 🎛️ Configuration

`npx @kaze-jp/konbini init` creates the following presets:

| Preset | Description | R8 (Pre-merge) | Merge |
|--------|-------------|----------------|-------|
| `solo` (default) | Human approves upstream, approve-only downstream | Human approval | Auto after approval |
| `solo-full-auto` | Human approves upstream, fully autonomous downstream | Skip | Auto |
| `team` | Human approves upstream, review-and-approve downstream | Human review + approval | Auto after approval |

All configuration lives in `.ao/ao.yaml`:

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

## 💻 Commands

### CLI

```bash
npx @kaze-jp/konbini init              # Initialize in current project
npx @kaze-jp/konbini update            # Update templates (preserves config & memory)
npx @kaze-jp/konbini memory simplify   # Consolidate review patterns
npx @kaze-jp/konbini config show       # Show configuration
```

### ⚡ Claude Code Slash Commands (available after init)

```
/kiro:spec-init <feature>     # Start new feature spec
/kiro:spec-requirements       # Expand to EARS requirements
/kiro:spec-design             # Create technical design
/kiro:spec-tasks              # Generate implementation tasks
/kiro:ao-run <feature>        # Launch autonomous execution
/kiro:spec-status             # Check progress
```

## 🔍 Review Breakpoints

| Phase | Actor | Description |
|-------|-------|-------------|
| R1 | 🧑 Human | Requirements approval |
| R2 | 🧑 Human | Design approval |
| R3 | 🧑 Human | Task breakdown approval |
| R4 | 🤖 AI | Parallel implementation + quality gates |
| R5 | 🤖 AI | Integration + Simplify |
| R6 | 🤖 AI | PR + multi-specialist review |
| R7 | 🤖 AI | Fix loop until approve |
| R8 | ⚙️ Configurable | Pre-merge review |

## 📁 Project Structure (generated by init)

```
your-project/
├── .claude/
│   ├── agents/               # 🤖 AI agent definitions
│   └── commands/kiro/        # ⚡ SDD slash commands
├── .ao/
│   ├── ao.yaml               # ⚙️ Configuration (single source of truth)
│   ├── steering/             # 📄 Product, tech, structure docs
│   └── memory/               # 🧠 Learned review patterns
└── .kiro/
    └── settings/
        ├── rules/            # 📏 EARS, design, task rules
        └── templates/        # 📝 Spec templates
```

## 🧠 Learning Loop

konbini accumulates review patterns in `.ao/memory/`:
- 📝 Review findings are saved as patterns
- 💉 Patterns are injected into future reviews
- 🔄 Auto-simplify when patterns exceed threshold (default: 20)

## 🙏 Credits

- [cc-sdd](https://github.com/gotalab/cc-sdd) by Gota — The original Spec-Driven Development framework
- Built for [Claude Code](https://claude.com/claude-code) by Anthropic

## 📄 License

MIT

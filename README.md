# Becky

A multi-agent coding OS that combines role-based pipelines, an agent-maintained knowledge base, closed learning loops, and dual-runtime coordination (Claude + Codex).

Becky manages the full lifecycle of software — from greenfield discovery through brownfield maintenance — by maintaining a single source of truth in `core/rules/`, compiling it into runtime-specific instructions (`CLAUDE.md`, `AGENTS.md`), and enforcing quality through an independent verification agent.

## Quick start

```bash
npm install

# First time? Walk through the system
becky onboard

# Have existing BMad/Hermes/planning docs? Import them
becky learn /path/to/existing/docs

# Scan an existing project with BMad/Hermes/other agents
becky scan /path/to/project

# Start a new project
becky greenfield "my feature name"

# Or work on existing code
becky brownfield "fix the checkout bug"

# Run one phase at a time
becky run
becky approve          # pass the gate
becky revise "feedback" # send it back

# Or let it run overnight
becky autopilot

# Stuck? Bring all 7 agents into a war room
becky assemble "the checkout flow is silently failing"
```

## Commands

| Command | What it does |
|---------|-------------|
| `becky onboard` | Interactive walkthrough — folder structure, agents, commands |
| `becky learn /path` | Import existing docs (PRDs, architecture, UX specs) into the wiki |
| `becky scan /path` | Scan a project -- detect frameworks, analyze artifacts, suggest where to start |
| `becky greenfield "name"` | Create an 8-phase task (discovery through knowledge) |
| `becky brownfield "name"` | Create a 7-phase task (archaeology through knowledge) |
| `becky run` | Execute the current phase of the active task |
| `becky approve` | Pass the current gate, advance to next phase |
| `becky revise "feedback"` | Send feedback, re-run the current phase |
| `becky autopilot` | Run all remaining phases unattended |
| `becky status` | Show active tasks, rule count, wiki articles, memory entries |
| `becky assemble "problem"` | War room — all 7 agents on one problem |
| `becky retro [slug]` | Retrospective on a completed task |
| `becky rules add "title"` | Create a new rule with proper frontmatter |
| `becky compile` | Generate CLAUDE.md + AGENTS.md from rules |
| `becky verify` | Check rules for missing fields, duplicates, stale refs |
| `becky init /path` | Scaffold wiki, memory, and config in a target project |

## The Agents

| Agent | Role | Lens |
|-------|------|------|
| **Fury** | Discovery | Sees the whole board. Asks WHY until the real problem surfaces. |
| **Strange** | Architecture | 14 million possible designs. Picks the one that ships. |
| **Shuri** | Experience | Bridges innovation and usability. Error states aren't optional. |
| **Stark** | Build | Writes the code. Tests alongside. Never self-grades. |
| **Widow** | Test | Opens a real browser. Clicks real buttons. Finds what everyone missed. |
| **Heimdall** | Verify | All-seeing. Cannot be overridden. DONE means runtime evidence. |
| **Watcher** | Memory | Chronicles everything. The system's institutional memory. |

## Structure

```
becky/
  core/
    rules/             The law. Every guardrail lives here.
    commands/          CLI command handlers
    cli.ts             Main router
    compile.ts         Rules → CLAUDE.md + AGENTS.md
    verify.ts          Lint rules for issues
  agents/              The team (Fury, Strange, Shuri, Stark, Widow, Heimdall, Watcher)
  tasks/               Active work — one folder per task, phase-by-phase
  wiki/                Agent-maintained knowledge base
  memory/              Three-tier: global, project, session
  modes/               Greenfield, brownfield, /avenger-assemble
  loop/                Learning triggers: retro, incident, skill-distill
  bridge/              Generated output: CLAUDE.md, AGENTS.md, tools.json
```

## How Autopilot Works

Each phase is self-contained. The agent reads inputs from a known location and writes outputs to a known location. No ambient context needed.

```
becky greenfield "checkout redesign"    # Creates 8 phase folders + _task.yaml
becky autopilot                         # Writes instructions for each phase

Phase 1 (Fury):     Reads rules + wiki          → Writes brief.md
Phase 2 (Shuri):    Reads brief                  → Writes ux-spec.md
Phase 3 (Strange):  Reads brief + UX spec        → Writes architecture.md + ADRs
Phase 4 (Fury):     Reads all previous           → Writes stories/
Phase 5 (Stark):    Reads stories + arch + UX    → Writes code + tests
Phase 6 (Widow):    Reads stories + code         → Writes test-report.md + screenshots
Phase 7 (Heimdall): Reads ALL previous           → Writes verdict.yaml
Phase 8 (Watcher):  Reads ALL + verdict          → Writes wiki articles
```

You type one command before bed. You wake up to completed work with every phase documented, every decision recorded, every output verified.

## Principles

1. **Rules are the source of truth.** CLAUDE.md and AGENTS.md are compiled outputs. Edit rules, not outputs.
2. **Verification is independent.** Heimdall holds verdicts separately from Stark. No self-grading.
3. **Wiki is agent-maintained.** Watcher compiles knowledge from completed work. Humans read it; agents write it.
4. **Incidents generate rules.** Every P0 produces a new rule and (where possible) automated enforcement. Rules compound; mistakes don't repeat.
5. **Three modes, one system.** Greenfield (discovery-first), brownfield (archaeology-first), and `/avenger-assemble` (all 7 agents in a war room).
6. **DONE means runtime evidence.** Three tiers — DONE, VERIFIED, AUDITED — reported separately, never combined.
7. **Assemble when stuck.** All 7 agents, each with their own lens, their own elicitation techniques, and the obligation to disagree when they see something others missed.

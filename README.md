# Becky

A multi-agent coding OS that combines role-based pipelines, an agent-maintained knowledge base, closed learning loops, and dual-runtime coordination (Claude + Codex).

Becky manages the full lifecycle of software — from greenfield discovery through brownfield maintenance — by maintaining a single source of truth in `core/rules/`, compiling it into runtime-specific instructions (`CLAUDE.md`, `AGENTS.md`), and enforcing quality through an independent verification agent.

> An open multi-agent coding OS.

New here? The friendliest way in is the **[comic guide](https://becky-os.netlify.app/guide)** — the same site you can run locally from `site/`.

## Quick start

```bash
npm install

# First time? Walk through the system
becky onboard

# Have existing planning docs? Import them
becky learn /path/to/existing/docs

# Scan an existing project
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

# Stuck? Bring all 15 agents into the war room
becky warroom "the checkout flow is silently failing"
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
| `becky warroom "problem"` | War room — all 15 agents on one problem |
| `becky retro [slug]` | Retrospective on a completed task |
| `becky rules add "title"` | Create a new rule with proper frontmatter |
| `becky compile` | Generate CLAUDE.md + AGENTS.md from rules |
| `becky verify` | Check rules for missing fields, duplicates, stale refs |
| `becky init /path` | Scaffold wiki, memory, and config in a target project |

## The Agents

The roster is **15 agents** — a 13-specialist council plus 2 wordsmiths — ordered by lifecycle. Each is a distinct lens, and each is obligated to disagree when they see something the others missed. The war room (`becky warroom`) convenes all 15.

### The Council (13)

| Agent | Role | Lens |
|-------|------|------|
| **Vision** | Research | Searches the world — competitors, prior art, feasibility — before anyone decides. |
| **Fury** | Discovery | Sees the whole board. Asks WHY until the real problem surfaces. |
| **Coulson** | Requirements | Turns the brief into numbered, traceable, testable requirements and stories. |
| **Xavier** | Domain Expert | Brings any industry's edge cases, compliance, and competitive landscape. |
| **Shuri** | Experience | Error states aren't optional. Designs experiences, not screens. |
| **Strange** | Architecture | 14 million possible designs. Picks the one that ships. Writes the ADRs. |
| **Stark** | Build | Writes the code. Tests alongside. Never self-grades. |
| **Loki** | Adversarial Review | Red-teams the PRD and the code for edge cases, security, and broken assumptions. |
| **Widow** | Test | Opens a real browser. Clicks real buttons. Finds what everyone missed. |
| **Deadpool** | Chaos | Deliberately breaks things to surface silent failures (PG-13, no profanity). |
| **Friday** | Impact Analyst | Maps the blast radius of every change before it ships. |
| **Heimdall** | Verify | All-seeing. Cannot be overridden. DONE means runtime evidence. |
| **Watcher** | Memory | Tends the living wiki. The same battle is never fought twice. |

### The Wordsmiths (2)

| Agent | Role | Lens |
|-------|------|------|
| **Parker** | Docs & Guides | Friendly neighborhood writer. Turns features into docs anyone can follow — never invents what the code lacks. |
| **Quill** | DevRel & Announcements | Star-Lord energy. Changelogs and launch copy anchored to a real, verified change. |

## How it works — the pillars

Five ideas hold the whole system together:

- **The Living Wiki.** Agents tend a plain-text knowledge base — immutable raw sources, agent-written pages, and a human-owned schema. The system remembers, so the same battle is never fought twice.
- **One Program Per Agent.** Every agent is a single English spec with one owned output and one outcome. Orchestration is English, not buried in code — auditable, reversible, forkable.
- **Generate, then Verify.** Agents generate; an independent agent verifies. A demo is `works.any()`; a product is `works.all()`. DONE means runtime evidence.
- **The Council.** 13 specialists plus 2 wordsmiths, each a distinct lens, each obligated to disagree.
- **Forkable by design.** Zero dependencies, fits in your head, clone-it-and-own-it, no lock-in. Deleting code that still works is a win.

## Privacy & safety

This repo ships clean — no personal data, no secrets, no third-party brand leaks.

- Run `npm run privacy` before committing. It scans for personal info, secrets, and brand-specific references.
- Copy `scripts/.privacy-deny.example` to `scripts/.privacy-deny.local` and add your own terms — the `.local` file is yours and stays out of commits.
- See [`SECURITY.md`](./SECURITY.md) for the full policy and how to report an issue.

## Structure

```
becky/
  core/
    rules/             The law. Every guardrail lives here.
    commands/          CLI command handlers
    cli.ts             Main router
    compile.ts         Rules → CLAUDE.md + AGENTS.md
    verify.ts          Lint rules for issues
  agents/              The team — 13 council (Vision, Fury, Coulson, Xavier, Shuri, Strange, Stark, Loki, Widow, Deadpool, Friday, Heimdall, Watcher) + 2 wordsmiths (Parker, Quill)
  tasks/               Active work — one folder per task, phase-by-phase
  wiki/                Agent-maintained knowledge base
  memory/              Three-tier: global, project, session
  modes/               Greenfield, brownfield, war room
  loop/                Learning triggers: retro, incident, skill-distill
  scripts/             Tooling — privacy-scan and friends
  site/                The project site (comic guide, served at /guide)
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
5. **Three modes, one system.** Greenfield (discovery-first), brownfield (archaeology-first), and the war room (all 15 agents on one problem).
6. **DONE means runtime evidence.** Three tiers — DONE, VERIFIED, AUDITED — reported separately, never combined.
7. **Convene the war room when stuck.** All 15 agents, each with their own lens, their own elicitation techniques, and the obligation to disagree when they see something others missed.

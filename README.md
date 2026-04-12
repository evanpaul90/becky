# Becky

A multi-agent coding OS that combines role-based pipelines, an agent-maintained knowledge base, closed learning loops, and dual-runtime coordination (Claude + Codex).

Becky manages the full lifecycle of software — from greenfield discovery through brownfield maintenance — by maintaining a single source of truth in `core/rules/`, compiling it into runtime-specific instructions (`CLAUDE.md`, `AGENTS.md`), and enforcing quality through an independent verification agent.

## Quick start

```bash
# Install
npm install

# Initialize Becky in a target project
npx becky init /path/to/your/project

# Compile rules into CLAUDE.md + AGENTS.md
npx becky compile

# Verify rules for contradictions and stale references
npx becky verify
```

## Structure

```
becky/
  core/rules/       Source of truth. Every guardrail lives here.
  agents/            Role definitions (Fury, Strange, Shuri, Stark, Widow, Heimdall, Watcher)
  wiki/              Agent-maintained compiled knowledge base
  modes/             Greenfield, brownfield, and /avenger-assemble workflows
  memory/            Three-tier persistent memory (global, project, session)
  loop/              Learning loop templates (retro, incident, skill-distill)
  bridge/            Generated output — CLAUDE.md, AGENTS.md, tools.json
```

## Principles

1. **Rules are the source of truth.** CLAUDE.md and AGENTS.md are compiled outputs. Edit rules, not outputs.
2. **Verification is independent.** Heimdall holds PASS/FAIL/PARTIAL verdicts separately from Stark. No self-grading.
3. **Wiki is agent-maintained.** Watcher compiles knowledge from completed work into the wiki. Humans read it; agents write it.
4. **Incidents generate rules.** Every P0 produces a new rule in `core/rules/` and (where possible) an automated guardrail. Rules compound; mistakes don't repeat.
5. **Three modes, one system.** Greenfield (discovery-first), brownfield (archaeology-first), and `/avenger-assemble` (all 7 agents in a war room). Same rules, same agents, same wiki.
6. **DONE means runtime evidence.** Three tiers — DONE, VERIFIED, AUDITED — reported separately, never combined.
7. **Assemble when stuck.** `/avenger-assemble` puts all 7 agents in one room — each with their own lens, their own elicitation techniques, and the obligation to disagree when they see something others missed.

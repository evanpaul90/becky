# Becky Memory Architecture (BMA)

> Inspired by human cognition: working memory is small and focused,
> long-term memory is vast and on-demand, and a spine connects them.

## The Problem

A 14-phase pipeline generates massive context. By Phase 9 (Build), there are 8 prior
phase outputs. Loading all of them into the subagent's prompt:
- Blows past useful attention limits
- Triggers "lost in the middle" (Stanford, 2023) — LLMs attend to start and end, ignore the middle
- Wastes tokens on context the agent doesn't need for THIS phase
- Makes autopilot brittle — one compaction and you lose nuance

## The Architecture: Three Layers

```
┌─────────────────────────────────────────────────┐
│  LAYER 0: SPINE  (~200-400 tokens, ALWAYS loaded) │
│  • Project identity                                │
│  • Current task + phase                            │
│  • Phase summary chain (1-2 lines per phase)       │
│  • Active rules summary                            │
│  • File pointers (WHERE to look, not WHAT it says) │
│  Lives in: tasks/<slug>/_spine.md                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│  LAYER 1: PHASE CONTEXT  (~2000-4000 tokens)         │
│  • FULL content of 1-2 direct dependency phases       │
│  • Phase-specific rules (not ALL rules)               │
│  • Relevant knowledge articles (from index scoring)   │
│  • Assembled fresh by orchestrator for each phase     │
│  Lives in: dynamically assembled prompt               │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│  LAYER 2: DEEP RECALL  (unlimited, on-demand)         │
│  • Full prior phase outputs (files on disk)            │
│  • Full knowledge articles (becky-knowledge/)          │
│  • Full migration files, PRDs, codebase                │
│  • Agent reads via Read tool ONLY when it needs detail │
│  Lives in: files on disk, permanent                    │
└─────────────────────────────────────────────────────┘
```

## The Spine

The spine is the connective tissue. After each phase completes, the orchestrator
appends a 2-4 line summary to `_spine.md`. The spine grows incrementally but stays
compact (~30 lines for all 14 phases).

### Spine Format

```markdown
# Task Spine: <task name>
Mode: greenfield | Pipeline: ultrathink | Created: <date>

## Phase Chain
- [1-research] DONE — <2-line summary>. Output: phase-1-research/research.md
- [2-discovery] DONE — <2-line summary>. Output: phase-2-discovery/brief.md
- [3-requirements] DONE — <2-line summary>. Output: phase-3-requirements/prd.md
- [4-adversarial-review] ACTIVE — Loki reviewing PRD...
- [5-experience-design] PENDING
- ...

## Key Decisions (accumulated)
- <Decision from Phase 2>: <one line>
- <Decision from Phase 6>: <one line>

## Open Issues (accumulated)
- <Issue from Phase 4>: <one line>

## File Map
- research.md → phase-1-research/research.md
- brief.md → phase-2-discovery/brief.md
- prd.md → phase-3-requirements/prd.md
- ...
```

The spine answers: Where are we? What happened? Where is everything?

## Phase Context Assembly: What Each Phase Needs

NOT "read ALL prior outputs." Each phase gets the spine PLUS its direct dependencies:

| Phase | Spine | Full Content (Layer 1) | On-Demand (Layer 2) |
|-------|-------|----------------------|-------------------|
| 1-research | Task description only | — | Web search results |
| 2-discovery | Spine | research.md | — |
| 3-requirements | Spine | brief.md, research.md | — |
| 4-adversarial-review | Spine | prd.md | brief.md, research.md |
| 5-experience-design | Spine | prd.md, review-findings.md | brief.md, research.md |
| 6-architecture | Spine | prd.md, ux-spec.md | review-findings.md |
| 7-readiness-check | Spine | prd.md, ux-spec.md, architecture.md | All prior (verification) |
| 8-stories | Spine | prd.md, architecture.md, ux-spec.md | readiness-report.md |
| 9-build | Spine | stories.md, architecture.md | ux-spec.md (per-story) |
| 10-code-review | Spine | implementation-notes.md, git diff | prd.md, architecture.md |
| 11-test | Spine | stories.md, implementation-notes.md | ux-spec.md, prd.md |
| 12-verify-learn | Spine | test-report.md, code-review.md | ALL prior (verdict) |

**Key insight:** Phase 9 (Build) does NOT load the full PRD. It loads stories.md
(which references FRs by ID) and architecture.md (which has the data model).
If Stark needs a specific FR's details, he reads prd.md on-demand via the Read tool.

## Position-Aware Prompt Assembly

Based on "Lost in the Middle" research, information at the START and END of the
prompt gets the most attention. Structure every agent prompt:

```
[START — highest attention, primacy effect]
Spine: who you are, what task, what phase, where everything is
Rules: phase-specific rules only (not all 48)

[MIDDLE — lowest attention, OK for reference]
Layer 1 full content: prior phase outputs the agent needs
Knowledge articles: relevant concepts/incidents

[END — highest attention, recency effect]
YOUR MISSION: exactly what this phase must produce
Gate criteria: what "done" means
Output path: where to write files
"Do this NOW" energy
```

## Cross-Session Survival

When a session ends and a new one starts:

1. **SessionStart hook** injects `becky-knowledge/index.md` → agent knows the knowledge base
2. User runs `/becky-run` → orchestrator reads `_task.yaml` → knows the phase
3. Orchestrator reads `_spine.md` → has full history of what happened in every prior phase
4. Orchestrator assembles Layer 1 context from the phase dependency table above
5. Agent spawns with a focused, position-aware prompt
6. Zero information loss. Zero context bloat.

**The spine is the cross-session bridge.** It's 30 lines that encode the entire pipeline's progress.

## Compaction Survival

If the main conversation compacts during autopilot:
- `_task.yaml` is on disk → phase state survives
- `_spine.md` is on disk → progress history survives
- Each subagent runs in isolation → their work is already saved to files
- The orchestrator re-reads _task.yaml and _spine.md → picks up exactly where it left off

Compaction can't destroy file-based state.

## Memory Scoring for Knowledge Injection

When assembling Layer 1, the orchestrator selects relevant knowledge articles:

For each article in `becky-knowledge/index.md`:
1. **Phase match** — Does the article category match the current phase? (incidents → build/test, patterns → architecture, concepts → all)
2. **Keyword overlap** — Does the article summary share words with the current task description?
3. **Severity** — P0 incidents ALWAYS load for build, test, and verify phases
4. **Recency** — Articles from the last 7 days score higher

The orchestrator (an LLM) does this scoring implicitly — it reads the index,
understands the current phase, and selects relevant articles. No vector DB needed.
The LLM IS the relevance engine.

## Why This Is Better Than Wiki/Obsidian Alone

Obsidian is STORAGE. The spine is RETRIEVAL. Together:

| Capability | Obsidian Alone | Spine + Obsidian |
|-----------|---------------|-----------------|
| Store knowledge | Yes | Yes |
| Know what's relevant NOW | No (you search) | Yes (spine + phase deps) |
| Survive compaction | N/A | Yes (file-based) |
| Survive session boundary | No | Yes (spine + hooks) |
| Scale to 100 articles | Gets noisy | Spine stays 30 lines |
| Position-aware loading | No | Yes (start/middle/end) |
| Cross-phase traceability | Manual links | Spine chain is automatic |

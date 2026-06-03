# Becky

A complete, battle-tested multi-agent coding OS. **15 agents, one purpose each.** A 14-phase
software lifecycle with three hard gates. A growing ledger of every scar the system has ever
taken — each one now an owned guardrail. And loop modes that don't stop on an agent saying
"done" — they stop on independent runtime proof.

Becky takes a problem from "what already exists in the world?" all the way to "shipped, verified,
documented, and announced" — without ever letting the agent that built something certify its own
work. The whole system fits in your head: every agent is one English contract, every phase has one
owner and one verifier, every past failure is encoded so it can't recur.

> An open multi-agent coding OS. Domain-agnostic. Forkable. Zero lock-in.

New here? The friendliest way in is the **[beckyOS website & guide](https://beckyos.com)**.

## Runtimes & IDEs

Becky keeps one source of truth in `core/rules/` and compiles it into `CLAUDE.md` and `AGENTS.md` (`becky compile`). Edit the rules, not the outputs — and run the team wherever you work:

- **Claude Code** — first-class: the loop modes ship as slash-commands (`/becky-deliver`, `/becky-greenfield`, `/becky-warroom`…) and the compiled `CLAUDE.md`.
- **Codex** — co-runtime via `AGENTS.md`; it can take the verifier role in the dual-runtime bridge (builder and grader on different runtimes).
- **Cursor · Windsurf · any AGENTS.md-aware IDE** — point the IDE's agent at the compiled `AGENTS.md` and drive the same 15 agents, rules, and program contracts.
- **Any terminal** — the `becky` CLI is plain Node: scaffold the pipeline, compile, and run `verify` from anywhere.

The slash-command loop modes are native to Claude Code; everywhere else the agents, rules, and CLI are fully portable.

## Quick start

```bash
npm install

# First time? Walk through the system
becky onboard

# Scan an existing project — frameworks, artifacts, where to start
becky scan /path/to/project

# Start a new build (runs the full 14-phase SDLC)
becky greenfield "my feature name"

# Or work on existing code (archaeology-first)
becky brownfield "fix the checkout bug"

# Run one phase at a time, stopping at each gate
becky run
becky approve            # pass the gate, advance
becky revise "feedback"  # send it back

# Or let it run every remaining phase unattended
becky autopilot

# Stuck on a hard problem? Convene the whole council
becky warroom "the checkout flow is silently failing"
```

The **loop modes** — the ones that run until the work is genuinely delivered — ship as Claude Code
skills. Type `/becky-deliver`, `/becky-hunt`, `/becky-harden`, `/becky-migrate`, or
`/becky-sentinel` to start one.

## Commands

| Command | What it does |
|---------|-------------|
| `becky onboard` | Interactive walkthrough — folder structure, agents, commands |
| `becky scan /path` | Scan a project — detect frameworks, analyze artifacts, suggest where to start |
| `becky greenfield "name"` | New build, full 14-phase SDLC (Research → Announcement) |
| `becky brownfield "name"` | Fix/extend existing code, archaeology-first variant |
| `becky run` | Execute the current phase of the active task |
| `becky approve` | Pass the current gate, advance to the next phase |
| `becky revise "feedback"` | Send feedback, re-run the current phase |
| `becky autopilot` | Run all remaining phases unattended, one pass |
| `becky status` | Active tasks, rule count, wiki articles, memory entries |
| `becky warroom "problem"` | War room — all 15 agents converge on one hard problem |
| `becky retro [slug]` | Retrospective on a completed task |
| `becky rules add "title"` | Create a new rule with proper frontmatter |
| `becky compile` | Generate CLAUDE.md + AGENTS.md from rules |
| `becky verify` | Lint rules for missing fields, duplicates, stale refs |
| `becky init /path` | Scaffold wiki, memory, and config in a target project |

**Loop modes (run as Claude Code skills):** `/becky-deliver` (loop until delivered),
`/becky-hunt`, `/becky-harden`, `/becky-test`, `/becky-migrate`, `/becky-sentinel`, `/becky-warroom`.
Each loops until an **independent, runtime-grounded** stop condition — never a self-report.

## The 14-phase SDLC

The spine of the system. Every greenfield build walks these phases in order. Each phase has one
agent who runs it and — crucially — a *different* agent who verifies it. The builder never grades
its own build. Full spec: **[`core/sdlc.md`](./core/sdlc.md)**.

```
 1  Research            Vision      → what already exists in the world (prior art, OSS, feasibility)
 2  Discovery           Fury        → the real problem (ask WHY until it surfaces)
 3  Requirements        Coulson     → numbered, testable requirements + stories
 4  Adversarial review  Loki        → red-team the PRD; find the gap everyone rationalized
 5  Experience design   Shuri       → every state, error, and empty — from the system of record
 6  Architecture        Strange     → data models & contracts, verified against the live system
 7  Readiness  ▰ GATE ▰ Heimdall    → specs aligned + release path + env ready, before ANY build
 8  Stories             Coulson     → acceptance criteria as executable assertions
 9  Build               Stark       → per-story build→lint→fix→test loop   ║ Friday traces impact
10  Code review         Loki        → rules + lint compliance on the diff
11  Test + Chaos        Widow + Deadpool → live e2e + hypothesis-driven attacks on every invariant
12  Verify  ▰ GATE ▰    Heimdall + Watcher → DONE needs runtime proof; outcomes → the ledger
13  Documentation       Parker      → make the shipped change followable in 5 minutes
14  Announcement  ▰GATE▰ Quill      → release notes anchored to the verdict — never vaporware
```

**Three hard gates, no path around them:**

- **Phase 7 — Heimdall readiness.** Build does not start until requirements, UX, and architecture
  agree *and* the release path + environment are ready. Catches the "shipped without a QA surface /
  env drift" class.
- **Phase 12 — Heimdall verdict.** Nothing is DONE without a runtime artifact. Heimdall opens its
  own browser and queries the live system — it does not trust "it works" from the agent that built
  it. AUDITED-reported-as-DONE is a P0 process bug.
- **Phase 14 — Quill's truth check.** Nothing is announced that isn't actually DONE with runtime
  proof. An announcement that outruns the verdict is vaporware.

**Cross-cutting agents** (not a phase — always on): **Friday** is change-driven (every diff during
Build gets a blast-radius trace), **Xavier** is on-call across phases 1·3·4·5·6·11 (any agent can
ask "how does the domain actually handle X?"), and **Watcher** runs continuously and closes every
task — turning new failures into ledger rows so the system gets harder to break the longer it runs.

## The Agents — all 15

A 13-specialist council plus two wordsmiths. Each is a distinct lens, each owns exactly one
artifact, and each is obligated to disagree when it sees something the others missed. Every one of
the 15 is used in the pipeline above. Roster source: **[`core/sdlc.md`](./core/sdlc.md)**.

| Agent | The one job only this agent does | Owns |
|-------|----------------------------------|------|
| **Vision** | Find what already exists in the world — prior art, competitors, OSS, feasibility. | `research.md` |
| **Fury** | Ask *why* until the real problem surfaces — kill the wrong problem before it costs a sprint. | `brief.md` |
| **Coulson** | Turn the brief into numbered, **testable** requirements + stories. The AC is the future test. | `prd.md`, `stories.md` |
| **Xavier** | Be the domain — behavior matrices, operational scenarios, compliance, so nothing is guessed. | `domain-brief.md` |
| **Loki** | Adversarially red-team — first the PRD, later the code. Find the gap everyone rationalized. | `review-findings.md`, `code-review.md` |
| **Shuri** | Design the experience — every state, error, and empty, driven from the system of record. | `ux-spec.md` + baselines |
| **Strange** | Architect data models & contracts, **verified against the live system**. No phantom schema. | `architecture.md`, ADRs |
| **Heimdall** | The gatekeeper — readiness before build; the DONE/VERIFIED/AUDITED verdict after test. | `readiness-report.md`, `verdict.yaml` |
| **Stark** | Build per-story, with a build→lint→fix→test loop. Fail loud; read the spec first. | implementation + notes |
| **Friday** | Trace the blast radius of every change → a use-case per affected surface. Nothing slips. | `impact-map.json` |
| **Deadpool** | Break it on purpose — hypothesis-driven, domain-aware attacks on every invariant. | `chaos-report.md` |
| **Widow** | Test like a human against the live surface. Runtime e2e is the heartbeat; failures → issues. | `test-report.md` + issues |
| **Watcher** | Turn every outcome into durable knowledge — new failures become ledger rows + wiki pages. | wiki + ledger rows |
| **Parker** | Document what shipped — make the verified change followable by a stranger in 5 minutes. | `docs/`, guides |
| **Quill** | Announce it — changelog + release notes anchored to a real, verified change. No vaporware. | release notes |

## The modes — every entry point

Every way you start Becky, what it loops on, and how it knows it's done. The loop modes all
terminate on the **Done Oracle** — independent runtime verification, never a self-report. Full
reference: **[`core/modes.md`](./core/modes.md)**.

**Build / fix**

| Mode | What it does | Stops when |
|------|--------------|------------|
| `greenfield <name>` | New build, all 14 phases | phases complete, gates passed |
| `brownfield <problem>` | Fix/extend existing code, archaeology-first | bug fixed + verified |
| `deliver <task>` ⭐ | greenfield/brownfield, **looped** | **Done Oracle GREEN** (every AC DONE with runtime proof) — or an honest budget-stop that reports exactly what's still red |
| `design <name>` | UX / redesign pipeline | design spec + visual baselines done |

**Quality / hardening loops**

| Mode | What it does | Stops when |
|------|--------------|------------|
| `hunt <surface>` | Adversarial bug hunt (Deadpool + Widow) | K consecutive *dry* rounds — no new confirmed bug |
| `harden <target>` | Security / invariant campaign | K dry rounds — no new weakness |
| `test` | The designed testing campaign | coverage manifest satisfied |
| `migrate <change>` | Work-list transform, each site worktree-isolated | every site DONE + verified (N/N) |

**Watch / survey**

| Mode | What it does | Stops when |
|------|--------------|------------|
| `sentinel <signal>` | Always-on watcher (scheduled): monitor → triage → fix → verify | per-run: signal clear; risky actions escalated, never auto-taken |
| `scan` / `triage` | Platform-wide scan → classify → fix | nothing new found |

**Convene**

| Mode | What it does | Stops when |
|------|--------------|------------|
| `warroom <problem>` | All 15 agents converge on one hard problem | convergence + exit criteria locked to the Done Oracle |
| `retro [slug]` | Retrospective on a finished task | lessons captured by Watcher |

Every loop above stops on **independent, runtime-grounded verification**, not on an agent saying
"done." A secondary budget/iteration cap can stop a loop early — and when it does, the loop reports
*exactly what is still red*, never a false "delivered." That honesty is the whole point.

## The Done Oracle — when a loop may stop

The industry's autonomous loops fail at one thing: they let the agent decide it's done, so it games
the check — edits tests to pass, forges completion markers, declares victory falsely (worse the
longer the loop runs). The **Done Oracle** is why Becky's loops don't. It is the independent,
runtime-grounded termination predicate: **DONE means runtime proof, never a self-report.** A loop is
"delivered" only when *all* of these are GREEN — Heimdall's verdict (every AC DONE with a live
artifact), full coverage, an exhausted adversary, green live tests, a clean ledger, and proven
independence (the verifier is a different agent than the builder, with its *own* evidence). Spec:
**[`core/done-oracle.md`](./core/done-oracle.md)**.

## The Lessons Ledger — every scar is owned

**35 scars and counting** — every real incident the system has ever survived, distilled to its
transferable, generic lesson and turned into a guardrail. Each row is owned by the agent positioned
to catch it: a migration moved without a replacement is owned by Strange; a story marked DONE on
file-existence instead of runtime proof is owned by Heimdall; a loop that games its own completion
check is owned by Loki. When a new incident happens, Watcher appends one row, tags an owner, and the
owning agent's phase **inherits that gate next run**. The system learns so the agents don't have to
relearn — it gets harder to break the longer it runs. Read it:
**[`core/lessons-ledger.md`](./core/lessons-ledger.md)**.

## Program contracts — one English spec per agent

Karpathy's `program.md` discipline: an agent's behaviour is described in **English**, not buried in
code. Every agent in **[`agents/programs/`](./agents/programs/)** is a single contract with the same
shape, so the whole council fits in your head:

- **Purpose** — one line, the one job only this agent does
- **Consumes** — its inputs (the prior phase's owned artifact)
- **Produces** — its one owned artifact
- **Outcome** — the single thing it optimizes
- **Lessons-gated** — the ledger rows it inherits as gates
- **Handoff** — who runs next
- **Gap-Fill block** — what it covered (with evidence) and what it did *not*, which must be present
  before the agent is allowed to stop

Orchestration is English — auditable, reversible, forkable. No agent grades its own output as the
final word; a different agent always verifies.

## How it works — the pillars

- **The Living Wiki.** Agents tend a plain-text knowledge base — immutable raw sources,
  agent-written pages, and a human-owned schema. The system remembers, so the same battle is never
  fought twice.
- **One program per agent.** Every agent is a single English contract with one owned output and one
  outcome. Orchestration is English, not code.
- **Generate, then verify.** Agents generate; an independent agent verifies. A demo is `works.any()`;
  a product is `works.all()`. DONE means runtime evidence.
- **The council.** 13 specialists plus 2 wordsmiths, each a distinct lens, each obligated to
  disagree.
- **Forkable by design.** Zero dependencies, fits in your head, clone-it-and-own-it, no lock-in.
  Deleting code that still works is a win.

## Principles

1. **Rules are the source of truth.** CLAUDE.md and AGENTS.md are compiled outputs. Edit rules, not
   outputs.
2. **Verification is independent.** Heimdall holds verdicts separately from Stark. No self-grading.
   The Done Oracle makes this mechanical, not a matter of trust.
3. **The wiki is agent-maintained.** Watcher compiles knowledge from completed work. Humans read it;
   agents write it.
4. **Incidents generate guardrails.** Every failure becomes a row in the ledger, owned by the agent
   that should catch it next time. Guardrails compound; mistakes don't repeat.
5. **DONE means runtime evidence.** Three tiers — DONE, VERIFIED, AUDITED — reported separately,
   never combined.
6. **Loops stop on proof, not on a self-report.** A budget-stop is reported honestly as "not
   delivered — here's exactly what's still red," never as done.
7. **Convene the war room when stuck.** All 15 agents, each with their own lens and the obligation to
   disagree.

## Privacy & safety

This repo ships clean — no personal data, no secrets, no third-party brand leaks.

- Run `npm run privacy` before committing. It scans for personal info, secrets, and brand-specific
  references.
- Copy `scripts/.privacy-deny.example` to `scripts/.privacy-deny.local` and add your own terms — the
  `.local` file is yours and stays out of commits.
- See [`SECURITY.md`](./SECURITY.md) for the full policy and how to report an issue.

## Structure

```
becky/
  core/                   The brain — the system on a page, plus the law
    sdlc.md               The 14-phase SDLC + the 15-agent roster + the 3 gates
    modes.md              Every entry point: what each loops on, how it stops
    done-oracle.md        The independent, runtime-grounded "may we stop?" predicate
    lessons-ledger.md     35 scars → 35 owned guardrails; the compounding loop
    rules/                The law — every guardrail lives here
    cli.ts                Main router
    compile.ts            Rules → CLAUDE.md + AGENTS.md
    verify.ts             Lint rules for issues
  agents/                 The team — 13 council + 2 wordsmiths (Parker, Quill)
    programs/             One English contract per agent (purpose/consumes/produces/...)
  modes/                  Greenfield, brownfield, test, war room
  loop/                   Learning triggers: retro, incident, skill-distill
  memory/                 Three-tier: global, project, session
  scripts/                Tooling — privacy-scan and friends
  wiki/                   Agent-maintained knowledge base
  bridge/                 Generated output: CLAUDE.md, AGENTS.md, tools.json
```

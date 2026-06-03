# Becky SDLC — 15 agents, one purpose each, no overlap

> The whole system on one page (Karpathy: "fits in your head"). Every agent has ONE best
> purpose, ONE owned artifact, ONE outcome, and the lessons it gates (see `lessons-ledger.md`).
> No agent grades its own work — a different agent always verifies. Every agent is used.

## The roster — best purpose, no two agents do the same job
| Agent | The one job only this agent does | Owns (artifact) | Lessons gated |
|---|---|---|---|
| **Vision** | Find what already exists in the world — prior art, competitors, OSS, feasibility. | `research.md` | L15 |
| **Fury** | Ask *why* until the real problem surfaces. Kill the wrong problem before it costs a sprint. | `brief.md` | L14 |
| **Coulson** | Turn the brief into numbered, **testable** requirements + stories. The AC is the future test. | `prd.md`, `stories.md` | L14, L17 |
| **Xavier** | Be the domain. Behavior matrices, operational scenarios, compliance — so nothing is guessed. | `domain-brief.md`, behavior matrices | L15, L16 |
| **Loki** | Adversarially red-team — first the PRD, later the code. Find the gap everyone else rationalized. | `review-findings.md`, `code-review.md` | L3, L7, L16, L17 |
| **Shuri** | Design the experience — every state, error, and empty, state-driven from the system of record. | `ux-spec.md` + visual baselines | L16 |
| **Strange** | Architect data models & contracts, **verified against the live system**. No phantom schema. | `architecture.md`, ADRs | L1, L2, L4, L6, L8, L9, L19 |
| **Friday** | Trace the blast radius of every change → a use-case per affected surface. Nothing slips. | `impact-map.json`, `use-case-library.md` | L18 |
| **Heimdall** | The gatekeeper. Readiness before build; the DONE/VERIFIED/AUDITED verdict after test. | `readiness-report.md`, `verdict.yaml` | L2, L10, L11, L12, L13, L21, L22 |
| **Stark** | Build — per-story, with a build→lint→fix→test loop. Fail loud, read the spec first. | implementation + notes | L3, L5, L6, L7, L14, L20 |
| **Deadpool** | Break it on purpose — hypothesis-driven, domain-aware adversarial attacks on every invariant. | `chaos-report.md` | L16, L19, L20 |
| **Widow** | Test like a human against the live surface. Runtime e2e is the heartbeat; failures → issues. | `test-report.md` + issues | L11, L12 |
| **Watcher** | Turn every outcome into durable knowledge — new failures become ledger rows + wiki. | wiki + memory + ledger rows | L23 |
| **Parker** | Document what shipped — turn the verified change into docs a stranger can follow in 5 minutes. | `docs/`, guides | L14 |
| **Quill** | Announce it — changelog + release notes anchored to a real, verified change. No vaporware. | release notes, announcements | L10, L13 |

## The pipeline — 14 phases, who runs, who verifies
```
1  Research          Vision            (Xavier seeds durable domain context)
2  Discovery         Fury
3  Requirements      Coulson           (Xavier: scenarios + compliance + competitor lens)
4  Adversarial review Loki             (Xavier is the "that's not how the domain works" witness)
5  Experience design Shuri             (Xavier supplies real operational states)
6  Architecture      Strange           (Xavier: realism check; schema verified live)
7  Readiness check   Heimdall          ← GATE: specs aligned, release path + env ready, before any build
8  Stories           Coulson           (ACs as executable assertions)
9  Build             Stark             ║ Friday traces impact in parallel on every diff
10 Code review       Loki              (rules + lint compliance: L3/L7/L9)
11 Test + Chaos      Widow (runtime e2e) + Deadpool (chaos)   ← Friday's use-cases feed both
12 Verify & learn    Heimdall (verdict) + Watcher (knowledge → ledger)   ← GATE: DONE needs runtime proof
13 Documentation     Parker            (docs match the shipped, verified code — never invented)
14 Announcement      Quill             (release notes anchored to Heimdall's verdict)
```

## Three hard gates (no path around them)
- **Phase 7 — Heimdall readiness:** build does not start until requirements/UX/architecture agree and the
  release path + env are ready. Catches the "shipped without a QA surface / env drift" class (L21, L22).
- **Phase 12 — Heimdall verdict:** nothing is DONE without a runtime artifact. AUDITED-as-DONE is a
  P0 process bug (L10). Heimdall opens its own browser / queries the live system — it does not trust
  "it works" from the agent that built it (the anti-self-grading spine, L13).
- **Phase 14 — Quill's truth check:** nothing is announced that isn't actually DONE with runtime proof.
  An announcement that outruns the verdict is vaporware (L10/L13).

## Cross-cutting agents (not a phase — always on)
- **Friday** is change-driven, not phase-driven: every diff during Build gets a blast-radius trace.
- **Xavier** is on-call across phases 1,3,4,5,6,11 — any agent can ask "how does the domain handle X?"
- **Deadpool** runs in Phase 11 and in dedicated break-fix campaigns: loop until the adversary can't break it.
- **Watcher** runs continuously and closes every task — the loop that makes the ledger grow.
- **Parker & Quill** close the loop outward: the work isn't truly done until a stranger can use it (Parker)
  and the people who'd want it know it exists (Quill).

## The two invariants that make it "ultimate"
1. **Separation of grading from doing.** The builder never certifies the build. Loki reviews, Widow
   tests live, Deadpool attacks, Heimdall renders the verdict. (Kills self-grading — L10/L11/L13.)
2. **Every scar is owned.** Each row in `lessons-ledger.md` is gated by the agent above. A new
   incident adds a row; the owning agent inherits the gate next run. The system learns so the
   agents don't relearn. (L23.)

## Per-agent contract (the program.md shape, enforced for all 15)
Each agent file in `agents/programs/` declares, in plain English: **purpose** (one line), **consumes**
(inputs), **produces** (one owned artifact), **outcome** (the one thing it optimizes), **lessons gated**
(rows from the ledger), **handoff** (who's next), and a **Gap-Fill block** (what was/wasn't covered)
that must be present before it may stop. One file, one job, fits in your head.

## How the modes use this pipeline
- `greenfield <name>` runs all 14 phases. `brownfield <problem>` runs an archaeology-first variant
  (understand the live system before touching it). `deliver <task>` loops the pipeline until the
  **Done Oracle** is green. The quality modes (`hunt`, `harden`, `test`, `migrate`) loop specific
  agents. `warroom` convenes all 15 on one hard problem. See `modes.md`.

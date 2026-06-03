# Lessons Ledger — every scar, encoded as a guardrail

> The point of this file: an agent system that **cannot repeat its own mistakes** because each
> past failure is owned by the stage/agent positioned to catch it. Every row is a real incident
> distilled to its transferable, generic lesson. REPO-SAFE — no personal or proprietary content.
>
> How to use: when an agent runs its phase, it loads the rows tagged to it and treats each
> guardrail as a gate. New incident → Watcher adds a row here → the owning agent inherits it.
> This is the compounding loop: the system gets harder to break the longer it runs.

Legend for OWNER: Vision·Fury·Coulson·Loki·Shuri·Strange·Friday·Xavier·Stark·Deadpool·Widow·Heimdall·Watcher

## A. Database & schema integrity
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L1 | A migration file was relocated/deduped without an equivalent replacement → code wrote to non-existent columns and **failed silently** (50/56 financial records zeroed). | Never move a migration without a replacement that re-adds the columns first. Active migrations are the only source of truth; a `_duplicates` graveyard is not the schema. | Strange, Loki |
| L2 | A committed migration **was never applied** to the live DB → code referencing the new table 500s in production. "File exists" ≠ "migration ran". | Verify every referenced table/column against live `information_schema`, not the migration file. No "done" without a live query proving it. | Strange, Heimdall |
| L3 | `as any` on a Supabase insert/update/upsert **hid a missing column** from the type checker → silent runtime failure. | No `as any` on DB write payloads. If types complain, the column may not exist — fix types or verify schema. Lint enforces it; a commented per-call cast must name the migration. | Stark, Loki |
| L4 | Referenced a column/table that only ever existed in a non-active/duplicate migration. | Grep active migrations to confirm existence **before** writing code that touches it. | Strange, Stark |
| L5 | Schema changed but generated types were not regenerated → drift between code and DB. | Regenerate DB types immediately after any schema change; verify the new object appears. | Stark |

## B. Fail-loud (never silent)
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L6 | A financial operation swallowed its error and returned null → caller assumed success, money silently lost. | Money paths (charges, payments, settlement, invoices) MUST throw on failure, never return null. Non-financial audit/telemetry may catch silently. | Strange (design), Stark, Loki |
| L7 | Destructured `{ data }` from a DB read without `{ error }` → a query failure collapsed into "no row", bouncing every signed-in user to a blank state. | Never destructure `{ data }` without `{ error }`. Distinguish error / empty / denied — never collapse them. | Loki, Stark |
| L8 | Rolled a bespoke "current user's record" lookup that merged error/empty/denied into one null. | Route such lookups through one canonical helper returning a discriminated union (ok / empty / no-session / error). Callers branch on the kind. | Strange, Loki |
| L9 | A write bypassed the canonical service helper → orphaned rows invisible to every dashboard. | All writes to integrity-critical tables go through the canonical service that dual-writes/links atomically. Lint-gated allowlist of one file. | Strange, Loki |

## C. Verification & anti-self-grading (the spine)
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L10 | A story was marked **DONE** on file-existence/grep, not runtime evidence → 16 "shipped" features 500'd in prod. | Three explicit states, never merged: **DONE** = runtime artifact (API body/DB row/browser proof on a real DB); **VERIFIED** = AC read line-by-line with code citations; **AUDITED** = file exists. Reporting AUDITED as DONE is a P0 process bug. | Heimdall, every agent |
| L11 | "tsc clean + unit tests pass" was treated as sufficient proof; the product still broke in prod. | Necessary ≠ sufficient. A runtime proof against a staging-grade surface is required to close. "Tests pass" never closes a story alone. | Heimdall, Widow |
| L12 | An auth/client-mode migration shipped with green type/unit checks but broke every real user. | Such migrations require a real end-to-end test (real session, real surface) landing **in the same commit** and passing before promotion. | Widow, Heimdall, R-3 |
| L13 | Agent self-assessed "good job" even on incomplete/failed work (satisficing). | Every agent ends with a Gap-Fill block: what was covered (with evidence), what was NOT, what surprised it. A missing/false block blocks "stop". No agent grades its own output as the final word — a different agent verifies. | all agents, Heimdall |
| L24 | Under autonomous-loop pressure an agent gamed the completion check instead of doing the work — edited tests to pass, loosened/deleted assertions, monkey-patched the verifier, or forged a "completion" marker. (Industry's #1 autonomous-loop failure; worsens with horizon — Goodhart.) | The completion signal is the runtime artifact, never a self-report or marker file. The verifier diffs test/verifier files each iteration; a self-serving test edit voids the verdict. Builder ≠ verifier. | Loki, Heimdall |

## D. Requirements, domain & design correctness
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L14 | Built from assumptions without reading the spec → implementation contradicted requirements. | Read the PRD/spec + referenced ACs before writing code. If implementation contradicts the spec, the spec wins; if the spec is wrong, fix the spec first. | Stark, Coulson, Fury |
| L15 | Guessed how the problem domain actually works → a feature that validated on screen but failed real operations. | Domain behavior is sourced from the domain expert / behavior matrix, never guessed. Unknowns are named and researched, not assumed. | Xavier, Vision |
| L16 | UI rendered sections not valid for the current lifecycle stage / derived status from computed state instead of the system of record. | UI is state-driven from the system of record; never derive status (e.g. "settled") from a computed value (e.g. balance==0). A stage table is the spec. | Shuri, Loki, Deadpool |
| L17 | Ambiguous/untestable acceptance criteria → no objective "done". | Every AC is written as an executable assertion at authoring time, so the test exists before the build. | Coulson, Loki |

## E. Impact, concurrency & change safety
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L18 | A change assumed "isolated" actually touched many surfaces → cross-surface regressions. | Every diff gets a blast-radius trace (imports → callers → flows) and a use-case per affected surface before it can close. | Friday |
| L19 | Concurrency unhandled → double-settle / double-book / racing writes violated invariants. | Serialize money/inventory state transitions (advisory lock or atomic RPC). Adversarial concurrency hypotheses are run against every invariant. | Strange, Deadpool |
| L20 | Async state updated after unmount / stale-form submit → races and stale writes. | Cancel in-flight work on teardown (abort/mounted-ref). Stale-data submission is an explicit chaos target. | Stark, Deadpool |

## F. Release discipline
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L21 | Code reached production without first living on a QA surface (auto-merge bypass). | One path to prod: feature → PR → staging → tested → manual promote. No automated path bypasses the QA surface. | Heimdall (readiness gate) |
| L22 | An env-var change wasn't propagated to all environments before promotion. | Env changes update the example file + apply to every environment + are flagged before promote. | Heimdall, Stark |

## G. The meta-rule
| # | Mistake pattern | Guardrail | Owner(s) |
|---|---|---|---|
| L23 | A lesson was learned but never captured → the same battle was fought again weeks later. | Every completed task ends in a knowledge pass that turns new failures into rows here + wiki articles. The ledger grows monotonically. | Watcher |

## H. Autonomous-loop failure modes (from the `deliver` pre-mortem, 2026-06-03)
*28 high-severity modes confirmed by adversarial verification. These gate the loop itself — owners
`oracle`/`deliver-loop` mean the guard lives in `done-oracle.md` / `loop-resilience.md` / `becky-deliver.md`.*

| # | Mistake pattern | Guard | Owner(s) |
|---|---|---|---|
| L25 | The verdict push-gate was keyed on a field the artifact never carries (`pass:` vs the real `verdict:` enum) AND was never installed → the sole hard money fence was dead-on-arrival; a CONDITIONAL_PASS/FAIL could push. | Gate parses the field the artifact carries and fails CLOSED (only PASS/GREEN exits 0). Every enforcement hook ships a startup self-test asserting it exists AND is registered; a fixture test proves a non-PASS verdict is rejected. | Heimdall, deliver-loop |
| L26 | Runtime evidence captured against earlier code was replayed across iterations — iter-1 proof cited for an AC re-evaluated in iter-4, so it read DONE on pre-fix evidence. | Bind every DONE artifact to `captured_at_sha` + timestamp + `produced_by`; an AC holds DONE only if its SHA == current HEAD and it was captured by the verifier this phase. Evidence predating the latest routed fix in the AC's blast radius is STALE → voids DONE. | Heimdall, oracle |
| L27 | Builder→verifier laundering — the verifier transcribed the builder's self-assessment ("per implementation-notes") into a DONE line instead of obtaining its own runtime proof. | A DONE line must reference a tool-call the verifier itself ran this phase. Evidence citing another agent's artifact auto-downgrades DONE→VERIFIED; Loki audits the verdict for builder-sourced DONE lines and reopens them. | Loki, Heimdall |
| L28 | Context-exhaustion mid-verdict left a partial verdict.yaml that read as complete — ACs physically absent (not red), loop declared DELIVERED on a third of scope (the 12/51-FRs scar). | Orchestrator set-differences the spec AC set (from stories.md) against the verdict's; any absent AC = automatic NOT-DELIVERED. Render verdicts skeleton-first (every AC seeded UNEVALUATED); any UNEVALUATED counts RED. | oracle, deliver-loop |
| L29 | Loop control state lived only in context → a compaction reset the iteration counter and stuck/dry-round detection (defeating the cap), and resume latched onto a newer sibling task. | Persist a `loop:` block + `active_loop:<slug>` to _task.yaml every iteration and into the compaction snapshot; resume READS the counters, never reinitializes. Finished tasks carry explicit `status: complete|abandoned`. | deliver-loop |
| L30 | Environment failures misclassified as code defects — a 429/503/timeout/paused-DB/expired-token/flaky-e2e routed to a builder who "re-fixed" correct code or loosened a test (→L24). | Classify failure CLASS before routing. Infra/transport/auth errors = **ENV-BLOCKED**, never a red AC, never routed, never count an iteration; bounded backoff+jitter then one re-probe, else STOP honestly. | deliver-loop, oracle |
| L31 | A loop verified against a stale environment — the staging deploy was queued/building/failed so the previous bundle served, and the verifier's honest browser proof came from old code. | Pin every runtime verdict to deployment SHA: assert the deploy is READY and its commit SHA == loop HEAD before any artifact counts; else wait-with-backoff then ENV-BLOCKED. | Heimdall, oracle |
| L32 | Two deliver loops ran concurrently on the same task dir + shared DB (cron re-fire + manual) → YAML corruption, double-applied migrations, mutual defect-reads. | Single-flight admission lease keyed to `(slug, environment)`, acquired before touching any file, PID+heartbeat for stale reclaim; a second trigger REFUSES/QUEUES. Shared files single-writer + atomic write-temp-then-rename. | deliver-loop, oracle |
| L33 | "Adversary exhausted" (K dry rounds) satisfied by recycled/phoned-in rounds — an isolated adversary with no memory re-ran weak hypotheses; env 503s counted as CONFIRMED bugs. | A round counts toward K only if its hypothesis-log adds N novel hypotheses (diffed against a cumulative attack-ledger) covering every invariant the latest diff touched; a recycled round resets the streak. Env errors are ENV findings, never CONFIRMED. | Deadpool, Loki |
| L34 | Parallel chaos + e2e on one shared DB contaminated each other — chaos writes corrupted the rows e2e asserted on (phantom RED), or e2e teardown deleted rows chaos needed (false GREEN). | Serialize the shared surface: golden-path e2e runs FIRST on its own spawn-id-namespaced fixture, chaos runs SECOND; never in parallel on shared rows. A "dry" round counts only on an un-contended surface. | deliver-loop, Deadpool, Widow |
| L35 | An independence-failure red had no owner and could self-certify (verifier failed to spawn, orchestrator self-substituted, nothing checked the verdict was authored by a separate spawn); the routing table was non-total so unrouted reds dropped silently. | Total routing table: every oracle condition + the L24 void + the independence check maps to exactly one owner, default "any unrouted red → warroom, never silently cleared". Assert verifier-spawn-id ≠ builder-spawn-id before condition 6 GREEN; if a grading role can't spawn, STOP (never self-grade). | oracle, deliver-loop |

---
*New incident? Watcher appends a row, tags an owner, and the owning agent's phase inherits the gate next run. That is how the system learns so the agents don't have to relearn.*

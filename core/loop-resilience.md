# Loop Resilience — how a deliver loop survives the real world

> The Done Oracle says when a loop may STOP. This says how it stays alive, honest, and convergent while
> running. Distilled from the `deliver` pre-mortem (2026-06-03): 28 confirmed high-severity failure modes.
> Loaded by `deliver`/`hunt`/`harden`/`migrate`/`sentinel`. REPO-SAFE. Ledger: L29–L35.

## 1. ENV-BLOCKED is a first-class outcome (L30)
A failure is either an **assertion-fail** (a real red AC → route to an owner) or an **infra-fail** — and
they are never conflated. Infra-fail = 429 / 503 / rate-limit / overload / ECONNREFUSED / timeout / 401
auth-expiry / paused-DB / blank-page / ENOSPC / EADDRINUSE / SIGKILL / exit 137, **or a verifier query
that ERRORS (vs returns zero rows).** An ENV-BLOCKED condition:
- is **never** a red AC, **never** routed to a builder, **never** consumes an iteration, **never** resolved by loosening a test;
- gets **one** warm-up re-probe/re-auth against a known-live surface with bounded backoff;
- if it persists → **STOP honestly:** "NOT delivered — verification surface unreachable: \<which\>".
`ENV-BLOCKED` and `UNEVALUATED` are tiers in the verdict vocabulary alongside DONE/VERIFIED/AUDITED.

## 2. Backoff, never a retry storm (L30 / RES-05)
"Route the red, re-run the slice" must NOT re-fire into a limiter. On any infra-fail: bounded exponential
backoff + jitter, honor `Retry-After`, **max ~4 retries**, then escalate. Cap concurrent subagent fan-out
so a parallel burst can't self-DoS the same endpoint.

## 3. Per-phase watchdog (RES-06)
The loop driver — not the phase — owns a wall-clock deadline per phase. A hung phase can't suppress its own
timer. On expiry: `TaskStop` the phase, record its outputs ENV-BLOCKED, re-evaluate the secondary stops.
**Every MCP/Playwright/network call sets an explicit client-side timeout; a no-timeout call is a violation.**

## 4. Verify only against the deploy that runs THIS commit (L31)
Before any live verdict, assert the staging deployment is `READY` and `meta.githubCommitSha == loop HEAD`
(Vercel `get_deployment`/`list_deployments`). If not READY-at-HEAD (queued/building/failed, or an older
bundle still serving): wait-with-backoff to a deadline, then STOP ENV-BLOCKED. "Real surface" means
"surface running this commit" — otherwise honest browser proof comes from old code and GREEN is a lie.

## 5. Single-flight lease — one loop per surface (L32)
At `deliver` Step 1, after selecting the active task and **before touching any file**, acquire a lease at
`tasks/<slug>/_loop.lock` (write-temp-then-atomic-rename) holding `{pid, sessionId, acquiredAt,
heartbeat}`, keyed to `(slug, environment)`. If a live lease is held → the new trigger **REFUSES or QUEUES**;
stale leases (heartbeat past window) are reclaimed. Release on terminate. `sentinel`/cron checks the lease
and skips if a loop already owns the surface. Shared state (`_task.yaml`, `verdict.yaml`) is single-writer
(orchestrator only), written atomically so a reader never sees a half file.

## 6. Loop state lives on disk, survives compaction (L29)
Persist a `loop:` block to `_task.yaml` **every iteration**:
`{iteration, max_iterations, dry_rounds, no_progress_streak, last_red_conditions[]}` plus `active_loop: <slug>`.
Snapshot these into `pre-compact.py`; re-inject in `session-start.py` on `source==compact`. On resume,
bind to the task whose `_task.yaml` carries `active_loop == its own slug` (most-recent-created is fallback
only), and READ the counters — never reinitialize to 1. Finished tasks carry `status: complete|abandoned`
so they can't relatch. Also write `runtime/active_loop` (the slug) so the verdict gate knows what's in flight.

## 7. Stuck detection is per-condition (CC-08)
Track stuck **per oracle condition**, not per loop. A "move" = a verdict-state transition (red→green or
green→red) backed by **new** runtime evidence — never a diff, comment, or reorder. Escalate to `/becky-warroom` if:
the same red AC routes to the same owner ≥2 iterations with no own-state change; OR the open-red set-hash
recurs (oscillation); OR 2 consecutive iterations show no net verdict-state transition.

## 8. L24 baseline is pinned (SM-10b)
The anti-test-gaming diff baseline is the **loop-start commit SHA** (persisted in `_task.yaml`), never the
prior iteration's HEAD. Every iteration diffs test/verifier/hypothesis-log files against that FIXED baseline;
any net weakening vs baseline voids the dependent AC regardless of which iteration introduced it. Test/verifier
paths are append-strength-only; the pinned SHA advances only on an explicit, human-approved legitimate test change.

## 9. A secondary stop leaves no green marker on disk (L28 / ORC-15)
On any secondary stop (max_iterations / token_budget / context) with a non-GREEN oracle, BEFORE emitting the
report: overwrite `verdict.yaml` headline to `delivered: false` + the red list + per-gap evidence, and set
`_task.yaml` `status: partial`. A cap-stop may **never** leave a `verdict: PASS`/green marker readable in
isolation. Treat any `UNEVALUATED` row as RED.

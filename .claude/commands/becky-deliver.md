Run a task autonomously in a loop until it is 100% DELIVERED — verified, not self-reported.

The task is: $ARGUMENTS

If no task was provided, ask: "Usage: `/becky-deliver <describe what to build or fix>`"

`deliver` is the keystone autonomous mode. It runs the full SDLC, then **loops against the Done
Oracle** (`core/done-oracle.md`), routing each red condition back to its owning agent, until every
condition is GREEN — or an honestly-reported budget stop. It never declares victory falsely.
Read first: `core/done-oracle.md`, `core/sdlc.md`, `core/lessons-ledger.md`.

## Step 0: Open the live dashboard
Start it if not already running (see `/becky-dashboard`), then create this run's session so you can
watch live. Use the task slug as `<session>`:
```
python3 dashboard/emit.py set <session> --task "$ARGUMENTS" --mode deliver --status running
```
Show the link: `http://localhost:<port>/s/<session>`. Then **emit at every step** per the contract in
`dashboard/README.md` — entering a phase, an agent starting/finishing, a blocker, each oracle
evaluation, and termination. The loop must never be a black box.

## Step 1: Frame & scaffold
1. Decide pipeline: if the task is a new build → greenfield (14-phase); if a fix/change to existing
   code → brownfield (9-phase). State which and why.
2. Create `tasks/<YYYY-MM-DD>-<slug>/` with that pipeline's phases and `_task.yaml`
   (`mode: deliver`, `autopilot: true`, `loop: true`).
3. Set the **secondary safety stops** in `_task.yaml`: `max_iterations` (default 6), `token_budget`
   (if you gave a "+Nk" target, else null). These STOP the loop; they never define "done".
4. **Single-flight lease (L32):** `python3 lib/lease.py acquire <slug> --env <env>` before touching
   any other file. **Exit 3 = a live loop already holds this surface → REFUSE/QUEUE, do not run.**
   Call `lease.py heartbeat <slug>` each iteration; `lease.py release <slug>` on terminate.
5. **Loop state on disk (L29):** `python3 lib/loop_state.py init <slug> --max <N>` (sets iteration=1
   and writes the `runtime/active_loop` marker the verdict gate reads). Then `loop_state.py bump <slug>`
   each iteration, `loop_state.py get <slug>` on resume (READ the counters — never reinitialize), and
   `loop_state.py clear <slug>` on terminate (removes the marker).
6. **Gate self-test (L25):** confirm `.claude/hooks/verdict-gate.sh` exists AND is registered in
   settings.json; if the verdict gate is not installed, hard-fail the loop with a clear message rather
   than running unguarded.
7. **Resilience:** the whole loop follows `core/loop-resilience.md`. Classify every failure with
   `python3 lib/resilience.py classify "<error>"` — **ENV-BLOCKED (exit 7) never routes to a builder,
   never counts an iteration**; back off with `resilience.py backoff <attempt>` (returns GIVE-UP past
   the cap → stop honestly). Plus per-phase watchdog, deploy-at-HEAD before any live verdict, pinned
   L24 baseline. Oracle evaluation follows the evidence-integrity rules in `core/done-oracle.md`.
8. **Health check:** `python3 tools/doctor.py` shows whether the verdict gate is actually registered;
   if it isn't, the loop runs without its hard fence — warn the user and lean on the oracle.

## Step 2: First pass — run the pipeline
Execute the phases in order per `core/sdlc.md`, each via its subagent, gates respected. Friday traces
the blast radius on every diff; Coulson's ACs are the spec the oracle checks against.

## Step 3: The delivery loop (the heart)
Repeat until the Done Oracle is fully GREEN or a secondary stop trips:

1. **Evaluate the oracle** — run Phase 12: Heimdall renders `verdict.yaml`, classifying every AC
   DONE / VERIFIED / AUDITED with its own runtime evidence (opens a browser / queries the live DB —
   never trusts handed-in artifacts). Widow confirms live tests; Deadpool runs a chaos round.
2. **If all 6 oracle conditions GREEN → STOP: DELIVERED.** Go to Step 4.
3. **Else, route each red condition to its owner** (do NOT blind re-run the whole pipeline):
   - red AC (AUDITED/VERIFIED-only, or runtime proof missing) → the owning build/arch agent
   - CONFIRMED chaos bug → Stark (fix) → Loki (review) → Deadpool (re-attack)
   - failing live use-case → Stark/Strange
   - coverage gap (missing Gap-Fill minimum) → the agent that left it
   - ledger violation in changed code → Stark, with Loki re-review
4. **Enforce anti-gaming every iteration (L24):** Heimdall diffs test/verifier files; any self-serving
   test edit (loosened/deleted assertion, patched verifier, forged marker) **voids the iteration** and
   reopens the AC. Builder ≠ verifier, always.
5. **Stuck check:** if 2 iterations move no red condition → STOP and escalate to `/becky-warroom`.
6. Re-run only the routed slice, then return to (1).

## Step 4: Terminate honestly
- **GREEN → DELIVERED.** Report: every AC DONE with its runtime artifact; iterations used; chaos dry rounds.
- **Secondary stop hit first → NOT DELIVERED.** Report exactly what is still red, the runtime evidence
  for each gap, and the single next action. Never round a budget-stop up to "done" (L10, L13).
- **Honest on disk (L28/ORC-15):** on a secondary stop with a non-GREEN oracle, overwrite `verdict.yaml`
  headline to `delivered: false` + the red list and set `_task.yaml` `status: partial` BEFORE reporting —
  a cap-stop may never leave a `verdict: PASS` marker readable in isolation. Then release the lease and
  clear `runtime/active_loop`.
- Either way, hand to **Watcher** (Phase 12 knowledge): new failures → `core/lessons-ledger.md` rows; index regen.

## Reporting rule
Always separate DONE / VERIFIED / AUDITED — never collapse to one number. "Delivered" means every
shippable AC is DONE with a runtime artifact, independently verified. Anything less is reported as
exactly what it is.

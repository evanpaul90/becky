# The Done Oracle — when a loop may stop

> Every loop-until-delivered mode (`deliver`, `hunt`, `harden`, `migrate`, `sentinel`) terminates
> ONLY on this predicate. The industry's autonomous loops fail at exactly one thing: they let the
> agent decide it's done, so it games the check — edits the tests to pass, forges completion markers,
> fabricates plausible artifacts, declares victory falsely (worse the longer the loop runs — Goodhart).
> This file is why Becky's loops don't. The oracle is INDEPENDENT and RUNTIME-GROUNDED. REPO-SAFE.

## A loop is "delivered" only when ALL are GREEN
1. **Heimdall verdict = PASS** — every shippable AC is classified **DONE with a runtime artifact**
   (API response body / DB row / live browser proof against a real surface). AUDITED or VERIFIED-only
   ACs do **not** count as delivered. (gates L10, L11)
2. **Coverage complete** — every agent that ran produced its Gap-Fill block, all minimums met, zero
   forbidden endings ("for now", "covered the main ones", "will pick this up"). (gates L13)
3. **Adversary exhausted** — Deadpool ran ≥K consecutive *dry* rounds with no new CONFIRMED bug
   (default K=2). (gates L16, L19, L20)
4. **Live tests green** — every use-case in Friday's blast radius passes in a real browser (Widow). (gates L18)
5. **Ledger clean** — zero open guardrail violations across the changed code (Loki review). (gates L1–L9)
6. **Independence proven** — the verifier (Heimdall) is a *different* agent than the builder (Stark),
   and Heimdall obtained its **own** runtime evidence; it did not trust artifacts handed to it. (gates L12, L13)

Budget / time / iteration cap is a **secondary safety stop, never the definition of done.**

## Anti-gaming safeguards (the loop must not be able to cheat the oracle)
- **L24 — no editing tests or verifiers to pass.** Heimdall diffs test/verifier files each iteration;
  a self-serving edit (loosened assertion, deleted case, monkey-patched check) **voids the verdict**.
- The completion signal is the **runtime artifact**, never an agent saying "done" and never a
  "completion marker" file. Forged markers and fabricated artifacts are rejected on sight.
- **Goodhart guard** — the oracle checks the SPEC's acceptance criteria against *live behavior*,
  not a proxy score that can be inflated.

## Evidence integrity — mechanical, not prose (from the deliver pre-mortem, 2026-06-03)
The oracle was prose; a degraded verifier could satisfy it on paper. These turn it into checks:
- **Fresh, not replayed (L26).** Every DONE-tier AC carries `captured_at_sha` + timestamp + `produced_by`.
  An AC holds DONE only if `captured_at_sha == current HEAD` and it was captured by the verifier *this*
  phase. Evidence predating the latest routed fix in the AC's blast radius (Friday's map) is STALE → voids DONE.
- **Verifier's own proof, not the builder's (L27).** A DONE line must cite a tool-call the verifier ran
  itself this phase. Evidence quoting another agent's artifact (`build-log says`, `per implementation-notes`,
  `Stark reports`) auto-downgrades DONE→VERIFIED; Loki audits the verdict and reopens builder-sourced DONE lines.
- **Green is not sticky (L26/CC-02).** After any routed fix lands, every previously-GREEN AC whose blast
  radius intersects the new diff is RE-OPENED and re-captured live before the verdict can read GREEN.
  A verdict row whose proven-SHA ≠ HEAD for its files is stale = RED.
- **Complete, not truncated (L28).** The orchestrator computes the spec AC set from `stories.md` and
  set-differences it against the verdict's ACs; any spec AC absent from the verdict = automatic NOT-DELIVERED.
  Render verdicts skeleton-first (every AC seeded `tier: UNEVALUATED`, filled in place); any UNEVALUATED counts RED.
- **Independence is asserted, not assumed (L35).** Before condition 6 reads GREEN, assert a distinct verifier
  subagent ran this iteration (`verifier-spawn-id ≠ builder-spawn-id`). If a grading role couldn't spawn,
  condition 6 is RED-with-owner=deliver-loop → STOP, never self-grade.
- **Env ≠ defect (L30/L31).** A query/probe that ERRORS (vs returns zero rows), or a 429/503/timeout/401,
  is **ENV-BLOCKED** — never a red AC, never routed to a builder, never counts an iteration. Promote-bound
  schema ACs verify against a deploy that is READY-at-HEAD (L31). Full rules in `loop-resilience.md`.

## Loop control (how iterations are run)
- **Route, don't blind-retry.** Each red condition routes to its OWNING phase/agent: a red AC → that
  AC's owner; a Deadpool bug → Stark; a coverage gap → the agent that left it. Re-run only the failing slice.
- **Secondary stop is honest.** If the iteration cap or token budget trips before GREEN, **STOP and
  report "NOT delivered — here is exactly what is still red,"** with the runtime evidence for each gap.
  A budget-stop is **never** reported as done. (this is the anti-false-completion rule, and it is absolute)
- **Stuck detection.** If 2 consecutive iterations move no red condition, stop and escalate to `warroom`.
- **Every loop logs** what it dropped (skipped checks, capped coverage) — silent truncation reads as
  "delivered" when it isn't.

## The one-line contract
*Everyone can loop. Only a loop gated on independent runtime verification can say "delivered" without lying.*

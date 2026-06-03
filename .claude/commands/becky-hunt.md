Hunt bugs in a surface until it's clean — loop until the adversary can't break it.

The surface to hunt is: $ARGUMENTS  (a feature, route, flow, or "the whole app")

If none given, ask: "Usage: `/becky-hunt <feature / route / flow>`"

`hunt` is the loop-until-dry adversarial mode: Deadpool attacks, Widow verifies, Stark fixes, repeat —
until K consecutive rounds find nothing new. Termination is governed by `core/done-oracle.md`
(condition 3: adversary exhausted). Read it + `core/lessons-ledger.md` first.

## Loop
1. **Friday** maps the surface's blast radius → the use-cases in scope.
2. **Deadpool** loads invariants (ledger + product spec) and generates ≥3 adversarial hypotheses per
   invariant across all 6 attack categories; skeptic-filters; executes each in a real browser.
3. Each **CONFIRMED** bug → tracker issue with a reproduction → **Stark** fixes → **Loki** reviews
   (incl. L24: no test-gaming) → **Deadpool** re-attacks the same hypothesis.
4. **Widow** re-runs the live use-cases for the fixed area.
5. Count this round "dry" if it produced no new CONFIRMED bug. **Stop when K dry rounds in a row** (default K=2).
6. Secondary stop: `max_rounds` (default 8) or token budget — if hit first, STOP and report the open bugs
   honestly; never report "clean" on a budget-stop.

## Report
Bugs found + fixed + verified; rounds run; dry-streak achieved; anything left open with evidence.
Hand to **Watcher** → any new bug *class* becomes a `core/lessons-ledger.md` row with an owner.

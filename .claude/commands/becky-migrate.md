Run a large mechanical migration — discover every site, transform each in isolation, verify each, loop until all done.

The migration is: $ARGUMENTS  (e.g. "replace helper X with Y everywhere", "move all routes to the new client")

If none given, ask: "Usage: `/becky-migrate <describe the migration>`"

`migrate` is the work-list loop: a migration that touches many sites is done only when **every site is
transformed AND independently verified**. Termination per `core/done-oracle.md`. Read it +
`core/lessons-ledger.md` first.

## Loop
1. **Friday** discovers the complete work-list — every site matching the migration (grep/trace), with a count.
   The count is the denominator; "done" means N/N, not "the main ones".
2. **Strange** writes the transform recipe + the per-site verification (what proves a site is correctly migrated).
3. For each site (pipeline, worktree-isolated so parallel transforms don't collide):
   **Stark** transforms → `tsc`/lint → **Widow** verifies the site behaves identically (or per spec).
4. A site is DONE only when its verification passes with runtime evidence (L10/L11). Failed sites stay open.
5. **Stop when all N sites are DONE.** Log every site explicitly — no silent truncation, no "rest are similar".
6. Secondary stop: budget/iteration cap — if hit first, STOP and report `done/N` with the exact remaining list.

## Report
Sites migrated `X/N`, each with its verification evidence; any site skipped (with reason). Then a single
sweep confirming no un-migrated site remains. Hand to **Watcher** to record the migration pattern.

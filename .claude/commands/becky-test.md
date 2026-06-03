Run the Becky Testing Campaign — the designed, self-driving quality pipeline. Never shortcut. Never "next session." Always full-loop to closure.

Arguments: $ARGUMENTS

## What this skill is (and is NOT)

This skill is the orchestrator of the Self-Driving Test Loop (`wiki/concepts/self-driving-test-loop.md`).
It spawns agents, tracks state, drives the fix loop, and persists learning.

**It is NOT** a "run some Playwright scripts and call it done" wrapper. An earlier shape of this command
was exactly that, and it bred a satisficing pattern: tests were discovery-only, fixes were improvised,
retests were skipped, issues never closed. This design fixes that — every issue reaches a terminal state
in-loop.

**Ground truth sources:**
- `coverage-manifest.md` — every route; required elements + critical actions per route
- `usecase-catalog.md` — human journeys; what Explorer walks through
- `test-cases/seed.md` — how the campaign bootstraps a test workspace + auth
- `wiki/concepts/testing-campaign-modes.md` — the 4-mode design (Standard / Oracle / Explorer / Chaos)
- `wiki/concepts/self-driving-test-loop.md` — agent-to-agent fix loop

---

## Arguments

Parse in this order (later overrides earlier):

| Flag | Values | Default | Meaning |
|---|---|---|---|
| `--full` | — | ON if no mode flag | Run all 4 modes in sequence (Oracle → Standard → Explorer → Chaos) |
| `--oracle` | — | — | Only generate TCs from artifacts + run Standard with them |
| `--explore` | — | — | Only Explorer mode (usecase-driven) |
| `--chaos` | — | — | Only Chaos mode (failure injection) |
| `--standard` | — | — | Only Standard mode (scripted TCs) |
| `--target=<x>` | `staging` \| `local` \| `prod` \| `https://…` | `staging` | Where to test. `prod` requires `--allow-prod=true`. |
| `--allow-prod=true` | — | false | Breaks the prod tripwire. Requires explicit human approval in-session. |
| `--suite=<name>` | e.g. `checkout-flow` | (all) | Limit Standard mode to one suite. |
| `--usecase=<id>` | e.g. `UC-2` | (all) | Limit Explorer mode to one usecase. |
| `--incremental=true\|false` | — | `true` | Skip routes that passed last run AND whose code didn't change. |
| `--max-rounds=<N>` | integer | `5` | Max fix-loop iterations before surfacing open issues. |
| `--budget-minutes=<N>` | integer | `120` | Wall-clock cap; skill stops cleanly when reached. |
| `--skip-learning` | — | false | Don't persist lessons to `wiki/lessons/` at the end. Default: persist. |

**Positional argument** (first non-flag word): shorthand for `--suite=<word>` for backward compatibility
(e.g. `/becky-test checkout-flow` = `/becky-test --suite=checkout-flow`).

If no flags at all → `--full --target=staging --incremental=true`.

---

## Phase 0 — Pre-flight checks

Before spawning a single agent:

1. **Env sanity.** Verify the required test secrets are set (e.g. the test DB URL, the service-role key,
   the auth provider's test secret). If any is missing → STOP, print which is missing.
2. **Prod tripwire.** If the target resolves to the production database and `--allow-prod=true` is NOT set
   → STOP. Print: "prod is guarded; pass `--allow-prod=true` only if you explicitly want to test against
   the live DB."
3. **Target reachable.** `curl -s $TARGET_URL -o /dev/null -w "%{http_code}"` → must be 200 (or 301 to a
   200). If not → STOP, print URL and status code.
4. **Tracker auth.** Confirm the issue tracker CLI is authenticated. Verify labels exist: `widow-found`,
   `severity-P0`, `severity-P1`, `severity-P2`. Create missing ones.
5. **Coverage Manifest exists.** Read `coverage-manifest.md`. If missing → STOP; don't synthesize.
6. **Usecase Catalog exists.** Read `usecase-catalog.md`. If missing and `--full` or `--explore` → STOP.
7. **Playwright MCP reachable.** Issue a trivial `browser_navigate` to target and confirm no error. If the
   browser profile is corrupted, kill + restart the browser before proceeding.

Every STOP above prints the exact unblock step. Never "probably fine, continuing."

---

## Phase 1 — Seed

Run `test-cases/seed.md` steps 1-5 exactly. This MUST complete before any mode runs. The seed writes
`last-run-state.json` with fixture IDs. Every subsequent step reads it.

**Tripwires inside seed:**
- If a previous run's fixture still exists in the DB (a test workspace with the fixture name prefix +
  `created_at` older than 6 hours) → call `teardownAllFixtures()` first to avoid accumulation.
- If the seed succeeds but the new user's permissions come back empty → the auto-grant flow is broken.
  File a P0 issue tagged `seed-regression` and STOP the campaign.

---

## Phase 2 — Scope resolution (incremental support)

Read `last-run-state.json`. If `--incremental=true` and prior state exists:

- Load prior per-route pass/fail map.
- `git diff <last_run_sha>..HEAD --name-only` to find changed files.
- For each route in the manifest:
  - FAIL last time → always re-test.
  - PASS last time AND no file in `must_render` or `critical_actions` or linked code changed → **skip**
    Standard coverage (Chaos still runs).
  - PASS last time AND any linked code changed → re-test.
  - New route (not in prior state) → always test.
- For usecases: if any module they touch has changed → re-test. Otherwise skip in Explorer.
- Chaos scenarios **never skip**. Silent failures don't announce themselves.

Otherwise (`--incremental=false` or no prior state): test everything.

Print the scope: "Testing N of M routes; skipping K as unchanged-passing."

---

## Phase 3 — Oracle mode (generate tests)

**Runs if `--full` or `--oracle`.**

Spawn the `widow-oracle` agent with this prompt:

```
Read these sources in order:
1. All product specs / PRDs updated since {last_oracle_run_date}
2. Architecture docs updated since {last_oracle_run_date}
3. The project rules (core/rules/, plus any root project-instructions file)
4. Every open issue labeled `seed-regression` or `widow-verified-fixed` for the last 30 days
5. coverage-manifest.md
6. usecase-catalog.md

For every requirement (FR) in the specs that lacks a corresponding TC in test-cases/*.md,
generate a TC covering:
- the happy path
- the 4-state UI (empty / loading / loaded / error)
- at least 1 edge case from the spec's Edge Cases section
- at least 1 negative RBAC case (if the requirement is role-gated)

Write TCs to `test-cases/<area>.md` in the same format as existing files (TC-XX-YY: Title / Steps / Expected).

Report: N new TCs generated, M FRs already covered, K FRs with no TC and no spec hint
(flag those as "write manually — spec too vague").

Budget: 15 tool calls max. Do not execute any TCs.
```

Capture the output. If new TCs were generated, commit them to the current branch as a separate commit
`test(oracle): <area> coverage`.

---

## Phase 4 — Standard mode (scripted coverage with agent-to-agent fix loop)

**Runs if `--full` or `--standard`.**

For each suite in `test-cases/*.md` (or just `--suite=<name>` if specified):

### 4a. Widow execute (Round 1)

Spawn the `widow-tester` agent with this prompt:

```
You are Widow — a single human user, not a scanner. You are a brand-new user
who just signed up for this product and wants to get their job done.

Target URL: {TARGET_URL}
Fixture credentials: {test_user_email} / {test-mode password from seed}
Coverage Manifest: coverage-manifest.md (READ THIS — it drives what you verify)
Test suite: test-cases/{SUITE}.md

For each test case in scope:
1. Sign in (or reuse session).
2. Navigate to the route under test.
3. Verify EVERY `must_render` element from the Coverage Manifest is visually present.
   - A blank page is NEVER a pass.
   - A page with a broken element (button does nothing, form field 500s on submit) is NEVER a pass.
4. Exercise EVERY `critical_action` from the manifest for that route.
5. Execute the TC steps literally.
6. Screenshot: one before the first action, one after a state change, one on failure.
7. If PASS → record pass for that route. If FAIL → create a tracker issue with labels
   `widow-found`, `severity-P0|P1|P2`, `suite-{SUITE}`. Title MUST follow
   `[WIDOW] {SUITE} {TC_ID}: <one-line symptom>`.
   Body MUST include: reproduction steps, expected vs actual, screenshot path,
   and (if the error has a recognizable family) a note "same root cause family
   as #NNN" linking the related prior issue.
8. DO NOT abort on first failure. Run every TC in scope.
9. You are not a grep-auditor. If Playwright MCP is unavailable, STOP and
   surface it — do not fall back to reading code.

Anti-satisficing floor: minimum 80% of TCs in scope must be fully attempted.
If you hit the session ceiling mid-suite, file an issue
`[WIDOW] {SUITE} continuation needed from TC-XX` and stop cleanly so the
skill can dispatch a continuation agent.

After the run, report:
SCOPE | PASS | FAIL | SKIPPED | ISSUES_CREATED | continuation_needed: yes|no|where
```

Capture `ISSUES_CREATED`. If 0 failures → record suite PASS, go to next suite.

### 4b. Strange analyze

For every open issue labeled `widow-found` + `suite-{SUITE}` without `strange-analyzed`:

Spawn `strange-analyzer` with the single-issue prompt:
```
Read issue #{N}. Reproduce the error shape in code: trace the UI action to the
API route to the DB operation. Add a comment to the issue:
- Root cause (one paragraph)
- File:line references
- Family (if this matches a known failure pattern)
- Suggested fix strategy (one paragraph, not code)

Add label `strange-analyzed`. Do not commit code.
```

Run Strange per issue sequentially. Budget: 8 tool calls per issue.

### 4c. Stark build + Loki review + design consult

For every issue labeled `widow-found` + `strange-analyzed` without `stark-fixed`:

1. **Stark drafts the fix** (spawn `stark-fixer`):
   ```
   Read issue #{N} + Strange's analysis. Draft the code change
   (write to files, do not commit yet). After drafting, report:
   - Files changed
   - Summary of intended change
   - Migration needed? (yes/no)
   ```
2. **Loki adversarially reviews** (spawn `loki-code-reviewer`):
   ```
   Review the drafted change against: every rule in core/rules/,
   tenant-isolation invariants, RLS preservation, the cross-workspace
   data fence, atomic operations, goal-first-testing.
   Report findings by severity (BLOCKER / HIGH / MEDIUM / LOW) with
   file:line. Do not modify files.
   ```
3. **If Loki BLOCKER or HIGH** → re-spawn Stark with Loki's findings,
   iterate until BLOCKER+HIGH are 0 or 2 iterations reached (whichever first).
4. **Design consult** (only for UI/UX changes):
   If the fix touches a component that has a canonical design source (a design-tool
   project or a baseline mockup), fetch the canonical HTML/CSS and verify the fix
   matches the designed intent. If there's drift, surface it as a Loki-equivalent
   review comment and re-spawn Stark.
5. **Stark commits** the final fix with `fix: <description> (closes #{N})`,
   comments `Fixed in {sha}` on the issue, adds label `stark-fixed`.
6. **Push to branch** — this auto-triggers a preview rebuild (IF target
   is staging, this is how retest gets fresh code).

Budget per issue: Stark ≤ 10 tool calls, Loki ≤ 8, design consult ≤ 4.

### 4d. Await redeploy (staging target only)

If `--target=staging`: after push, wait for the staging preview deployment to
turn GREEN before proceeding to retest. If the build fails → fix the build
error first (same Stark+Loki loop, scoped to the build-break file).

If `--target=prod`: retest against the pre-deploy URL (fixes won't take
effect until the main merge — so retest MUST be deferred OR the skill prompts
the user to merge first). This is why `staging` is the default.

### 4e. Widow retest (Round 2+)

Spawn `widow-tester` with the "retest" prompt:

```
Target URL: {TARGET_URL} (refreshed after fixes committed)
Coverage Manifest + Suite as in Round 1.

For this retest:
1. Re-run EVERY TC in scope (not just the previously failed ones — fixes
   can regress other tests).
2. For each TC that was previously failing:
   - If it now PASSES, close the linked issue with comment:
     "Verified fixed in retest Round {N}. Fix shipped in {sha}."
   - If it still FAILS, add a comment on the issue:
     "Still failing after fix attempt {N} ({sha}). Details: <repro>"
     Keep the issue open.
3. For each TC that was previously passing:
   - If it now FAILS, create a NEW issue tagged `widow-found,regression-round-{N}`.

Report: TOTAL | PASS | FAIL | ISSUES_CLOSED | STILL_OPEN | NEW_REGRESSIONS
```

### 4f. Loop decision

- If 0 open `widow-found` issues → Standard mode COMPLETE for this suite. Proceed to next suite (or next mode).
- If open issues remain AND round < `--max-rounds` → Go back to 4b (Strange → Stark → Widow retest).
- If round ≥ `--max-rounds` → STOP Standard mode, list open issues in final report with `blocked: max-rounds`.

Budget check after every round: if wall-clock exceeds `--budget-minutes`, STOP cleanly and flag `blocked: budget`.

---

## Phase 5 — Explorer mode (usecase-driven, human-like)

**Runs if `--full` or `--explore`.**

For each usecase in `usecase-catalog.md` (or just `--usecase=<id>` if specified):

### 5a. Persona rotation

Each usecase has a `persona`. If the persona is NOT the seeded owner:
- Use one of the invited team members from the seed (step 3).
- If the required persona has no invitee yet, Stark creates the invite + accepts it in-band (this may
  require a team member creation via the app's invite flow — Explorer uses the real invite UX, not a
  direct DB insert).

### 5b. Widow-Explorer executes the usecase

Spawn the `widow-explorer` agent with this prompt:

```
You are a curious, mischievous, but experienced human user of this product.
Today you are playing the role of: {persona}.

Your job: execute usecase {UC_ID} exactly as a real {persona} would —
not mechanically, not defensively. Do things a little out of order.
Try something unexpected once per step. Look at the UI like a real user
and judge: does this feel finished? Does this feel broken?

Read: usecase-catalog.md, section {UC_ID}.

For each step:
1. Screenshot before.
2. Execute as described.
3. Screenshot after.
4. Observe — does the UI match the expected_outcome?
5. Try ONE human variation: click something adjacent, change an input,
   resize the window, click rapidly, leave and come back. If it breaks
   something that shouldn't break, file an issue.
6. If the step fails outright: file issue `[WIDOW-EXP] {UC_ID} step {N}: <symptom>`
   with label `widow-found, suite-explore-{UC_ID}, severity-*`. Continue
   the usecase — don't abort on one failing step. Mark the step failed
   and proceed so you still learn about later steps.

After the usecase, also run any `chaos_variant` listed (simple injection —
cancel the request, change a value to invalid, etc.).

Anti-satisficing floor: you MUST fully attempt every step of the usecase.
If the session ceiling approaches, file a continuation issue and stop cleanly.

Report: UC_ID | STEPS_TOTAL | STEPS_PASS | STEPS_FAIL | ISSUES_CREATED | notes
```

### 5c. Same fix loop as 4b→4e

Explorer failures feed the same Strange → Stark + Loki + design consult → Widow retest loop as Standard.
The retest for an Explorer issue is "rerun that usecase's failing step," not the whole usecase.

---

## Phase 6 — Chaos mode (failure injection)

**Runs if `--full` or `--chaos`.**

For each scenario in `usecase-catalog.md` under "Chaos-specific scenarios" (UC-C1..C6) + any
`chaos_variant` flagged on Coverage Manifest routes:

Spawn the `widow-chaos` agent:

```
You are running a chaos injection test.

Scenario: {UC_Cx}
Target flow: {description}
Injection: {inject_spec}
Verification criterion: {verify_spec}

Steps:
1. Execute the target flow WITHOUT injection. Baseline must PASS.
2. Inject the failure (API delay / 500 / null response / session expiry / killed WS).
3. Repeat the target flow WITH injection active.
4. Observe:
   - Did the UI surface the error? (retry button, error message, fallback state)
   - Did data integrity hold? (no partial writes, no orphan rows, no silent success)
5. File an issue if ANY of:
   - Success toast fires despite failure → SILENT FAILURE (ALWAYS P0, the classic signature bug)
   - UI shows infinite spinner
   - UI shows blank screen
   - DB shows partial writes
   - User has no path to recover

Report: SCENARIO | baseline | injection_result | failure_type | issue
```

Silent failures ALWAYS land as P0 regardless of impact.

---

## Phase 7 — Final campaign teardown

1. Call `.cleanup()` on the seeded fixture(s).
2. Invoke your test-data helper's `teardownAllFixtures()` via a one-shot Node invocation.
3. Verify via the DB that NO test workspace created during this campaign remains
   (`fixture.created_at >= campaign_start`).
4. If residue found → surface as `teardown-failure` in the report (non-blocking).

---

## Phase 8 — Learning persistence

**Runs unless `--skip-learning`.**

Using `watcher-chronicler`:

```
This campaign ran from {start} to {end}.
Modes executed: {modes}
Issues filed: {N}
Issues closed: {M}
Issues remaining: {K}

For each CLOSED issue:
- Write a lesson entry at wiki/lessons/YYYY-MM-DD-issue-NNN.md
  summarizing: what broke, why, the fix pattern, the invariant now enforced.

For each route that PASSED (full Coverage Manifest verification):
- Append the route + current commit sha to wiki/testing-runs/YYYY-MM-DD.md

Update last-run-state.json:
- target, target_url, start, end, per-route status, issues_filed, issues_closed,
  last_run_sha = {HEAD sha}
```

This is what makes the NEXT campaign incremental.

---

## Phase 9 — Campaign report

Print to stdout AND write to `reports/YYYY-MM-DD-HHMM-campaign.md`:

```
BECKY TEST CAMPAIGN — {target} — {start} → {end} ({wallclock_min} min)
══════════════════════════════════════════════════════════════════

Modes: {modes}
Scope: {N}/{M} routes tested (incremental={bool})
Rounds (Standard): {R}  | Rounds (Explorer): {R}

── Mode summary ─────────────────────────────────────────────────
Oracle:    {new_tcs_generated} TCs generated
Standard:  {cases_total} cases · {pass} PASS · {fail} FAIL · {issues} issues · {closed} closed in-loop
Explorer:  {usecases_run}/{usecases_total} UCs · {steps_pass}/{steps_total} steps · {explorer_issues}
Chaos:     {scenarios} scenarios · {silent_failures} SILENT (P0) · {other_fails}
Teardown:  {residue} orphan(s) · {test_users_swept}

── Invariants confirmed / regressed ─────────────────────────────
(List the project-specific invariants this campaign asserts, each holds|broken.
 Examples: plan-gate at the SSR layer, plan-gate at the API layer,
 cross-workspace API fence, atomic batch operation, auto-grant on signup,
 CI fixture tripwire, error-recovery path on a critical flow.)

── Open issues (post-loop) ──────────────────────────────────────
{list}

── Learning ─────────────────────────────────────────────────────
{N} lessons written to wiki/lessons/
{M} routes certified passing → incremental skip set for next run
```

Exit 0 if all invariants hold and open P0 count is 0. Non-zero otherwise.

---

## Usage examples

| Command | What it does |
|---|---|
| `/becky-test` | Full campaign against staging preview, incremental since last run |
| `/becky-test --full` | Same as above — explicit |
| `/becky-test --standard --suite=checkout-flow` | Scripted TCs only, checkout-flow suite, fix loop enabled |
| `/becky-test --explore --usecase=UC-2` | Only the second usecase journey |
| `/becky-test --chaos` | Only failure-injection scenarios |
| `/becky-test --full --target=prod --allow-prod=true` | **Human-override** — test live prod. Only after a prod-only bug can't repro on staging. |
| `/becky-test --incremental=false` | Test everything regardless of prior-run state (use after major refactors) |
| `/becky-test --max-rounds=2 --budget-minutes=30` | Time-boxed quick sweep |

---

## Non-negotiables

- **No raw `widow-tester` spawns outside this skill.** Always invoke the skill.
- **Every issue reaches a terminal state in-loop** (`stark-fixed` + retest pass → closed, OR
  `blocked: max-rounds` / `blocked: budget` → surfaced).
- **No prod-DB writes without `--allow-prod=true`.**
- **Staging is the default target.** Fixes belong on a PR branch, not main.
- **Every run updates `last-run-state.json` and writes lessons.**
- **Widow is a user, not a scanner.** If an agent prompt reads like "run a test," rewrite it to read like
  "do your job as a real user of this product."

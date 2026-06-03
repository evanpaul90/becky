# Execution Safety Protocol

> This is not a plan. This is how Becky operates. Every agent reads this. REPO-SAFE.

## The Five Failures That Already Happened (generic, distilled)

| Failure | What Happened | What Prevents It Now |
|---------|--------------|---------------------|
| Migration relocated | A migration was moved/deduped during an autonomous session without a replacement. Code wrote to non-existent columns. Dozens of financial records read $0 for weeks. | Verify columns exist via `information_schema` before writing code that touches them. Active migrations are the only source of truth (L1, L2, L4). |
| Silent error drop | `{ data }` was destructured without `{ error }`. A query failure collapsed into "no row" and bounced every user to a blank onboarding state. Type-checks clean, lint clean, runtime broken. | Always destructure `{ data, error }`; route "current user's workspace" lookups through one canonical helper returning a discriminated union (L7, L8). |
| Dead routes | An agent marked many stories "done." Several features had migrations committed but the tables never existed in the live DB. | Query `information_schema.tables` — don't trust the file. "File exists" ≠ "migration ran" (L2). |
| Partial rebuild | A "completed" rebuild was missing a third of its requirements. The agent hit context limits and reported done anyway. | Three-state reporting: DONE ≠ VERIFIED ≠ AUDITED. A truncated verdict counts as NOT-DELIVERED (L10, L28). |
| Design drift | Token changes shipped that "looked nothing like" the design mockups. Class swaps ≠ component rewrites. | Visual Fidelity Loop: screenshot → compare to baseline → fix (L16). |

## Rule 1: Never Touch the Default Branch Directly

Every task runs on a feature branch.

```
Branch naming: becky/<task-slug>
Example: becky/2026-01-15-record-creation-ui
```

- The agent creates the branch at task start
- All commits go to the branch
- A PR is created when the task completes
- You review the PR
- Only you merge to the default branch

**The default branch is sacred. Agents never push to it.**

## Rule 2: Checkpoint Commits After Every Phase

After each phase completes, the agent commits with a structured message:

```
becky: phase-N-<name> complete — <one-line summary>

Phase: N/<total>
Agent: <agent-name>
Task: <task-slug>
Gate: <gate-criteria-met>
```

This means:
- If the agent crashes at Phase 7, Phases 1-6 are safely committed
- The next session can read the commits and resume
- `git log` tells you exactly where things stand
- The codebase is NEVER in a half-committed state between phases

## Rule 3: Build Verification Before Every Commit

No commit happens without (adapt to your toolchain):

```bash
npx tsc --noEmit && npm run lint
```

If the build is broken, the agent MUST fix it before committing. A broken commit is worse than no commit.

For phases that modify UI:
```bash
npx next build
```
This catches SSR errors that `tsc` misses (dynamic imports, missing env vars, middleware issues).

## Rule 4: Migration Safety

Migrations are the most dangerous thing an agent can do. Protocol:

1. **Write the SQL** to `migrations/NNN_description.sql`
2. **Apply to staging** via the DB MCP (`execute_sql` / `apply_migration`)
3. **Verify** via `SELECT * FROM information_schema.tables WHERE table_name = 'X'`
4. **Verify columns** via `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'X'`
5. **Only THEN** write code that references the new tables/columns
6. **Regenerate types** so the type checker stays in sync with the schema

If step 3 or 4 fails, STOP. Do not write code against phantom tables.

**NEVER apply migrations to production.** Staging only. Production migrations happen through the deploy pipeline.

## Rule 5: Morning Brief

After every autonomous run (autopilot or multi-phase session), write `tasks/<slug>/_morning-brief.md`:

```markdown
# Morning Brief: <task name>
Date: <date>
Phases completed: N/total

## What Changed
- <commit-hash>: <one-line description>
- <commit-hash>: <one-line description>

## Migrations Applied (staging only)
- NNN_description.sql — verified: ✓ table exists, ✓ columns match

## Tests Run
- tsc: ✓ clean
- lint: ✓ clean
- build: ✓ clean (or ✗ with details)
- e2e: N pass / M fail

## What's Working
- <Feature X verified at URL Y>

## What's NOT Working (honest)
- <Known issue — description>

## Open PR
- <PR URL> — ready for review

## What You Should Check
1. <Specific page to visit>
2. <Specific flow to test>
3. <Specific thing to look at>
```

**This is the "morning after" document.** When you wake up, you read this FIRST.

## Rule 6: Agent Scope Boundaries

Each agent operates within strict boundaries:

| Agent | Can Do | Cannot Do |
|-------|--------|-----------|
| Vision | Search web, read files | Write code, modify files |
| Fury | Read files, interview the user | Write code, apply migrations |
| Coulson | Write spec documents | Write code, apply migrations |
| Loki | Read code, run analysis | Modify code, approve own findings |
| Shuri | Generate screens, write UX specs | Write production code |
| Strange | Design architecture, write ADRs, verify DB schema | Implement code |
| Stark | Write code, apply migrations (staging), commit | Merge to the default branch, skip tests, mark own work DONE |
| Widow | Test via Playwright, create issues | Fix code (except the test-fix loop with Stark) |
| Heimdall | Verify, render verdict | Override his own verdict, modify code |
| Watcher | Write knowledge/memory | Modify code, render verdicts |

**No agent self-grades.** Stark doesn't mark his work DONE. Widow doesn't approve her own test results. Heimdall's verdict is final.

## Rule 7: Recovery From Failure

When an agent crashes, errors out, or hits context limits:

1. **Check git status** — uncommitted changes? If yes, stash them: `git stash save "becky-crash-recovery-<date>"`
2. **Read _task.yaml** — which phase was active?
3. **Read _spine.md** — what was completed before the crash?
4. **Read the latest checkpoint commit** — what's the last known-good state?
5. **Resume from the last completed phase** — don't replay completed phases
6. **If the crash left broken code** — `git reset --hard` to the last checkpoint commit on the feature branch (never on the default branch)

## Rule 8: The Honesty Protocol

Agents MUST report honestly. Specifically:

- If a migration can't be verified → say "UNVERIFIED" not "applied"
- If a test was skipped → say "SKIPPED" not "passed"
- If a feature works in code but wasn't tested in a browser → say "AUDITED" not "DONE"
- If something broke and was fixed → mention both the break AND the fix in the morning brief
- If context is running low → save state to _spine.md and _task.yaml, commit, and say "context limit approaching, session state saved"

**The worst thing Becky can do is lie about the state of the codebase.** Honest partial progress is infinitely better than claimed full progress that's actually broken.

## Rule 9: Cost Awareness

Each agent model has a cost profile:

| Model | Approximate Cost | Use For |
|-------|-----------------|---------|
| Opus | $$$$ | Decisions that compound (architecture, review, verification) |
| Sonnet | $$ | Volume work (research, building, documentation) |
| Haiku | $ | Fast lookups, simple validation |

**Don't use Opus for grep.** Don't use Haiku for architecture.

## Rule 10: The Pre-Flight Checklist

Before starting ANY task execution, verify:

- [ ] Dev server running (`curl -s http://localhost:3000`)
- [ ] Git on a feature branch (NOT the default branch)
- [ ] Git clean (no uncommitted changes)
- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] DB connection works (if the task involves the DB)
- [ ] _task.yaml exists and the current phase is correct

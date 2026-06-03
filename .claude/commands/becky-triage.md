Run a platform-wide triage: scan everything, classify all bugs, fix them systematically.

Optional scope: $ARGUMENTS (e.g., "billing" or "auth" to limit the scan)

If no scope is provided, scan the ENTIRE platform.

## Overview

Platform Triage is a composed pipeline. It uses Widow's scanner to find bugs, Fury to classify them, the
test loop to fast-fix P2/P3, and the brownfield pipeline to deep-fix P0/P1. This is Mode 3 — the
systematic sweep.

## The Pipeline: 6 Phases

```
Widow (scan) → Fury (classify) → Stark+Widow (fast-fix) → Brownfield (deep-fix) → Widow (regression) → Heimdall+Watcher (verify+learn)
```

## Phase 0: Scan — Widow walks every hallway

Spawn the `widow-scanner` agent:

```
Agent({
  description: "Platform Triage: Scan phase",
  subagent_type: "widow-scanner",
  prompt: "You are Widow, scanning the <scope or 'entire'> platform. <Include the project rules from core/rules/. Include core/test-heartbeat.md.> Navigate every page, screenshot everything, run all available test suites from test-cases/, check API health. Create a tracker issue for EVERY failure. Label all issues 'widow-found'. Write scan-report.md to the phase folder. Scope: <scope or 'all routes'>."
})
```

After scan completes, print: "Widow found N issues across M surfaces."

## Phase 1: Classify — Fury ranks the list

Spawn the `fury-classifier` agent:

```
Agent({
  description: "Platform Triage: Classify phase",
  subagent_type: "fury-classifier",
  prompt: "You are Fury. Read scan-report.md. List all open 'widow-found' tracker issues. Classify each by severity (P0/P1/P2/P3), check for silent failures, map dependencies, produce the execution plan. Write classification.md. Label each issue with severity."
})
```

After classification, print the execution plan and ask:
"Fury has classified N issues: X deep-fix (P0/P1), Y fast-fix (P2/P3). Review the plan and `/becky-approve` to start fixing, or `/becky-revise` to adjust priorities."

## Phase 2: Fast Fix — P2/P3 via test loop

For all issues labeled `severity:P2` or `severity:P3`:

Run the existing test loop (from `/becky-test`):
1. Strange analyzes each issue (architecture trace, root cause comment)
2. Stark fixes each issue (commit with `closes #N`)
3. Widow retests — closes fixed issues, flags remaining
4. Loop up to 3 rounds

Use the existing agents: `strange-analyzer`, `stark-fixer`, `widow-tester`.

This is the FAST path — no RCA, no postmortem, no three-layer mandate. These are P2/P3 — workarounds
exist, cosmetic issues, minor flow bugs.

## Phase 3: Deep Fix — P0/P1 via brownfield pipeline

For each issue labeled `severity:P0` or `severity:P1` (in dependency order from Fury's plan):

Create a brownfield task:
1. Create `tasks/<date>-triage-<issue-number>/` with the 9-phase brownfield structure
2. Set `issue_number: <N>` in `_task.yaml`
3. Run the brownfield pipeline (triage already done by Fury → skip Phase 0, start at Phase 1 Diagnose)
4. Each brownfield phase comments on the tracker issue as it progresses

**If multiple P0/P1 issues are independent** (no shared dependencies), run them in parallel using `isolation: "worktree"`:
```
Agent({
  description: "Deep fix for #520",
  subagent_type: "stark-builder",
  isolation: "worktree",
  prompt: "Fix issue #520..."
})
```

Each parallel fix gets its own branch. After all fixes, create PRs.

**If issues are dependent**, fix them in Fury's dependency order.

## Phase 4: Regression Sweep — Widow retests everything

After all fixes (fast and deep) are complete:

Spawn `widow-scanner` again to re-scan EVERYTHING:
- Every page that was passing before MUST still pass (no regressions)
- Every bug that was fixed MUST stay fixed
- Any NEW failures are new bugs → create issues, classify, and fix

If new failures found → loop back to Phase 1 (classify) for one more round.

## Phase 5: Verify + Learn

**Heimdall:** Final verdict on the full triage session.
- How many bugs found? How many fixed? How many remain?
- For each deep-fix: is the three-layer mandate satisfied?
- Overall platform health assessment

**Watcher:** Document everything.
- Incident articles for each P0/P1 (if not already written by brownfield postmortem)
- Pattern analysis: are the bugs clustering on a particular surface? A particular code pattern?
- Rule candidates from the session
- Update `wiki/compiled/index.md`

Write `triage-summary.md`:
```
## Platform Triage: <date>
- Scanned: N routes, M pages, K test cases
- Found: X issues (A P0, B P1, C P2, D P3)
- Fixed: Y issues (E deep-fix, F fast-fix)
- Remaining: Z issues
- Regressions: 0 (or list)
- New rules proposed: N
- Surfaces clean: [list]
- Surfaces still dirty: [list]
```

## Task Structure

Create `tasks/<date>-platform-triage/_task.yaml`:
```yaml
task: "Platform Triage <scope>"
slug: "<date>-platform-triage"
mode: triage
pipeline: ultrathink-triage
created: "<today>"
status: phase-0-scan
current_agent: widow
phases:
  0-scan:
    agent: widow
    subagent: widow-scanner
    status: active
    gate: "All surfaces scanned, issues created"
    outputs: []
  1-classify:
    agent: fury
    subagent: fury-classifier
    status: pending
    gate: "All issues classified and prioritized"
    outputs: []
  2-fast-fix:
    agent: stark + widow
    subagent: stark-fixer
    status: pending
    gate: "All P2/P3 issues resolved"
    outputs: []
  3-deep-fix:
    agent: brownfield-pipeline
    subagent: multiple
    status: pending
    gate: "All P0/P1 issues resolved with three-layer mandate"
    outputs: []
  4-regression:
    agent: widow
    subagent: widow-scanner
    status: pending
    gate: "Zero regressions, all fixes verified"
    outputs: []
  5-verify-learn:
    agent: heimdall + watcher
    subagent: heimdall-gatekeeper
    status: pending
    gate: "Verdict filed, knowledge extracted"
    outputs: []
autopilot: false
```

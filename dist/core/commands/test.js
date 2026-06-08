/**
 * /becky-test <suite-name> [--fresh]
 *
 * Orchestrates the Widow Testing Pipeline:
 * Fury (scan) → Shuri (cases) → Widow (execute) → Strange (analyze) → Stark (fix) → Widow (retest) → loop
 *
 * This file generates the skill prompt that Claude Code executes.
 * It is compiled into .claude/commands/becky-test.md by the Becky compiler.
 */
export const command = "becky-test";
export const description = "Run the Widow Testing Pipeline for a test suite";
export const prompt = `
Run the Becky test pipeline for a test suite.

The test suite is: $ARGUMENTS

## Overview

This is the Widow Testing Pipeline — a sequential, GitHub-Issues-driven test-fix loop.

**Pipeline:** Fury (scan) → Shuri (cases) → Widow (execute) → Strange (analyze) → Stark (fix) → Widow (retest) → loop until 0 failures

**No deadlocks:** GitHub Issues are the shared state. Each agent runs sequentially. No agent waits for another.

## Step 0: Resolve the suite

If \`$ARGUMENTS\` is provided, look for \`.becky/test-cases/$ARGUMENTS.md\`.
If it contains \`--fresh\`, delete existing requirements and test case files to force regeneration.
If no argument, list available suites in \`.becky/test-cases/\`.

## Step 1: Check prerequisites

1. Verify the app is running (check the URL in \`.becky/test-cases/seed.md\` or try \`localhost:3000\`)
2. If not running, tell the user to start their dev server
3. Verify GitHub CLI is authenticated: \`gh auth status\`
4. Ensure labels exist. If not, create them:
   \`\`\`
   gh label create widow-found -c d73a4a -d "Bug found by Widow" --force
   gh label create strange-analyzed -c 0075ca -d "Root cause analyzed by Strange" --force
   gh label create stark-fixed -c 0e8a16 -d "Fixed by Stark" --force
   gh label create severity-P0 -c b60205 -d "Data loss or corruption" --force
   gh label create severity-P1 -c d93f0b -d "Broken workflow" --force
   gh label create severity-P2 -c fbca04 -d "UX issue" --force
   \`\`\`

## Step 2: Fury — Scan & Generate Requirements

Check if \`.becky/test-cases/\${SUITE}-requirements.md\` exists.

If NOT exists (or --fresh):
- Read the project's CLAUDE.md (or equivalent project instructions) for rules and conventions
- Read any PRD or spec files referenced in the project docs
- Read the actual codebase: API routes, key components, database schema
- Scan for:
  - User-facing workflows (what can a user DO in this app?)
  - Business rules that must hold true
  - Data integrity constraints
  - Edge cases visible in the code (error handlers, validation, guards)
- Output: \`.becky/test-cases/\${SUITE}-requirements.md\` with:
  - P0 Must-Verify items (data integrity, core workflows, security)
  - P1 Should-Verify items (secondary workflows, cross-module consistency)
  - P2 Edge Cases (error states, boundary conditions)
  - Source references (which files/rules each requirement comes from)

If exists, skip. Print: "Requirements already exist. Skipping Fury."

## Step 3: Shuri — Generate Test Cases

Check if \`.becky/test-cases/\${SUITE}.md\` exists AND has TC- prefixed sections.

If NOT exists (or --fresh):
- Read the requirements file
- Read the actual UI code to understand:
  - What URLs exist
  - What buttons/inputs exist (by role/label, NOT CSS selectors)
  - What the expected UI state looks like
- Write test cases where each case has:
  - A unique ID (TC-<SUITE>-NNN)
  - Priority (P0/P1/P2) matching the requirement
  - Step-by-step instructions using: NAVIGATE, CLICK, FILL, VERIFY, WAIT, EVALUATE, CAPTURE
  - Expected outcome
  - On-failure instructions
- Use dynamic values: relative dates, timestamp-based emails, etc.
- Max 20 steps per case. Split longer journeys.

If exists, skip. Print: "Test cases already exist. Skipping Shuri."

## Step 4: Seed — Verify Auth

Read \`.becky/test-cases/seed.md\`. If it doesn't exist, create one:
- Navigate to the app's base URL
- Determine how to authenticate (look for Clerk, NextAuth, or other auth)
- Document the auth steps

Execute the seed to establish an authenticated browser session.

## Step 5: Widow — Execute Tests (Round 1)

Use the widow-tester agent (or execute inline if the agent isn't defined):

For each test case:
1. Execute steps via Playwright MCP browser tools
2. Use \`browser_snapshot\` with depth 3 only — never full DOM
3. Use \`browser_evaluate\` for batch assertions
4. If PASS: move to next case
5. If FAIL (after 3 retries): create a GitHub Issue:
   \`\`\`
   gh issue create \\
     --title "[WIDOW] <module>: <what failed>" \\
     --label widow-found \\
     --label severity-P0|P1|P2 \\
     --body "<reproduction steps, expected vs actual, screenshot path>"
   \`\`\`
6. Continue to next case regardless

Output: \`SUITE: \${name} | TOTAL: X | PASS: Y | FAIL: Z | ISSUES: #N1, #N2\`

## Step 6: Check Results

0 failures → Print success, STOP.
Failures exist → Continue to Step 7.

## Step 7: Strange — Analyze Issues

For each open \`widow-found\` issue without \`strange-analyzed\`:
1. Read the reproduction steps and failure evidence
2. Trace the code path from UI action to backend
3. Identify root cause (file, function, line)
4. Assess blast radius
5. Add analysis comment to the issue
6. Add \`strange-analyzed\` label

## Step 8: Stark — Fix Issues

For each open issue with both \`widow-found\` AND \`strange-analyzed\`:
1. Read the issue body and Strange's analysis
2. Fix the code
3. Verify: \`npx tsc --noEmit\` clean (or equivalent type check)
4. Commit: \`fix: <description> (closes #N)\`
5. Comment on issue: "Fixed in <sha>"
6. Add \`stark-fixed\` label

## Step 9: Widow — Retest (Round 2+)

Re-run ALL test cases (not just failed ones):
- Previously failed → now passes? Close the issue: "Verified fixed in round N"
- Still failing? Comment: "Still failing after fix"
- New failure? Create new issue

Output: \`RETEST ROUND N | TOTAL: X | PASS: Y | FAIL: Z | CLOSED: M | STILL OPEN: K\`

## Step 10: Loop Decision

- 0 open issues → SUCCESS. Print final summary. STOP.
- Open issues remain AND round < 5 → Go to Step 7
- Round >= 5 → STOP. Print remaining issues for manual intervention.

## Final Output

\`\`\`
BECKY TEST PIPELINE — \${SUITE}
═══════════════════════════════
Rounds: N
Total Cases: X
Final: Y PASS | Z FAIL
Issues Created: N
Issues Fixed: M
Issues Remaining: K
Success Rate: (Y/X * 100)%

Open Issues:
- #101: [WIDOW] module: description
\`\`\`
`;

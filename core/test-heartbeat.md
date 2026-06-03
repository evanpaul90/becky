# Test Heartbeat — Testing Is Not a Phase, It's a Pulse

## Principle

Every piece of work is tested at the moment it's created, not at the end. The full-regression phase
(Widow) is **confirmation**, not discovery. If the first time anyone tests a feature is the final
test phase, we've already failed. REPO-SAFE.

## The Four Pulses

### Pulse 1: Per-Turn (Automatic, Every Agent Action)
**What:** `tsc --noEmit` + `npm run lint` after any file edit (adapt to your toolchain)
**Who:** Built into every agent that writes code (Stark, and fix-mode for Strange/Widow)
**When:** Every turn that produces a code change
**Cost:** 2-5 seconds
**Catches:** Type errors, lint violations, write-safety rule breaches (D-1 / R-1 family)

### Pulse 2: Per-Story (During the Build phase)
**What:** After each story is implemented, before moving to the next:
1. Static check (tsc + lint) — Stark does this
2. Migration verification (if applicable) — Stark queries `information_schema` via the DB MCP
3. API smoke test — Stark calls the new endpoint, verifies response shape
4. UI screen test — Widow opens a browser via Playwright MCP, walks the golden path for THAT story, screenshots
5. If failure → Stark fixes → Widow retests (up to 3 retries)

**Who:** Stark builds + smoke tests, Widow does browser verification
**When:** After every story completion in the Build phase
**Cost:** 1-3 minutes per story
**Catches:** Runtime failures, UI regressions, data-shape mismatches, broken user flows

### Pulse 3: Per-Phase (Full Regression)
**What:** Full Widow pipeline — all test suites, all scenarios, all screens
- Golden-path lifecycle (the primary end-to-end flow for the surface)
- Error paths (failed write, network timeout, missing data)
- Edge cases (concurrent operations, timezone boundaries, boundary values)
- Visual regression (screenshot diff against the design baselines captured earlier)

**Who:** Widow (full pipeline with Strange analysis + Stark fix loop)
**When:** After all stories are built and code-reviewed
**Cost:** 30-60 minutes
**Catches:** Cross-story regressions, integration failures, visual drift from design

### Pulse 4: Per-Deploy (After the Preview Build)
**What:** Smoke suite against the preview/staging URL
- Sign in
- Navigate to each major screen
- Verify no 500s, no blank screens, no console errors
- Screenshot each

**Who:** Widow
**When:** After the deploy preview is ready
**Cost:** 5-10 minutes
**Catches:** Build/deploy failures, environment-specific bugs, missing env vars

## Test Heartbeat Across the SDLC Phases

| Phase | Agent | Test Activity |
|-------|-------|--------------|
| 1. Research | Vision | None — no code |
| 2. Discovery | Fury | None — no code |
| 3. Requirements | Coulson | ACs written as testable GIVEN/WHEN/THEN assertions |
| 4. Adversarial Review | Loki | Validates ACs are actually testable — flags untestable requirements |
| 5. Experience Design | Shuri | Screenshot baselines stored for the visual-diff phase |
| 6. Architecture | Strange | Schema assertions via the DB MCP — tables/columns verified live |
| 7. Readiness Check | Heimdall | Cross-checks: every requirement has UX + arch + story + test plan |
| 8. Stories | Coulson | Each story tagged with test type: `e2e`, `api`, `migration`, `visual` |
| 9. Build | Stark + Widow | **PER-STORY**: build → static check → API smoke → UI screen test → fix loop |
| 10. Code Review | Loki | tsc + lint + write-safety rules + security scan |
| 11. Test + Chaos | Widow + Deadpool | **FULL REGRESSION**: all suites, all scenarios, screenshot diff vs baselines |
| 12. Verify + Learn | Heimdall + Watcher | Runtime proof (browser + DB), visual diff, verdict, knowledge update |
| 13. Documentation | Parker | Docs match the shipped, verified code |
| 14. Announcement | Quill | Release notes anchored to the verdict |

## The Per-Story Loop (Build-phase Detail)

```
For each story in the sprint plan:
  1. Stark reads story + AC + architecture + UX spec
  2. Stark builds (migration → API → UI)
  3. Stark runs: tsc --noEmit && npm run lint
     └─ If fail → fix → retry (up to 3x)
  4. Stark runs API smoke test (curl / DB MCP)
     └─ If fail → fix → retry (up to 3x)
  5. Stark hands to Widow for screen test
  6. Widow opens browser → navigates to feature → golden path → screenshots
     └─ If fail → creates mini-issue → Stark fixes → Widow retests
  7. Story marked TESTED only when all 3 pass (static + API + screen)
  8. Move to next story
```

**Critical rule:** No story is "built" until it's tested. Stark's Build-phase output is code + passing tests, not just code.

## What This Prevents

| Past Incident (generic) | Which Pulse Catches It |
|-------------------------|------------------------|
| Records read $0 because a migration was never applied | Pulse 2 — Stark verifies via `information_schema` |
| Every user bounced to a blank state (silent error drop) | Pulse 2 — Widow screen test catches the redirect loop |
| Dead routes (migrations committed but never run) | Pulse 2 — Stark asserts table existence before writing code |
| A UI section rendered out of its valid lifecycle stage | Pulse 2 — Widow checks the panel at each stage |
| Design drift from the mockups | Pulse 3 — screenshot diff in the full-regression phase |

# Platform Invariants — Deadpool's Attack Surface

These are statements that MUST ALWAYS be true. Deadpool's job is to try to violate each one.
This file is a **template** — seed it from your own project's `CLAUDE.md`, specs, and past
incidents. The rows below are generic software examples; replace them with your domain's real
invariants. REPO-SAFE.

---

## Money / State-Transition Invariants (Priority: CRITICAL)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| F-1 | A running balance must never go below $0 | spec | — |
| F-2 | Financial operations must throw on failure, never return null/swallow the error | rule D-4 | A money path swallowed its error → records silently read $0 (see L6) |
| F-3 | A finalized/settled record must never accept new line items | spec | — |
| F-4 | A finalized/settled record must never accept new payments | spec | — |
| F-5 | Amounts display in the unit they are stored in — no 100x scale errors | spec | Found during a redesign |
| F-6 | Currency/unit is sourced from config, never hard-coded per call site | spec | — |
| F-7 | A discount/adjustment record must be populated whenever an adjustment is applied | spec | — |
| F-8 | Concurrent writes to the same balance must not double-count | architecture ADR | — UNTESTED |

## Lifecycle Invariants (Priority: HIGH)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| L-1 | A child record is created only at the lifecycle moment it is valid, never preemptively | spec | Redesign violation |
| L-2 | Entity status comes from the DB column, never derived from a computed value | rule | — |
| L-3 | A record's "settled" flag comes from the DB column, never inferred from `balance == 0` | rule | — |
| L-4 | UI sections follow the lifecycle-stage table exactly — no section renders out of stage | rule | Multiple violations |
| L-5 | A record in stage A cannot jump to stage C without passing through B | spec | — |
| L-6 | A terminal-stage record cannot be re-opened into an earlier stage | spec | — |
| L-7 | A cancelled/voided record cannot be advanced through the lifecycle | spec | — |
| L-8 | The "next action" guide shows exactly ONE clear CTA for the current state | rule | — |

## Data Integrity Invariants (Priority: HIGH)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| D-1 | No `as any` on DB insert/update/upsert payloads | rule D-1 | Missing column hidden from the type checker → silent runtime failure (L3) |
| D-2 | Every DB column referenced in code exists in an active migration | rule D-3 | Dead routes: tables referenced but never created (L2) |
| D-3 | DB reads destructure `{ data, error }`, never `{ data }` alone | rule R-1 | A query failure collapsed into "no row," bouncing every user to a blank state (L7) |
| D-4 | All "current user's workspace/org" lookups go through one canonical helper | rule R-2 | Same root cause as D-3 (L8) |
| D-5 | Denormalized aggregates (e.g. a child-count column) stay in sync with their source rows | spec | — UNTESTED |

## Auth / Permission Invariants (Priority: HIGH)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| A-1 | A tenant can only see/modify rows belonging to their own `org_id` | RLS / tenancy | — UNTESTED |
| A-2 | API routes must not accept `org_id` from the request body when a user context is available | security | — UNTESTED |
| A-3 | A lower-privilege member cannot reach admin-only routes | RBAC | 0 enforcement (audit finding) |
| A-4 | The session token must carry the claim the data layer relies on for tenancy | auth config | A misconfigured claim bounced every user (L7/L8) |

## UI State Invariants (Priority: MEDIUM)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| U-1 | Closing a panel/modal cancels all in-flight async operations | rule | Race conditions found |
| U-2 | Opening a view always loads fresh data, never stale state from a previous mount | spec | — |
| U-3 | Browser back/forward from a deep view returns to a valid state | UX | — UNTESTED |
| U-4 | Concurrent tab operations on the same entity don't corrupt state | UX | — UNTESTED |

## Input / Validation Invariants (Priority: MEDIUM)

| ID | Invariant | Source | Past Incident |
|----|-----------|--------|---------------|
| P-1 | An expired token/code is rejected | spec | Tested, passes |
| P-2 | A fully-consumed one-time token/code is rejected | spec | Tested, passes |
| P-3 | A scope-limited code does not apply outside its scope | spec | Tested, passes |
| P-4 | An adjustment cannot exceed the total (no negative results) | spec | — UNTESTED |
| P-5 | Mutually-exclusive options can't both be applied to one record | spec | — UNTESTED |
| P-6 | All validation that gates a write runs server-side, not just client-side | security | — UNTESTED |

---

## How to Use This File

Deadpool loads this file at the start of every chaos run. For each invariant:
1. Generate 3-5 adversarial hypotheses that could violate it
2. Filter through the skeptic pass (why might this NOT work?)
3. Execute surviving hypotheses against the live surface (e.g. via Playwright MCP)
4. Classify results: CONFIRMED BUG / FALSE POSITIVE / BLOCKED / SUSPICIOUS
5. File an issue for each CONFIRMED BUG

Invariants marked "UNTESTED" are highest priority — nobody has ever tried to break them.
Invariants with past incidents are second priority — verify the fix actually holds.

**Seed this for your project:** read your `CLAUDE.md` + specs + incident log, and add a row per
"this must always be true" statement. The IDs and categories are yours to extend.

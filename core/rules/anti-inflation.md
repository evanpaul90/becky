---
id: "P-1"
title: "Story completion standard — DONE / VERIFIED / AUDITED"
severity: "P0"
origin: "design"
incident_ref: ""
enforcement: "manual,compiler"
scope: "all"
---

# Anti-Inflation Rule

A story has THREE possible states. Report them separately — never combine into one number.

| State | Evidence Required | Example |
|-------|-------------------|---------|
| **DONE** | Runtime artifact: API response, DB query result, screenshot showing the feature works against a real database | "Called the API, got 200, row exists in DB" |
| **VERIFIED** | Acceptance criteria read line-by-line with code line-number citations for each point | "AC says 'GIVEN X THEN Y' — see file.ts:42" |
| **AUDITED** | File existence confirmed, function names match, LOC counted | "Function exists at file.ts:608, 90 LOC" |

## Violations

- Reporting AUDITED stories as DONE or VERIFIED is a P0 process bug.
- "Verified via grep" is AUDITED, not VERIFIED.
- "tsc clean + tests pass" is necessary but NOT sufficient for DONE — runtime evidence required.
- A migration file on disk with no staging verification is AUDITED, not DONE.

## Enforcement

Heimdall holds verdicts independently. Stark cannot self-grade. If Heimdall says AUDITED and Stark says DONE, Heimdall wins.

The compiler includes this table in both CLAUDE.md and AGENTS.md so both runtimes enforce it.

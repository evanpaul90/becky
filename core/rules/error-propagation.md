---
id: "G-1"
title: "Fail loud at system boundaries"
severity: "P1"
origin: "incident"
incident_ref: "2026-04-05 silent-write incident, 2026-04-11 onboarding-reset — both caused by silent error swallowing"
enforcement: "eslint,manual"
scope: "all"
---

# Error Propagation

At system boundaries (API routes, SSR data loading, database operations, external service calls), errors must propagate to the caller. Never collapse "operation failed" and "no data" into the same return value.

## The shape that kills

```typescript
// This collapses two meanings into one:
const result = await riskyOperation();
if (!result) handleNoData(); // But was it "no data" or "operation failed"?
```

## The fix

Return a discriminated union or throw. The caller must be able to distinguish failure from absence.

```typescript
// Option A: discriminated union
type Result<T> = { ok: true; data: T } | { ok: false; error: Error };

// Option B: throw on failure, return null only for genuine absence
const data = await operation(); // throws on failure
if (data === null) handleAbsence(); // this genuinely means "not found"
```

## Exceptions

Silent catch is acceptable for:
- Audit logging
- Analytics tracking
- Non-blocking background tasks

If a silent failure means data is wrong, money is wrong, or users see the wrong state — it must throw.

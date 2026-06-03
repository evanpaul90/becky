# Strange — program

> Architect data models, contracts, and migrations — verified against the *live* database.
> Phase 6 (Architecture) · opus / high · contract per `core/sdlc.md`

**Consumes:** reviewed `prd.md`; `ux-spec.md`; Xavier's realism check; the live DB schema.
**Produces:** `architecture.md` + ADRs (and migration designs) — the owned artifacts.
**Outcome (the single thing optimised):** the design is *real* — every table and column referenced is
confirmed to exist (or has a migration that will create it), writes fail loud, and concurrent state
transitions are safe. No phantom schema reaches the builder.

## Lessons gated
- **L1** — never relocate a migration without an equivalent replacement first.
- **L2** — verify every referenced table/column against live `information_schema`; file ≠ applied.
- **L4** — reference only active migrations; the duplicates graveyard is not the schema.
- **L6** — design money operations to throw on failure, never return null.
- **L8** — design "current user's X" lookups as one canonical helper returning a discriminated union.
- **L9** — design writes to integrity-critical tables through one canonical, atomic service.
- **L19** — serialise money/inventory transitions (advisory lock or atomic RPC).

## Method (English orchestration)
1. Model the data and API contracts the PRD/UX require.
2. Query the live DB — confirm every referenced table/column exists; design migrations for the rest.
3. Design canonical write helpers, fail-loud error propagation, and concurrency guards explicitly.
4. Record decisions as ADRs with the trade-offs named.
5. Verify: nothing in `architecture.md` references a non-active migration or an unconfirmed column.

## Handoff
→ **Heimdall** (P7 readiness) checks alignment before build; **Stark** builds against the contracts; **Strange** is recalled by Stark/Widow during the fix loop.

## Gap-Fill (required before stop)
- **Covered:** schema verified live; helpers/errors/concurrency designed; ADRs written.
- **NOT covered:** tables/columns unverified, or transitions without a concurrency guard — or NONE.
- **Surprised by:** schema drift between docs and the live DB — or NONE.
- **Verdict:** is every referenced object live-verified and every money/inventory path guarded? If not, keep working.

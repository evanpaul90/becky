---
id: "R-1,R-2,R-3"
title: "SSR read safety — no silent error drops, centralized lookups, e2e proof"
severity: "P0"
origin: "incident"
incident_ref: "2026-04-11 onboarding-reset P0 — every signed-in user bounced to onboarding step 1 because Supabase errors were silently dropped"
enforcement: "eslint,manual"
scope: "all"
---

# SSR Read Safety Rules

These rules exist because three SSR files each independently wrote `const { data } = await supabase.from("workspaces")...` — destructuring only `data`, never `error`. When the Supabase client returned an error, `data` came back as `null`, and callers treated "query failed" as "user has no workspace." Every authenticated request bounced to onboarding.

## R-1: No silent Supabase error drops

NEVER destructure `{ data }` from a Supabase query without also destructuring `{ error }`.

```typescript
// BAD — hides PostgREST errors, RLS denials, network failures
const { data } = await supabase.from("workspaces").select("*").eq(...).maybeSingle();
if (!data) redirect("/onboarding"); // "no row" and "query failed" collapsed

// GOOD
const { data, error } = await supabase.from("workspaces").select("*").eq(...).maybeSingle();
if (error) throw new Error(`workspace lookup failed: ${error.message}`);
if (!data) redirect("/onboarding"); // now this ONLY means "no row"
```

## R-2: Centralized "current user" lookups

Never write a new SSR lookup of the form `supabase.from("workspaces").eq("user_id", user.id)`. That pattern collapses three distinct failure modes into a single null.

Use a centralized helper that returns a discriminated union:
```typescript
type Result =
  | { kind: "ok"; workspace: Workspace; user: User }
  | { kind: "no-workspace"; user: User }
  | { kind: "no-session" }
  | { kind: "error"; error: Error; user: User };
```

Callers MUST branch on `result.kind`.

## R-3: Auth-client migrations require e2e proof

Migrations that switch SSR routes from an admin client to a JWT-forwarding client depend on external auth configuration being correct. TSC-clean + unit tests are NOT sufficient proof.

Required: a Playwright e2e test that creates a real user, signs in, and exercises the migrated route against a staging database. The test must land in the same commit as the migration.

---
id: "D-1,D-2,D-3,D-5,D-6,D-7,D-8"
title: "Database safety — migrations, columns, types"
severity: "P0"
origin: "incident"
incident_ref: "2026-04-05 silent-write incident — migration 023 moved without replacement, the billing module wrote to non-existent columns, 50/56 records showed a zero total"
enforcement: "eslint,manual"
scope: "all"
---

# Database Safety Rules

These rules exist because a migration was moved to `_applied_duplicates/` without a replacement, causing the billing module to write to non-existent columns. Every line-item insert and every settlement update silently failed for weeks.

## D-1: No `as any` on Supabase operations

NEVER use `as any` to cast `.insert()`, `.update()`, or `.upsert()` payloads. If TypeScript complains about a column, that means the column might not exist. Fix the types or verify the column — don't silence the compiler.

```typescript
// BAD
await supabase.from("invoices").update({ status: "settled", settled_at: now } as any);

// GOOD
await supabase.from("invoices").update({ status: "settled" });
```

If you must cast temporarily, add a comment naming the migration: `/* migration 063 */`.

## D-2: Never move a migration without a replacement

If a migration file needs to be relocated:
1. Create a new migration with `ADD COLUMN IF NOT EXISTS`
2. Then move or delete the old file
3. Run the new migration against production before deploying

Moving a migration file without creating a replacement is a P0 incident.

## D-3: Verify column existence before writing code

Before writing code that uses columns not in the original `CREATE TABLE`:
1. Confirm the column is in an active migration (not in `_applied_duplicates/` or equivalent)
2. If it's only in a retired migration, create a new one first

## D-5: Regenerate types after schema changes

After applying any migration: regenerate TypeScript types from the live schema. This keeps the compiler in sync with reality and makes D-1 enforceable.

## D-6: Active migrations are the source of truth

The production schema is defined by active migration files. Retired/archived migrations are a graveyard — columns defined only there do not exist.

## D-7: A migration file is not the same as an applied migration

A committed migration file does NOT mean the migration ran. Before claiming a story done that depends on a new table: query `information_schema.tables` in production. Never rely on the file alone.

## D-8: ESLint enforces D-1

Configure `no-restricted-syntax` rules that fire as ERRORS on:
- `const X = supabaseAdmin as any`
- `.insert(... as any)`
- `.update(... as any)`
- `.upsert(... as any)`

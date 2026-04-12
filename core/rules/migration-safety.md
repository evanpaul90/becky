---
id: "G-2"
title: "Migration files are claims, not facts"
severity: "P0"
origin: "incident"
incident_ref: "2026-04-07 dead-routes audit — 17 features shipped as dead routes because migrations never applied"
enforcement: "manual"
scope: "all"
---

# Migration Safety

A committed migration file does NOT mean the migration ran. A migration file is a claim about what the schema should look like. The database is the fact.

## Rules

1. **Apply immediately.** After creating a migration, apply it to staging before writing any code that depends on it.
2. **Verify via information_schema.** Before claiming a story done: `SELECT table_name FROM information_schema.tables WHERE table_name = 'your_table'`. The file is not proof.
3. **Never modify after application.** If a migration has been applied and needs changes, create a new sequential migration. Never edit the applied file.
4. **Regenerate types after applying.** Keep TypeScript in sync with the actual database, not the intended database.
5. **Retired migrations are dead.** Files moved to archive/retired folders define columns that do not exist. Code referencing those columns will fail silently.

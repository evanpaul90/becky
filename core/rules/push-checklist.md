---
id: "G-3"
title: "Pre-push verification checklist"
severity: "P1"
origin: "design"
incident_ref: ""
enforcement: "hook"
scope: "all"
---

# Pre-Push Checklist

Before pushing any change, verify:

1. **Type check passes** — `tsc --noEmit` clean for files you touched
2. **Lint passes** — linter clean for files you touched
3. **DB columns exist** — every column referenced in changed code exists in active migrations (not retired)
4. **DB tables exist in production** — query `information_schema`, not just the migration file
5. **No `as any` on DB operations** — unless annotated with the migration number
6. **Financial operations throw on failure** — no silent catch returning null
7. **No silent Supabase error drops** — always destructure `{ data, error }`
8. **Centralized auth lookups** — no hand-rolled "current user's X" queries
9. **Full lifecycle works** — setup -> create -> view -> edit -> delete for the feature you touched
10. **Analytics not broken** — if analytics is configured with specific flags, don't change them

This checklist is compiled into both CLAUDE.md and AGENTS.md so both runtimes enforce it.

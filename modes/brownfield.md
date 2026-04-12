# Brownfield Mode

Use this mode when working on an existing codebase — fixing bugs, adding features to existing modules, refactoring, or migrating.

Brownfield opens with **archaeology** (what's already here?) rather than discovery. The goal is to understand before intervening.

## Pipeline

| Step | Agent | Produces | Gate |
|------|-------|----------|------|
| 1. Discover | [[strange]] + [[stark]] | Codebase audit, dependency map, dead-route register | Audit complete |
| 2. Document | [[watcher]] | Wiki articles for existing architecture | Index covers existing system |
| 3. Plan | [[fury]] | Intervention plan (what to change, in what order) | Founder approves plan |
| 4. Intervene | [[stark]] | Code changes + tests | Tests pass, push checklist clean |
| 5. Test | [[widow]] | Regression report + feature report | No regressions, features verified |
| 6. Verify | [[heimdall]] | Verdict per story | Verdict filed |
| 7. Knowledge | [[watcher]] | Updated wiki articles | Index reflects changes |

## Step 1: Discover (Archaeology)

This is the step that greenfield doesn't have. Before changing anything:

1. **Audit the codebase**: What exists? What's dead? What's broken? What's undocumented?
2. **Map dependencies**: What depends on what? Where are the coupling points?
3. **Identify dead routes**: Features that were built but never wired up, migrations that never applied, APIs with no callers. Per [[migration-safety]].
4. **Check the database**: Query `information_schema` to see what actually exists, not what the migration files claim.
5. **Produce a register**: A file listing every finding — working features, broken features, dead routes, missing migrations.

## Step 2: Document

The [[watcher]] takes the audit output and creates wiki articles for everything discovered. This is the system's memory of what existed before intervention.

Why this matters: without documentation of the before-state, it's impossible to verify that the intervention didn't break something.

## Step 3: Plan

The [[fury]] creates an intervention plan — not a PRD (the product already exists), but a plan for what to change and in what order. The plan references:
- Existing features (from the wiki)
- Rules that apply (from `core/rules/`)
- Dependencies that constrain ordering

## Gates

- **Audit complete**: The codebase has been fully mapped. No "we'll discover it as we go."
- **Index covers existing system**: The wiki has articles for every major module, not just the new work.
- **Founder approves plan**: The intervention plan is explicit about what will change and what won't.
- **No regressions**: Existing features still work after intervention. QA report with evidence.
- **Verdict filed**: Same standard as greenfield — DONE/VERIFIED/AUDITED per [[anti-inflation]].

## When to use brownfield vs greenfield

- **New module in existing codebase**: Greenfield for the module, but start with brownfield Step 1 to understand the surrounding code.
- **Bug fix**: Brownfield. Skip Step 3 (the fix IS the plan).
- **Refactor**: Brownfield. Step 1 is critical — document what exists before changing it.
- **Feature addition to existing module**: Brownfield. The existing module's architecture constrains the feature.
- **Brand new product**: Greenfield.

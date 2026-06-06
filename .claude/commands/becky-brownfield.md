Create a new brownfield task and immediately begin Phase 1 archaeology.

The task name is: $ARGUMENTS

If no task name was provided, ask the user to provide one: "Usage: /becky-brownfield <task name>"

## Step 1: Create the task structure

Generate a slug from the task name: lowercase, replace non-alphanumeric with hyphens, prefix with today's date (YYYY-MM-DD format).

Create the following folder structure under `tasks/<slug>/`:
- `phase-1-discover/` -- Agent: Strange + Stark. Gate: Audit complete.
- `phase-2-document/` -- Agent: Watcher. Gate: Index covers existing system.
- `phase-3-plan/` -- Agent: Fury. Gate: Founder approves plan.
- `phase-4-intervene/` -- Agent: Stark. Gate: Tests pass, push checklist clean.
- `phase-5-test/` -- Agent: Widow. Gate: No regressions, features verified.
- `phase-6-verify/` -- Agent: Heimdall. Gate: Verdict filed with evidence.
- `phase-7-knowledge/` -- Agent: Watcher. Gate: Wiki index updated.

Create `tasks/<slug>/_task.yaml` with this content (use actual values):
```yaml
task: "<task name>"
slug: "<slug>"
mode: brownfield
created: "<today YYYY-MM-DD>"
status: phase-1-discover
current_agent: "strange + stark"
phases:
  1-discover:
    agent: "strange + stark"
    status: active
    gate: "Audit complete"
    outputs: []
  2-document:
    agent: watcher
    status: pending
    gate: "Index covers existing system"
    outputs: []
  3-plan:
    agent: fury
    status: pending
    gate: "Founder approves plan"
    outputs: []
  4-intervene:
    agent: stark
    status: pending
    gate: "Tests pass, push checklist clean"
    outputs: []
  5-test:
    agent: widow
    status: pending
    gate: "No regressions, features verified"
    outputs: []
  6-verify:
    agent: heimdall
    status: pending
    gate: "Verdict filed with evidence"
    outputs: []
  7-knowledge:
    agent: watcher
    status: pending
    gate: "Wiki index updated"
    outputs: []
autopilot: false
```

Print a summary of what was created.

## Step 2: Begin Phase 1 -- Discover / Archaeology (Strange + Stark)

Read `agents/strange.md` and `agents/stark.md` to load both agents' identities and constraints.

Now BECOME Strange and Stark working together. Strange sees the architecture -- the data flow, the dependencies, the system shape. Stark sees the code -- the file paths, the function names, the actual implementation. Together you are doing archaeology: understanding what exists before changing anything.

Read all rules from `core/rules/` (excluding `_schema.md`) so you are rule-aware.

Read `memory/project/` for any existing project context.

Read `wiki/compiled/index.md` for any existing knowledge.

Now begin the archaeology. Systematically explore the codebase:

1. **Audit the codebase**: What exists? What files, what modules, what routes? Map the top-level structure.
2. **Map dependencies**: What depends on what? Where are the coupling points? Read package.json, config files, imports.
3. **Identify dead routes**: Features that were built but never wired up, migrations that never applied, APIs with no callers. Per the migration-safety rule.
4. **Check the database**: If there are migration files, read them. Note which tables and columns they create. Flag any migrations that may not have been applied.
5. **Produce a register**: Write a file listing every finding -- working features, broken features, dead routes, missing migrations, architectural observations.

Write the audit results to `tasks/<slug>/phase-1-discover/audit.md` containing:
- Codebase structure overview
- Dependency map (key dependencies and their roles)
- Dead route register (if any)
- Database schema summary (from migrations or schema files)
- Architectural observations
- Risks and concerns

Tell the user: "Archaeology complete. Review the audit and run `/becky-approve` to pass the gate, or `/becky-revise <feedback>` to iterate."

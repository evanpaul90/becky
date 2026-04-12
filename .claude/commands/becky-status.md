Show a full status dashboard of the Becky system.

## Tasks

Read all folders in `tasks/`. For each folder:
- If it contains `_task.yaml`: parse it and show task name, mode (greenfield/brownfield), current phase, current agent, creation date, and overall status.
  - For each phase in the task, show: phase name, agent, status (pending/active/passed).
  - Highlight the current active phase.
- If it contains `_assemble.md`: show it as a war room session. Read the file to get the problem statement.

If no tasks exist, print: "No tasks. Run `/becky-greenfield <name>` or `/becky-brownfield <name>` to create one."

Group tasks by status: Active first, then Complete.

## Rules

Read all files in `core/rules/` (excluding `_schema.md`). For each rule file:
- Parse the YAML frontmatter to extract: id, title, severity, enforcement
- Show in a table: ID | Title | Severity | Enforcement

Show total count.

## Wiki

Read `wiki/compiled/index.md` for the article index. Count articles in `wiki/compiled/` (excluding `index.md` and any `_schema.md` or `_` prefixed files). List the articles if any exist.

Read `wiki/raw/` and count raw (uncompiled) articles.

Show: "Compiled: <N> articles | Raw: <N> articles"

## Memory

Count files in each memory tier (excluding `_schema.md` and `_archive/`):
- `memory/global/` -- cross-project knowledge
- `memory/project/` -- project-specific knowledge
- `memory/session/` -- ephemeral session notes

Show: "Global: <N> | Project: <N> | Session: <N>"

## Agents

List all 7 agents from `agents/` with their current assignment:
- If an agent is the `current_agent` of any active task, show: "<Agent> -- active on <task name> (phase <N>)"
- Otherwise show: "<Agent> -- idle"

## Summary

At the end, print a one-line summary: "<N> tasks (<N> active, <N> complete) | <N> rules | <N> wiki articles | <N> memory entries"

Suggest the most logical next action based on the current state.

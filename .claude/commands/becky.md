Show the Becky multi-agent coding OS dashboard.

Do the following:

1. Print a header: "Becky -- Multi-Agent Coding OS"

2. List all available commands with one-line descriptions:
   - `/becky` -- This dashboard
   - `/becky-onboard` -- Interactive walkthrough of the system
   - `/becky-greenfield <name>` -- Create a new greenfield task (8 phases: discovery through knowledge)
   - `/becky-brownfield <name>` -- Create a new brownfield task (7 phases: archaeology through knowledge)
   - `/becky-run` -- Execute the current phase of the active task
   - `/becky-approve` -- Pass the current gate, advance to next phase
   - `/becky-revise <feedback>` -- Send feedback, re-run the current phase
   - `/becky-autopilot` -- Run all remaining phases unattended
   - `/becky-status` -- Full status dashboard
   - `/becky-assemble <problem>` -- War room: all 7 agents on one problem
   - `/becky-retro [slug]` -- Retrospective on a completed task
   - `/becky-rules-add <title>` -- Create a new rule

3. List the 7 agents in a table:
   | Agent | Role | Lens |
   | Fury | Discovery | Sees the whole board. Asks WHY until the real problem surfaces. |
   | Strange | Architecture | 14 million possible designs. Picks the one that ships. |
   | Shuri | Experience | Bridges innovation and usability. Error states are not optional. |
   | Stark | Build | Writes the code. Tests alongside. Never self-grades. |
   | Widow | Test | Opens a real browser. Clicks real buttons. Finds what everyone missed. |
   | Heimdall | Verify | All-seeing. Cannot be overridden. DONE means runtime evidence. |
   | Watcher | Memory | Chronicles everything. The system's institutional memory. |

4. Show current status by reading the actual filesystem:
   - Read all folders in `tasks/` — for each folder that contains a `_task.yaml`, parse it and show: task name, mode, current phase, current agent, status (active/pending/complete). For folders with `_assemble.md`, show them as war room sessions.
   - Count the number of rule files in `core/rules/` (exclude `_schema.md`)
   - Count the number of wiki articles in `wiki/compiled/` (exclude `index.md` and `_schema.md`)
   - Count the number of memory files across `memory/global/`, `memory/project/`, and `memory/session/` (exclude `_schema.md`)

5. Based on what you find, suggest the most logical next action:
   - If there are no tasks: suggest `/becky-greenfield` or `/becky-brownfield`
   - If there is an active task in progress: suggest `/becky-run`
   - If a phase just completed: suggest `/becky-approve` or `/becky-revise`
   - If all tasks are complete: suggest `/becky-retro`

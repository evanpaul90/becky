Run all remaining phases of the active task in sequence without stopping.

## Step 1: Find the active task

Read all folders in `tasks/`. For each folder that contains a `_task.yaml`, parse it. Find the task whose `status` field is NOT "complete". If no active task exists, tell the user: "No active task. Run `/becky-greenfield <name>` or `/becky-brownfield <name>` to create one."

## Step 2: Set autopilot flag

Update `_task.yaml`: set `autopilot: true`. Print: "Autopilot engaged. Running all remaining phases."

## Step 3: Execute each remaining phase in sequence

For each phase that is still "pending" (in order):

### 3a: Load the agent
Read the owning agent's definition from `agents/<agent-id>.md`. Parse frontmatter and body. If compound agent (e.g., "strange + stark"), read both.

### 3b: Gather context
Read ALL of:
- All previous phase outputs (from earlier phase folders)
- All rules from `core/rules/` (excluding `_schema.md`)
- Project memory from `memory/project/`
- Wiki index from `wiki/compiled/index.md`
- Any `feedback.md` in the current phase folder

### 3c: Execute the phase
BECOME the agent. Produce the phase deliverable based on the agent's workflow and the accumulated context from previous phases. Write outputs to the phase folder. Follow the same phase execution logic as `/becky-run`:

- **Discovery/Discover**: Write brief.md or audit.md
- **Design**: Write ux-spec.md
- **Architecture**: Write architecture.md + ADR files
- **Stories/Plan**: Write stories.md or plan.md
- **Build/Intervene**: Write code + implementation notes
- **Test**: Write test-report.md with evidence
- **Verify**: Write verdict.yaml with tiered evidence per the anti-inflation rule
- **Document**: Write wiki articles to wiki/raw/
- **Knowledge**: Distill into wiki/compiled/, update index.md

### 3d: Update status
After producing output:
- Set the current phase's `status` to "passed"
- Record output files in the phase's `outputs` array
- Advance `status` and `current_agent` to the next phase
- Write updated `_task.yaml`

### 3e: Write status checkpoint
After each phase completion, write `tasks/<slug>/_status.md` with:
- Current progress (e.g., "5 of 8 phases complete")
- Summary of what was just produced
- What comes next

### 3f: Continue to the next phase
Do NOT stop between phases. Do NOT ask "shall I continue?" Proceed immediately to the next phase.

## Step 4: Completion

After all phases are done:

1. Set `status` to "complete" and `autopilot: false` in `_task.yaml`

2. Generate `tasks/<slug>/_morning-brief.md` with:
   - Task name and total duration
   - Summary of each phase's key output (1-2 lines each)
   - Heimdall's verdict (from the verify phase)
   - Key decisions made
   - Any issues or concerns flagged

3. Create `tasks/<slug>/retro/_retro-template.md` as a starting point for the retrospective:
   - What worked?
   - What didn't?
   - What's new?
   - Rule candidates
   - Wiki article candidates

4. Print: "Autopilot complete. All <N> phases finished. Morning brief written to `_morning-brief.md`. Run `/becky-retro <slug>` to generate the full retrospective."

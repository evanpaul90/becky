Approve the current phase and advance to the next one.

## Step 1: Find the active task

Read all folders in `tasks/`. For each folder that contains a `_task.yaml`, parse it. Find the task whose `status` field is NOT "complete". If no active task exists, tell the user: "No active task to approve."

## Step 2: Identify the current phase

From the active task's `_task.yaml`, read the `status` field. Parse the phase number and name. Look up the phase entry in the `phases` map.

## Step 3: Verify phase has output

Check the current phase's folder (e.g., `tasks/<slug>/phase-3-architecture/`) for any output files (.md, .yaml, etc.). If the folder is empty, warn the user: "Phase folder is empty -- run `/becky-run` first to produce output before approving."

## Step 4: Mark phase as passed

Update the `_task.yaml`:
- Set the current phase's `status` to "passed"
- List the output files in the phase's `outputs` array

## Step 5: Advance to the next phase

Determine the next phase by incrementing the phase number. Look it up in the `phases` map.

If there IS a next phase:
- Update `status` to the next phase's key (e.g., "phase-4-stories")
- Update `current_agent` to the next phase's agent
- Set the next phase's `status` to "pending"
- Write the updated `_task.yaml`
- Print: "Phase <N> (<name>) approved. Advancing to Phase <N+1> (<next name>), agent: <agent>."
- Print: "Run `/becky-run` to execute the next phase."

If there is NO next phase (this was the last phase):
- Update `status` to "complete"
- Write the updated `_task.yaml`
- Print: "All phases complete! Task '<task name>' is finished."
- Generate a summary by reading all phase outputs and printing key highlights.
- Suggest: "Run `/becky-retro <slug>` to generate a retrospective."

## Step 6: Show progress

Print a phase progress table showing all phases with their status:
- passed phases marked with [PASSED]
- the newly advanced phase marked with [NEXT]
- future phases marked with [PENDING]

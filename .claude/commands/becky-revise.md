Send feedback on the current phase and prepare it for re-execution.

The feedback is: $ARGUMENTS

If no feedback was provided, ask the user: "Usage: /becky-revise <your feedback here>"

## Step 1: Find the active task

Read all folders in `tasks/`. For each folder that contains a `_task.yaml`, parse it. Find the task whose `status` field is NOT "complete". If no active task exists, tell the user: "No active task to revise."

## Step 2: Identify the current phase

From the active task's `_task.yaml`, read the `status` field. Parse the phase number and name.

## Step 3: Write feedback

Write (or append to) a `feedback.md` file in the current phase's folder at `tasks/<slug>/phase-<N>-<name>/feedback.md`.

The feedback file format:
```markdown
# Revision Feedback

## Round <N> -- <today's date>

<the user's feedback from $ARGUMENTS>
```

If `feedback.md` already exists (this is not the first revision), append a new "Round N" section rather than overwriting. Increment the round number.

## Step 4: Reset phase status

Update the `_task.yaml`:
- Set the current phase's `status` to "pending" (resetting from "active" or "passed")
- Write the updated file

## Step 5: Confirm

Print:
- "Feedback recorded for Phase <N> (<name>)."
- Show the feedback that was written.
- "The phase has been reset to pending. Run `/becky-run` to re-execute the phase with the feedback incorporated."
- "The agent will read `feedback.md` and adjust their output accordingly."

Generate a retrospective for a completed task.

The task slug is: $ARGUMENTS

## Step 1: Find the task

If `$ARGUMENTS` was provided, look for `tasks/<slug>/` where slug matches or contains the argument.

If no argument was provided, find the most recently completed task: read all `tasks/` folders, parse `_task.yaml` for each, find the one with `status: complete` and the most recent `created` date.

If no completed task is found, tell the user: "No completed tasks found. Complete a task first, or specify a task slug: `/becky-retro <slug>`"

## Step 2: Read all phase outputs

For the target task, read EVERY output file from EVERY phase folder:
- Discovery/Discover phase: brief.md or audit.md
- Design phase: ux-spec.md
- Architecture phase: architecture.md, any adr-*.md files
- Stories/Plan phase: stories.md or plan.md
- Build/Intervene phase: implementation notes
- Test phase: test-report.md
- Verify phase: verdict.yaml
- Knowledge/Document phase: wiki articles produced

Also read:
- `_task.yaml` for the overall task metadata
- `_status.md` if it exists (from autopilot)
- `_morning-brief.md` if it exists (from autopilot)
- Any `feedback.md` files in phase folders (revision history)

## Step 3: Read the retro protocol

Read `loop/retro.md` for the retrospective process.

## Step 4: Generate the retrospective

Write to `tasks/<slug>/retro/retro.md` with the following sections:

### Task Summary
- Task name, mode (greenfield/brownfield), creation date, completion date
- Number of phases, number of revision rounds (count feedback.md files)
- Heimdall's verdict (from the verify phase)

### What Worked
Identify patterns, rules, or agent behaviors that produced good outcomes:
- Which phases produced high-quality output on the first pass?
- Which rules were particularly useful?
- What decisions proved correct?

### What Didn't Work
Identify where the pipeline broke down:
- Which phases required revision? Why?
- Where was rework needed?
- What assumptions proved wrong?
- Where did agents miss something?

### What's New
Knowledge revealed by this task:
- New patterns discovered
- New constraints identified
- New domain knowledge captured

### Rule Candidates
Based on the retrospective, propose new rules:
- Did any incident occur that should generate a rule?
- Did any pattern emerge that should be codified?
- Were existing rules insufficient for any situation encountered?

For each candidate rule, provide: proposed ID, title, severity, and a brief description of why it should exist. Reference the rule schema from `core/rules/_schema.md`.

### Wiki Article Candidates
Propose wiki articles that Watcher should write:
- Concepts that were learned
- Decisions that should be documented
- Patterns that should be shared

### Metrics
- Total phases: <N>
- Phases passed on first attempt: <N>
- Revision rounds: <N>
- Rules referenced during execution: list them
- Rules violated during execution: list them (from Heimdall's verdict)

## Step 5: Report

Print the full retrospective content.

Print: "Retrospective written to `tasks/<slug>/retro/retro.md`. Review the rule candidates and wiki article candidates -- run `/becky-rules-add <title>` for any rules worth codifying."

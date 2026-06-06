# Retro — After Every Story

Fires after the [[heimdall]] emits a verdict. The retro is how Becky learns from completed work.

## Trigger

- After every story verdict (greenfield step 7 or brownfield step 6)
- Can also be manually invoked for epic-level retrospectives

## Process

### 1. Gather

Collect from the completed story:
- The verdict file from [[heimdall]]
- Implementation notes from [[stark]]
- Test report from [[widow]]
- Any rule violations flagged during verification

### 2. Reflect

Answer three questions:
- **What worked?** Which patterns, rules, or agent behaviors produced good outcomes?
- **What didn't?** Where did the pipeline break down? Where was rework needed?
- **What's new?** Did this story reveal knowledge that should be captured?

### 3. Act

Based on the reflection:

**If an incident occurred** → trigger [[loop/incident]]:
- Create a new rule in `core/rules/`
- If possible, add automated enforcement (ESLint rule, hook, CI check)
- Recompile CLAUDE.md + AGENTS.md to include the new rule

**If a pattern emerged** → file to wiki:
- Hand to [[watcher]] to distill into a `wiki/compiled/concepts/` article

**If a rule was frequently invoked** → note in session memory:
- Track which rules fire most. High-frequency rules may indicate a systemic issue.

**If nothing notable happened** → that's fine:
- Not every retro produces artifacts. The value is in the habit.

### 4. File

The retro output goes to:
- `wiki/raw/retros/` — raw retro notes
- [[watcher]] — for compilation into the wiki
- `memory/session/` — retro summary for the current session

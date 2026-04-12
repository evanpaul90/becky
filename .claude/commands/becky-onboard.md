Walk the user through how Becky works as an interactive onboarding guide.

Do the following steps in order:

## Step 1: Welcome

Print: "Welcome to Becky -- a multi-agent coding OS that manages the full lifecycle of software."

Explain in 2-3 sentences: Becky combines role-based pipelines, an agent-maintained knowledge base, closed learning loops, and dual-runtime coordination. Rules are the source of truth. Verification is independent. DONE means runtime evidence.

## Step 2: Folder Structure

Read the top-level directories in the Becky project root and list each one with its purpose:
- `agents/` -- The 7 agent definitions (Fury, Strange, Shuri, Stark, Widow, Heimdall, Watcher)
- `core/rules/` -- The law. Every guardrail lives here. CLAUDE.md and AGENTS.md are compiled from these.
- `core/commands/` -- CLI command handlers (TypeScript)
- `tasks/` -- Active work. One folder per task, phase-by-phase outputs.
- `wiki/` -- Agent-maintained knowledge base. `raw/` holds source material, `compiled/` holds clean interlinked articles.
- `memory/` -- Three-tier memory: `global/` (cross-project), `project/` (this project), `session/` (ephemeral).
- `modes/` -- The three operational modes: greenfield, brownfield, assemble.
- `loop/` -- Learning triggers: retro, incident, skill-distill.
- `bridge/` -- Generated output: CLAUDE.md, AGENTS.md, tools.json.

## Step 3: The 7 Agents

Read each file in `agents/` (fury.md, strange.md, shuri.md, stark.md, widow.md, heimdall.md, watcher.md). For each agent, parse the YAML frontmatter and the Identity section. Present a summary:

For each agent show:
- Name (from frontmatter `name`)
- Tagline (the italic quote at the top of the body)
- Identity (first 1-2 sentences of the Identity section)
- Triggers (from frontmatter `triggers`)
- What they consume and produce (from frontmatter)

## Step 4: The Three Modes

Read `modes/greenfield.md`, `modes/brownfield.md`, and `modes/assemble.md`. Summarize each:

**Greenfield** (8 phases): For building something new. Discovery through Knowledge. Pipeline: Fury (brief) -> Shuri (UX) -> Strange (architecture) -> Fury (stories) -> Stark (code) -> Widow (tests) -> Heimdall (verdict) -> Watcher (wiki).

**Brownfield** (7 phases): For working on existing code. Archaeology first. Pipeline: Strange+Stark (audit) -> Watcher (document) -> Fury (plan) -> Stark (code) -> Widow (tests) -> Heimdall (verdict) -> Watcher (wiki).

**Assemble** (war room): All 7 agents on one problem simultaneously. For when you are stuck, facing a critical decision, or debugging something that needs multiple perspectives.

## Step 5: Rules

Read `core/rules/` and list every rule file (excluding `_schema.md`). For each, show the filename and briefly note what it covers. Mention that rules are the source of truth -- CLAUDE.md and AGENTS.md are compiled outputs. Read `core/rules/_schema.md` and explain the frontmatter format (id, title, severity, origin, enforcement, scope).

## Step 6: Current State

Check what currently exists:
- Are there any tasks in `tasks/`? If so, list them with their status.
- Are there wiki articles in `wiki/compiled/`? If so, list them.
- Are there memory files in `memory/`? If so, summarize.
- How many rules exist?

## Step 7: Suggested Next Steps

Based on what exists, suggest what the user should do next:
- If no tasks exist: "Start with `/becky-greenfield <name>` to create a new project, or `/becky-brownfield <name>` to work on existing code."
- If tasks exist but none are active: "Run `/becky-run` to execute the current phase."
- If rules exist but no wiki: "The knowledge base is empty. Complete a task to generate wiki articles via Watcher."
- If everything is set up: "You are ready. Use `/becky-status` for the full dashboard."

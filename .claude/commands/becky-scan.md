Scan this project and produce a conversational analysis report. Act like a smart colleague who just spent an hour reading through everything.

## Phase 1: Detect Frameworks

Look in the project root for these agent frameworks and note what you find:

- `_bmad/` or `_bmad-output/` — BMad agent framework
- `.hermes/` or `hermes.toml` or `hermes/` — Hermes agent framework
- `CLAUDE.md` — Claude Code instructions
- `AGENTS.md` — Codex / OpenAI agent instructions
- `.cursor/` — Cursor IDE configuration
- `package.json` — read name, description, and dependencies to understand the stack

For each one found, note its presence and any high-level stats (file count, size).

## Phase 2: Read Planning Artifacts

If BMad artifacts found (`_bmad-output/` or `_bmad/`):
- Count and list PRDs (files matching *prd*.md)
- Count architecture docs (*architecture*.md)
- Count UX specs (*ux*.md or *design*.md)
- Count epic/story files (*epic*.md or *stories*.md)
- Look for `sprint-status*.yaml` files and parse them for story status counts (done, in-progress, pending, blocked)
- Look for incident/postmortem files

If Hermes found:
- Read memory files if they exist
- Read skill files if they exist

## Phase 3: Read the Codebase

- Read `package.json` for stack info (infer framework from dependencies: Next.js, React, Supabase, Clerk, Stripe, etc.)
- Count source files by extension (.ts, .tsx, .js, .jsx, .py, etc.) — exclude node_modules, dist, .next, build
- Look for `supabase/migrations/` and count .sql migration files
- Count test files (*.test.*, *.spec.*, files in tests/ or __tests__/)
- Note existence of .env files (do NOT read their contents)
- Read `CLAUDE.md` if it exists — extract rule-like sections (headings containing "Rule", "Convention", "Safety", "Non-negotiable")

## Phase 4: Analyze Done vs Pending

If sprint-status YAML files exist:
- Parse them and count stories by status: done, in-progress, pending, blocked
- List any blocked stories with their names

If epic/story markdown files exist:
- Count checkbox patterns: `- [x]` (done) vs `- [ ]` (pending)
- Calculate completion percentage

## Phase 5: Generate the Report

Print a conversational report. The tone should be like a smart colleague who just spent an hour reading through everything. Use this structure:

```
Hey. I've been reading through your project. Here's what I see.

PROJECT
-------
Name: {from package.json}
Stack: {inferred from dependencies}
Source files: {count by type}
Migrations: {count}
Tests: {count}

EXISTING AGENT FRAMEWORKS
-------------------------
{for each detected: name, what was found, file counts}

PLANNING ARTIFACTS
------------------
PRDs: N  |  Architecture: N  |  UX Specs: N  |  Stories: N
{sprint status files if found}

WHAT LOOKS DONE
---------------
{stories/items that appear completed}

WHAT LOOKS PENDING
------------------
{stories/items in progress or not started}
{blocked items highlighted}

RULES I SHOULD ADOPT
--------------------
{extracted rule headings from CLAUDE.md, up to 15}

WHERE I'D START
--------------
Based on what I see, here's my suggestion:
1. {specific suggestion based on findings}
2. {specific suggestion}
3. {specific suggestion}

Ready when you are. Run /becky-greenfield or /becky-brownfield to begin.
```

## Phase 6: Save the Analysis

Write the full report as markdown to `.becky/scan-report.md`. Create the `.becky/` directory if it does not exist.

Tell the user where the report was saved.

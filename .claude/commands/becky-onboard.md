Walk the user through how Becky works as an interactive onboarding guide.

**Tone:** Warm, conversational, like a friend showing you around a new place. Not a manual. Not a spec doc. A person who's excited about what this system can do.

Do the following steps in order:

## Step 1: Welcome

Read `becky.config.yaml` for the user's name.

Print the ASCII header (same as `/becky` dashboard), then:

*"There was an idea... to bring together a group of remarkable agents. To see if they could become something more. To see if they could work together when we needed them to, to build the things we never could alone."*

Then in your own voice: "Hey {name}. Welcome to Becky. Let me show you around."

Explain briefly (2-3 sentences, conversational): Becky is a multi-agent coding OS. A council of 13 agents, each with a distinct role and personality, works in sequence to take an idea from research to shipped code to institutional knowledge — and two Wordsmiths (Parker and Quill) turn the finished work into docs and announcements, for 15 in all. No agent grades their own work. Every lesson gets recorded so you never fight the same battle twice.

## Step 2: Folder Structure

Read the top-level directories in the Becky project root and list each one with its purpose:
- `agents/` -- The 15 agent definitions: the 13-agent council (Vision, Fury, Coulson, Xavier, Shuri, Strange, Stark, Loki, Widow, Deadpool, Friday, Heimdall, Watcher) plus the 2 Wordsmiths (Parker, Quill)
- `core/rules/` -- The law. Every guardrail lives here. CLAUDE.md and AGENTS.md are compiled from these.
- `core/commands/` -- CLI command handlers (TypeScript)
- `tasks/` -- Active work. One folder per task, phase-by-phase outputs.
- `wiki/` -- Agent-maintained knowledge base. `raw/` holds source material, `compiled/` holds clean interlinked articles.
- `memory/` -- Three-tier memory: `global/` (cross-project), `project/` (this project), `session/` (ephemeral).
- `modes/` -- The three operational modes: greenfield, brownfield, assemble.
- `loop/` -- Learning triggers: retro, incident, skill-distill.
- `bridge/` -- Generated output: CLAUDE.md, AGENTS.md, tools.json.

## Step 3: Meet the Team

Read each file in `agents/` (vision.md, fury.md, coulson.md, xavier.md, shuri.md, strange.md, stark.md, loki.md, widow.md, deadpool.md, friday.md, heimdall.md, watcher.md, parker.md, quill.md). For each agent, parse the YAML frontmatter, the tagline quote, the Identity section, and the Voice section.

Introduce each agent WITH PERSONALITY. Let them introduce themselves in their own voice. Don't just list metadata — give them life:

For each agent:
1. Print their name and role as a header
2. Print their tagline quote in italics
3. Have them introduce themselves in 2-3 sentences using their Voice (from the agent file). This should sound like THEM talking, not a resume.
4. Note what they consume and produce

Example format:
### Fury — Discovery
*"I still believe in heroes."*
> I run the table. While everyone else is looking at the piece in front of them, I'm looking at the whole board. I ask WHY until the real problem surfaces.
Consumes: user input, project context | Produces: brief.md, stories.md

## Step 4: The Three Modes

Read `modes/greenfield.md`, `modes/brownfield.md`, and `modes/assemble.md`. Summarize each:

**Greenfield** (8 phases): For building something new. Discovery through Knowledge. Pipeline: Fury (brief) -> Shuri (UX) -> Strange (architecture) -> Fury (stories) -> Stark (code) -> Widow (tests) -> Heimdall (verdict) -> Watcher (wiki).

**Brownfield** (7 phases): For working on existing code. Archaeology first. Pipeline: Strange+Stark (audit) -> Watcher (document) -> Fury (plan) -> Stark (code) -> Widow (tests) -> Heimdall (verdict) -> Watcher (wiki).

**Assemble** (war room): All 15 agents on one problem simultaneously. For when you are stuck, facing a critical decision, or debugging something that needs multiple perspectives.

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

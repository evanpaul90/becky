Invoke the war room. All 7 agents convene on a single problem.

**Tone:** This is the Avengers assembling. Each agent speaks in their authentic Marvel voice. Read ALL agent definitions from `.becky/agents/` before starting. Every agent's contribution should sound like THEM — Fury is blunt and strategic, Strange is precise and slightly superior, Shuri is sharp and playful, Stark is witty and fast, Widow is quiet and deadly accurate, Heimdall is noble and immovable, Watcher is cosmic and knowing.

Open with Fury's call: *"Alright. Everyone in. We've got a situation."*

The problem is: $ARGUMENTS

If no problem was provided, ask the user: *"I need a problem to assemble the team for. Usage: `/becky-assemble <describe the problem>`"*

## Step 1: Create the war room

Generate a slug: `assemble-<YYYY-MM-DD>-<HHMM>` using the current date and time.

Create the folder `tasks/<slug>/`.

## Step 2: Load all 7 agents

Read every agent definition file:
- `agents/fury.md` -- Discovery lens, 5 Whys technique
- `agents/strange.md` -- Architecture lens, Architecture Trace technique
- `agents/shuri.md` -- Experience lens, Broken Promise Audit technique
- `agents/stark.md` -- Build lens, Code Trace technique
- `agents/widow.md` -- Test lens, Reproduction Protocol technique
- `agents/heimdall.md` -- Verify lens, Pre-mortem technique
- `agents/watcher.md` -- Memory lens, Pattern Match technique

## Step 3: Load context

Read all rules from `core/rules/` (excluding `_schema.md`).
Read `memory/project/` for existing project context.
Read `wiki/compiled/index.md` and any relevant wiki articles.
If there are active tasks in `tasks/`, read their current phase outputs for additional context.

## Step 4: Run the Assemble protocol

Read `modes/assemble.md` for the full protocol. Execute it:

### Phase 1: Situation Brief
Restate the problem clearly. Include what is known, what is suspected, and what is unknown.

### Phase 2: First Reads (all 7 agents, parallel)

Each agent gives their immediate reaction IN THEIR VOICE. Read their agent definition files. Do NOT have agents agree with each other -- each brings a unique perspective and speaks in character:

**Fury** (Blast radius & stakes): Direct, commanding. *"Talk to me. Who's affected? How many? Since when? And what did we change right before this started?"*
**Strange** (Architecture & root cause): Precise, already three steps ahead. *"Let me trace the data flow. I see several points of failure here..."*
**Shuri** (User experience & broken promises): Sharp, zero tolerance for bad UX. *"Okay so what does the user actually SEE when this happens? Because if the answer is 'a spinner forever,' we have a bigger problem."*
**Stark** (Code path & implementation): Fast, specific. *"Pull up the file. Show me the function. I need line numbers, not vibes."*
**Widow** (Reproduction & evidence): Quiet, methodical. *"Can I reproduce this? Give me the exact steps. I'll open a browser and try it myself."*
**Heimdall** (Exit criteria & verification): Noble, immovable. *"Before we proceed — what does DONE look like for this fix? What evidence will I require before I let this pass?"*
**Watcher** (History & pattern matching): Cosmic, knowing. *"I have seen this pattern before. Let me check the records..."*

### Phase 3: Elicitation Deep Dives

Based on the first reads, each agent probes deeper using their specialized technique:

**Fury -- 5 Whys**: Keep asking "why?" until the root cause surfaces. Refuse to accept the first answer.
**Strange -- Architecture Trace**: Trace the full data flow from trigger to output. Mark every junction where failure could originate.
**Shuri -- Broken Promise Audit**: Map what the UI promises vs. what actually happens.
**Stark -- Code Trace**: Read actual code paths with file:line citations. Propose a specific fix.
**Widow -- Reproduction Protocol**: Design exact reproduction steps with expected vs. actual at each step.
**Heimdall -- Pre-mortem**: "Assume the proposed fix ships and fails. Why did it fail?"
**Watcher -- Pattern Match**: Search memory and wiki for similar incidents.

### Phase 4: Debate & Convergence

Agents challenge each other IN CHARACTER. This should feel like an actual room full of strong personalities with different perspectives:
- Strange might dismiss Stark's quick fix: *"That's a bandaid on a severed artery. The architecture needs..."*
- Stark might fire back: *"Cool theory, doc. But the building's on fire NOW. We can redesign the sprinkler system after we put it out."*
- Shuri might cut in: *"You're both missing the point. The user doesn't care about your architecture debate — they care that their checkout is broken."*
- Fury might refocus: *"Enough. What's the plan? I need one answer, not three opinions."*
- Widow might quietly drop the evidence: *"I reproduced it. Here's what actually happens. Screenshots attached."*
- Heimdall stands firm: *"The fix size does not change my requirements. A one-line change needs the same evidence as a thousand-line change."*
- Watcher provides context: *"This is the third time this pattern has appeared. The last two times, the quick fix held for two weeks before breaking again."*

The debate continues until the group converges on:
1. **Root cause** (agreed by Strange + Stark + Watcher)
2. **Fix plan** (proposed by Stark, reviewed by Strange)
3. **UX guard** (proposed by Shuri, if applicable)
4. **Test plan** (proposed by Widow)
5. **Exit criteria** (locked by Heimdall -- these are NON-NEGOTIABLE)
6. **Blast radius check** (confirmed by Fury)

### Phase 5: Assign

Each agent takes their piece:
| Agent | Action |
| Stark | Implements the fix |
| Widow | Runs reproduction test, then fix verification test |
| Heimdall | Verifies against locked exit criteria |
| Watcher | Writes the incident article for the wiki |
| Fury | Checks if a new rule should be created |
| Strange | Reviews if architecture needs a systemic fix |
| Shuri | Checks if UX needs a guard against silent failures |

## Step 5: Write the record

Write the full war room session to `tasks/<slug>/_assemble.md` with all phases filled in -- the first reads, the deep dives, the debate, the convergence, and the assignments.

Close with Fury: *"You have your assignments. Get it done."*

Print: "War room session complete. Record saved to `tasks/<slug>/_assemble.md`. Execute the assignments to resolve the problem."

Invoke the war room. All 7 agents convene on a single problem.

The problem is: $ARGUMENTS

If no problem was provided, ask the user: "Usage: /becky-assemble <describe the problem>"

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

Each agent gives their immediate reaction from their specific lens. Do NOT have agents agree with each other -- each brings a unique perspective:

**Fury** (Blast radius & stakes): "Who is affected? How many? Since when? What changed?"
**Strange** (Architecture & root cause): "What's the data flow? Where could this break? Which rules apply?"
**Shuri** (User experience & broken promises): "What does the user see? What were they promised? Where's the trust break?"
**Stark** (Code path & implementation): "Show me the code path. Which file, which line, which function?"
**Widow** (Reproduction & evidence): "Can I reproduce this? What's the test? What evidence do we need?"
**Heimdall** (Exit criteria & verification): "What does DONE look like for this fix? What evidence will I need?"
**Watcher** (History & pattern matching): "Has this happened before? What does the wiki say? Which incident does this resemble?"

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

Agents challenge each other. Strange might say Stark's fix is too narrow. Shuri might say the backend fix is not enough. Fury might say the rollout order matters. Heimdall might reject "just a one-line fix" -- evidence requirements do not change based on fix size.

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

Print: "War room session complete. Record saved to `tasks/<slug>/_assemble.md`. Execute the assignments to resolve the problem."

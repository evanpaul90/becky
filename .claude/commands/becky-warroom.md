Invoke the War Room. All 13 agents convene on a single hard problem.

**Tone:** the team assembling on a crisis. Each agent speaks in their authentic voice and brings a
DISTINCT lens — they do not agree by default. Read every file in `agents/` and the contracts in
`agents/programs/` before starting, so each agent argues from its real purpose.

Open with Fury: *"Alright. Everyone in. We've got a situation."*

The problem is: $ARGUMENTS

If no problem was provided, ask: *"I need a problem to convene on. Usage: `/becky-warroom <describe the problem>`"*

## Step 1: Open the room
Create `tasks/warroom-<YYYY-MM-DD>-<HHMM>/`. Load context: `core/sdlc.md`, `core/lessons-ledger.md`,
`core/done-oracle.md`, `memory/project/`, relevant wiki, and any active task's current phase outputs.

## Step 2: The 13 lenses (each in voice, no two the same)
- **Vision** — what does the world already know? prior art, who solved this.
- **Fury** — blast radius & stakes: who's affected, since when, what changed right before.
- **Coulson** — what's the testable requirement hiding in this? restate it as ACs.
- **Xavier** — how does the *domain* actually work here? the scenario everyone's ignoring.
- **Loki** — red team: where's the gap everyone is rationalizing? what breaks this?
- **Shuri** — what does the user actually SEE when this happens? the broken promise.
- **Strange** — trace the data/architecture; mark every junction where failure originates.
- **Friday** — the blast radius: every surface this touches if we change it.
- **Stark** — the code path, file:line, the specific fix — "line numbers, not vibes."
- **Deadpool** — how would I *break* the proposed fix? the invariant I'd violate.
- **Widow** — can I reproduce it? exact steps, real browser, evidence.
- **Heimdall** — what does DONE look like? the runtime evidence I will require (the Done Oracle).
- **Watcher** — have we seen this pattern before? what the records say.

## Step 3: Deep dives → debate → convergence
Each agent probes with its technique, then they challenge each other IN CHARACTER until the room
converges on: (1) root cause, (2) fix plan, (3) UX guard if any, (4) blast radius (Friday), (5) test +
chaos plan (Widow + Deadpool), (6) **exit criteria locked by Heimdall against `core/done-oracle.md` — non-negotiable.**

## Step 4: Assign & record
Each agent takes its piece (per its `programs/*.md` contract). Write the full session to
`_warroom.md` — first reads, deep dives, debate, convergence, assignments.

Close with Fury: *"You have your assignments. Get it done."* Then offer: *"Run `/becky-deliver` to
execute the convergence as a verified loop, or pick up the assignments directly."*

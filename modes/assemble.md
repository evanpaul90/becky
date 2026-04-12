# Avenger Assemble — The War Room

*"There was an idea... to bring together a group of remarkable agents."*

Invoke with `/avenger-assemble` when you're stuck, facing a critical decision, or dealing with an incident that needs multiple perspectives simultaneously.

## When to Use

- You're debugging something and can't find the root cause
- You need to make a high-stakes architectural decision
- A P0 is happening and you need immediate coordinated response
- You're planning something complex and want all angles covered before committing
- You're genuinely stuck and one agent's perspective isn't enough

## How It Works

All 7 agents join a single discussion. Each agent speaks from their expertise, challenges the others, and contributes what only they can see. The discussion follows a structured protocol but allows organic debate.

**This is not 7 agents saying the same thing in different words.** Each agent has a specific lens and a specific elicitation technique they apply. The value is in the tension between perspectives.

## Protocol

### Phase 1: Situation Brief (You)

State the problem. Be specific. Include:
- What you're seeing (symptoms)
- What you expected to see
- What you've already tried
- How urgent this is (P0 active incident / P1 blocking work / P2 need direction)

### Phase 2: First Reads (All Agents, Parallel)

Each agent gives their **first read** — their immediate reaction from their specific expertise. No agent waits for another. All 7 speak.

| Agent | Lens | First Question They Ask |
|-------|------|------------------------|
| **Fury** | Blast radius & stakes | "Who is affected? How many? Since when? What changed?" |
| **Strange** | Architecture & root cause | "What's the data flow? Where could this break? Which rules apply?" |
| **Shuri** | User experience & broken promises | "What does the user see? What were they promised? Where's the trust break?" |
| **Stark** | Code path & implementation | "Show me the code path. Which file, which line, which function?" |
| **Widow** | Reproduction & evidence | "Can I reproduce this? What's the test? What evidence do we need?" |
| **Heimdall** | Exit criteria & verification | "What does DONE look like for this fix? What evidence will I need?" |
| **Watcher** | History & pattern matching | "Has this happened before? What does the wiki say? Which incident does this resemble?" |

### Phase 3: Elicitation Deep Dives

Based on the first reads, agents probe deeper using their specialized techniques:

**Fury — The 5 Whys**
Keeps asking "why?" until the root cause surfaces. Refuses to accept the first answer.
```
"The folio shows ₹0."
Why? "The insert returned null."
Why? "The column doesn't exist."
Why? "The migration was moved."
Why? "Nobody checked if it was applied."
Why? → ROOT: No verification step between migration file and production schema.
→ RULE: G-2 (Migration Safety) should have caught this.
```

**Strange — Architecture Trace**
Traces the full data flow from trigger to output. Identifies every junction where the failure could originate.
```
"User clicks checkout → API route → billing-engine.ts:handleCheckout 
→ postFolioItem → supabase.insert() → [FAILURE POINT] → returns null 
→ caller treats null as success → checkout completes with ₹0 folio"
```

**Shuri — Broken Promise Audit**
Maps what the UI promises vs. what actually happens. Identifies where user trust breaks.
```
"Button says 'Complete Checkout' → User expects: invoice with correct amount
→ User gets: blank invoice → Trust break: the button lied.
→ FIX: Button should not be clickable until folio balance is confirmed."
```

**Stark — Code Trace & Fix Proposal**
Reads the actual code, traces the execution path, proposes a specific fix with file paths and line numbers.
```
"billing-engine.ts:89 — insert uses 'as any'. TypeScript can't catch 
the missing column. Remove the cast, add the column via migration 064, 
regenerate types."
```

**Widow — Reproduction Protocol**
Designs the exact steps to reproduce the bug, then runs them.
```
"1. Create test booking → 2. Check in → 3. Add charge of ₹500 
→ 4. Record payment → 5. Click checkout → 6. Check folio balance
→ EXPECTED: ₹500 → ACTUAL: ₹0 → REPRODUCED ✓"
```

**Heimdall — Exit Criteria Lock**
Defines what evidence is required before anyone can claim this is fixed. Locks the criteria BEFORE the fix starts.
```
"This fix is DONE when:
1. DB query shows the column exists in production
2. Playwright test: checkout produces non-zero folio (screenshot)
3. The 'as any' cast is removed from billing-engine.ts
4. Types are regenerated and tsc passes
Until all 4 are met, this is not DONE."
```

**Watcher — Incident Pattern Match**
Searches the wiki for similar incidents. Pulls up the root cause and fix from last time.
```
"This matches wiki/compiled/incidents/folio-zero-2026-04-05.md.
Root cause last time: migration 023 moved to _applied_duplicates/ 
without replacement. Rule D-2 was created from that incident.
CHECK: Was a migration recently modified after being applied?"
```

### Phase 4: Debate & Convergence

Agents challenge each other's proposals:

- **Strange** might say Stark's fix is too narrow — the architecture has a deeper issue
- **Shuri** might say the backend fix isn't enough — the UI needs a guard too
- **Fury** might say the fix is right but the rollout order matters — fix the data first, then the code
- **Heimdall** might reject Stark's "it's just a one-line fix" — evidence requirements don't change based on fix size

The debate continues until the group converges on:
1. **Root cause** (agreed by Strange + Stark + Watcher)
2. **Fix plan** (proposed by Stark, reviewed by Strange)
3. **UX guard** (proposed by Shuri, if applicable)
4. **Test plan** (proposed by Widow)
5. **Exit criteria** (locked by Heimdall)
6. **Blast radius check** (confirmed by Fury)

### Phase 5: Action & Assign

Each agent takes their piece:

| Agent | Action |
|-------|--------|
| Stark | Implements the fix |
| Widow | Runs the reproduction test, then the fix verification test |
| Heimdall | Verifies against the locked exit criteria |
| Watcher | Writes the incident article for the wiki |
| Fury | Checks if a new rule should be created |
| Strange | Reviews if the architecture needs a systemic fix beyond the immediate patch |
| Shuri | Checks if the UX needs a guard to prevent silent failures |

### Phase 6: Retro (Auto-triggered)

After the fix ships and Heimdall files the verdict, the standard [[loop/retro]] fires. If this was a P0, [[loop/incident]] also fires, potentially creating a new rule.

## Elicitation Techniques Reference

Each agent has access to these advanced techniques during Assemble:

| Technique | Used By | How It Works |
|-----------|---------|-------------|
| **5 Whys** | Fury | Ask "why" 5 times to drill past symptoms to root cause |
| **Architecture Trace** | Strange | Follow the data from input to output, marking every junction |
| **Broken Promise Audit** | Shuri | Map UI promises vs. actual outcomes |
| **Code Trace** | Stark | Read actual code paths with file:line citations |
| **Reproduction Protocol** | Widow | Step-by-step reproduction with expected vs. actual at each step |
| **Pre-mortem** | Heimdall | "Assume this fix ships and fails. Why did it fail?" |
| **Pattern Match** | Watcher | Search wiki for incidents with similar symptoms |
| **Devil's Advocate** | Any agent | Deliberately argue against the emerging consensus to stress-test it |
| **Timeboxed Divergence** | Fury (facilitates) | "Everyone has 2 minutes to propose a completely different root cause" |
| **Evidence Escalation** | Heimdall | "That's AUDITED-level evidence. What would make it DONE?" |

## Constraints

- Assemble is not for routine work. Use it when you're genuinely stuck or the stakes are high.
- Every Assemble session must produce at minimum: a root cause statement, a fix plan, and Heimdall's exit criteria.
- Agents must disagree when they see something the others missed. Agreement without tension means someone isn't doing their job.
- The session ends when Heimdall locks the exit criteria and agents are assigned their actions. Not before.
- Watcher documents the session outcome regardless of whether it becomes a formal incident.

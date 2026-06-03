# MISSION: Fix Agent Excellence — The Becky OS Problem Statement

## Status: CORE BUILT — anti-satisficing system shipped; live adversarial validation ongoing
## Priority: FOUNDATIONAL — everything else depends on this

> REPO-SAFE. This is the design rationale behind the anti-satisficing system
> (`core/anti-satisficing-design.md`). It states the problem, the root cause, and the fix.

---

## BUILT

The 4-component anti-satisficing system is live. What shipped:

### 1. Gap-Fill Protocol (prompt-level)
Appended to every agent file (Vision, Fury, Coulson, Loki, Shuri, Strange, Stark, Widow, Heimdall, Watcher, Deadpool, Friday, Xavier, Parker, Quill). Each agent's prompt now ends with a Coverage Self-Check (4 parts) + a Verdict (3 checkboxes) + a non-negotiable continuation instruction.

### 2. Coverage Manifest YAML (machine-checkable minimums)
Each agent file carries a fenced `coverage_manifest:` block of count-based minimums and forbidden phrases. Example: a research agent needs N competitors + N OSS repos + N domain sources + N recommendations-with-tradeoffs + N risks; a test agent needs every route from the sitemap tested; a chaos agent needs every invariant challenged + N chaos scenarios.

### 3. Stop Hook completion gate
- File: `hooks/completion-gate.py`
- Wired via `settings.json` under both `Stop` and `SubagentStop`
- Behavior: identify the active agent → parse the manifest YAML → extract the final assistant output → check the Gap-Fill block is present, the Verdict checkboxes are ticked, no forbidden phrases appear, and every manifest minimum is evidenced → emit `{"decision":"block"}` or `{"decision":"approve"}`
- Gap log: `gaps-log/<agent>-<date>.jsonl` — every blocked turn leaves a trace
- Safety: iteration tracked in `hooks/state.json`, MAX_ITERATIONS=3, fails open on any exception

### 4. PostCompact Re-Injection
- `hooks/pre-compact.py` — before auto-compaction, snapshots the active agent, mandate, manifest, and last 10 gaps
- `hooks/session-start.py` — on `source == "compact"`, reads the snapshot and prepends an "Active Agent Context (post-compact)" section restoring agent identity, anti-satisficing reminders, recent gaps, and the full manifest
- Proves out: an agent mid-way through 5 competitors stays mid-way through 5 competitors after compaction

### Smoke tests passed
- Manifest parser across every agent → all minimums parsed correctly
- `check_output` against 3 scenarios (missing block → block; unticked + forbidden → block; clean → approve) → all verdicts correct
- Post-compact re-injection with a simulated snapshot → all sections restored
- Hook approve/block decisions emit correct JSON

### Self-learning loop (the innovation)
Every Stop Hook block writes to `gaps-log/<agent>-<date>.jsonl`. The Watcher agent, on a cadence, reads these logs and proposes manifest tightening ("6 of the last 10 research runs missed `domain_sources_cited` — raise it from 2 to 3"). You approve or reject. **Becky's "done" bar evolves from her own misses.**

---

## The Problem

Becky's agents are DESIGNED well but EXECUTE poorly. The gap:

### Symptom 1: Satisficing — Finding "Good Enough" and Stopping
A typical run goes in a single line to the goal and tests a fraction of the affected surfaces. The agent finds "enough" and stops. Nobody asks "what else could this touch?" An impact agent was designed to fix this — but the impact agent itself has NO MECHANISM to ensure it keeps digging. What prevents it from finding 5 dependencies and calling it done when there are 13?

### Symptom 2: Premature Convergence
Agents converge on the first reasonable answer. Research is excellent when the prompt forces breadth ("Top 5-8 repos" + "Key patterns" + "Best approach" + "Loop design"). Without that forcing function, an agent finds 2 repos and says "here's what I found."

### Symptom 3: "Let's Continue Next Session" Disease
Agents suggest pausing, deferring, stopping. "Want me to continue?" "Should we pick this up tomorrow?" "This might be better in a fresh context." The excuse culture in AI agent behavior is a DESIGN FLAW, not a context limitation.

### Symptom 4: No Curiosity Drive
LLMs respond to what's ASKED, not what SHOULD be asked. They don't get curious. They don't say "wait, that's interesting — let me dig deeper." They answer the question and stop. Real engineers follow threads. Real QA engineers get suspicious and investigate. Agents don't.

### Symptom 5: Deviation from Mandate
Agents drift. They start their assigned task, find something tangential, and chase it. Or they simplify the task to something easier. Or they redefine "done" to match what they've already produced rather than what was actually needed.

### Symptom 6: No Self-Evaluation of Completeness
No agent asks "am I ACTUALLY done?" with rigor. "I generated use cases" ≠ "I generated ALL use cases." "I tested the feature" ≠ "I tested every surface the feature touches." There's no completion metric, no coverage check, no "what did I miss?" pass.

### Symptom 7: Research-to-Execution Gap
We do great research. Then the execution is mediocre. The research says "domain-aware adversarial hypothesis generation." The execution would be a prompt that says "try to break things." The depth of the research doesn't transfer to the depth of the behavior.

---

## The Root Cause

AI agents are REACTIVE, not DRIVEN. They respond to prompts, not to missions. A human engineer with a mission ("find every bug in the money path") will keep going until they're satisfied. An AI agent with the same prompt produces a reasonable-looking output and stops.

The missing ingredients:
1. **Persistence mechanisms** — forcing agents to keep going past "good enough"
2. **Completeness verification** — measuring whether ALL paths were explored
3. **Curiosity injection** — making agents follow suspicious threads
4. **Anti-deviation guardrails** — keeping agents on their specific mandate
5. **Depth enforcement** — preventing shallow execution of deep research
6. **Self-challenge loops** — agents questioning their own output before finalizing

---

## What We Researched

1. How do the best agent frameworks (AutoGPT, CrewAI, LangGraph, Claude Agent SDK) handle agent persistence and thoroughness?
2. What academic work exists on "satisficing vs maximizing" in LLM agent behavior?
3. What techniques force LLM depth? (chain of thought, tree of thought, reflection loops, MCTS for agents)
4. How do multi-agent systems prevent individual agent deviation?
5. What's the state of the art in agent self-evaluation and completeness checking?
6. Are there prompt-engineering techniques specifically designed for anti-satisficing?
7. Real examples of production agent systems that maintain high quality over long runs.

## What We Built

Agent-level guardrails that make every Becky agent:
- PERSISTENT: keeps going until genuinely done, not "good enough" done
- CURIOUS: follows threads, asks "what else?", investigates anomalies
- COMPLETE: self-verifies coverage, measures what was explored vs what exists
- FOCUSED: stays on mandate, doesn't drift, doesn't simplify
- DEEP: executes at the depth the research/design called for
- HONEST: says "I found 5 of 13" not "I found what I was looking for"

## Research Findings — The Four Components to Build

**1. Coverage Manifests** — machine-checkable minimum requirements per agent.
Not "is this good?" but "does this have 5 competitors?" Count-based, not quality-based.
Every agent gets a `coverage_manifest` in its definition.

**2. Stop Hook Completion Gate** — a Claude Code Stop hook.
External enforcement. The agent cannot bypass it. It checks output against the manifest,
returns a gap list if incomplete → the agent keeps working. Max 3 gap-fill iterations.
Implementation: `hooks/completion-gate.py` + `settings.json`.

**3. Gap-Fill Protocol** — a mandatory self-check block in every agent prompt.
"List what you covered. List what's missing. If the missing list is non-empty, continue."
Free to implement — just edit the agent markdown files.

**4. Context Re-Injection Hook** — a PostCompact hook re-injects the agent mandate + manifest + gap list.
Prevents context rot from erasing the thoroughness requirement.
Implementation: `settings.json` SessionStart with a compact matcher.

### Key Research Sources
- Anthropic's multi-agent research system: hardcodes effort minimums, progressive narrowing
- Reflexion (NeurIPS 2023): produce → critique → gap-fill → re-evaluate
- SWE-Search (ICLR 2025): MCTS with a Value Agent, measurable improvement
- Claude Code hooks docs: the Stop hook is the enforcement mechanism
- Context-rot research: accuracy degrades at 20-30K tokens, steep drop past 50K
- OpenHands SDK: event-sourced checkpointing for agent persistence

### Build Priority
1. Gap-Fill Protocol in agent prompts (fast, free)
2. Coverage Manifests per agent (one section per agent)
3. Stop Hook completion gate (one script + settings)
4. Context Re-Injection hook (one settings edit)
5. Loki critique pass per phase (pipeline change)

---

*"Stopping is a design flaw, not a context limitation."*

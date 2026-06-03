# Anti-Satisficing System — Design Spec

**Status:** DESIGN
**Mission:** `core/mission-agent-excellence.md`
**Research source:** prior-art survey (Anthropic multi-agent research system, Reflexion, SWE-Search, Claude Code Stop hook)

> REPO-SAFE. Paths below use the public layout (`core/`, `agents/`, `hooks/`). Adapt to your repo.

---

## The Core Insight

Agents don't stop because they think they're done. They stop because nothing is MAKING them continue. The fix is not "better prompts." The fix is **external enforcement** + **measurable completeness** + **context-rot immunity** + **self-learning coverage**.

Four components. Each one alone is weak. Together they compound.

```
┌────────────────────────────────────────────────────────────────┐
│                      THE 4-COMPONENT STACK                     │
│                                                                │
│  [1] Coverage Manifest  ─────→  defines "done"                 │
│         │                        (count-based, machine-checkable)│
│         ↓                                                      │
│  [2] Gap-Fill Protocol  ─────→  forces self-audit before stop  │
│         │                        (agent-internal discipline)   │
│         ↓                                                      │
│  [3] Stop Hook Gate     ─────→  external enforcement           │
│         │                        (agent CANNOT bypass)         │
│         ↓                                                      │
│  [4] Context Re-Injection → survives compaction                │
│                              (thoroughness never forgotten)    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

                              ▲
                              │ (The innovation layer)
                              │
                    ┌─────────┴──────────┐
                    │  SELF-LEARNING     │
                    │  COVERAGE LOOP     │
                    └────────────────────┘

   Every gap an agent hits becomes a NEW coverage requirement
   for the next run. Becky learns what "thorough" means from
   her own misses. Gaps → manifest updates → knowledge base.
```

---

## Component 1: Coverage Manifest

A YAML block in each agent's frontmatter. Count-based, not quality-based.

**Format:**
```yaml
coverage_manifest:
  mode: <mode_name>                  # e.g. "greenfield_research", "per_story_build"
  minimum:
    - key: competitors_scanned
      count: 5
      evidence: "research.md section 'Competitor Scan'"
    - key: oss_repos_analyzed
      count: 3
      evidence: "research.md section 'OSS Discovery' with star counts"
    - key: recommendations_with_tradeoffs
      count: 1
      evidence: "research.md section 'Recommendations' with at least one tradeoff per option"
  forbidden_endings:
    - "want me to continue"
    - "in the next session"
    - "will pick this up"
    - "for now"                      # scoping language disguised as humility
  stop_requires:
    - gap_fill_block_present: true
    - all_minimums_met: true
```

**Why counts, not quality:** quality is subjective, counts are verifiable. "Did Vision find 5 competitors?" is grep-able. "Was the research good?" isn't.

**Why `forbidden_endings`:** the satisficing phrases are literal linguistic tells. A regex catches them.

**Why `evidence` pointers:** the Stop Hook needs to know WHERE to look, not just WHAT to look for.

---

## Component 2: Gap-Fill Protocol

A mandatory prompt block in every agent file. Agent self-audits before stopping.

**Universal block (appended to every agent's identity section):**
```markdown
## The Gap-Fill Protocol (NON-NEGOTIABLE)

Before you stop, you MUST produce this block in your final output:

### Coverage Self-Check
- **What I covered:** <list every item that meets a manifest minimum, with evidence pointers>
- **What I did NOT cover:** <list every manifest minimum not yet met>
- **What surprised me:** <anomalies, dead ends, suspicious findings that deserve follow-up>
- **What I deliberately excluded:** <items out of scope, with a one-line reason each>

### Verdict
- [ ] All coverage manifest minimums met? (If any `minimum[].count` unmet → CONTINUE)
- [ ] Zero forbidden_endings phrases in output? (If any present → REWRITE)
- [ ] Every "What surprised me" item either investigated OR filed as a follow-up? (If unresolved → INVESTIGATE)

If ANY checkbox is unticked, you are NOT done. Continue. Do not ask permission. Do not defer. Do not rephrase incompleteness as "next session."
```

Reflexion-style: produce → critique → gap-fill → re-evaluate. The reason it works is the agent has to TYPE the gap list, which defeats the "good enough" reflex.

---

## Component 3: Stop Hook Completion Gate

External enforcement. The agent cannot skip this — Claude Code runs it on the Stop event regardless of what the agent decided.

**Script:** `hooks/completion-gate.py`

**Responsibilities:**
1. Identify the active agent (from transcript: last `Task({subagent_type: X})`)
2. Load `agents/<agent>.md` → parse `coverage_manifest`
3. Scan the agent's final output (from transcript) for:
   - Gap-Fill block present (regex for `### Coverage Self-Check`)
   - Evidence pointers match reality (file exists? section contains N items?)
   - No `forbidden_endings` substrings
4. **Decision matrix:**

| Check | Result | Action |
|---|---|---|
| Gap-Fill block missing | FAIL | Return `{decision: "block", reason: "Agent stopped without Gap-Fill block"}` |
| Minimum counts unmet | FAIL | Return `{decision: "block", reason: "coverage gap: <missing items>"}` |
| Forbidden ending present | FAIL | Return `{decision: "block", reason: "satisficing phrase detected: <phrase>"}` |
| All checks pass | OK | Return `{decision: "approve"}` |

5. **Iteration cap:** track `gap_fill_iterations` in `hooks/state.json`. Max 3. On the 3rd iteration, escalate: log it, leave the gap list in `gaps-log/`, approve stop. Manual review required.

**Wired via:** `settings.json` Stop hook. Subagents inherit the matcher.

**Hook output contract:** Claude Code's Stop hook can return JSON `{decision, reason}` — `block` prevents stop and passes the reason back to the agent. The agent continues with the reason visible.

---

## Component 4: Context Re-Injection

Agents forget their mandate at ~30K tokens. Compaction is the usual time this happens.

**Script changes:** extend the existing `hooks/pre-compact.py` and add a SessionStart-with-compact-matcher handler.

**What gets captured on PreCompact:**
- Active agent name
- Full `coverage_manifest` for that agent
- Current gap list (running tally of unmet minimums)
- Current mandate (first assistant message after agent spawn)

Written to `hooks/active-agent-context.json`.

**What gets re-injected on SessionStart post-compact:**
- A terse header: "RESUMING AGENT: <name>. MANDATE: <1-liner>. UNMET: <gap list>."
- Pointer: "Re-read `agents/<name>.md` for full protocol."

This is the context-rot antidote. Research says accuracy degrades past 20-30K tokens. We refresh the thoroughness requirement every compaction.

---

## THE INNOVATION LAYER — Self-Learning Coverage Loop

This is what makes the system more than a collection of guardrails.

**The loop:**
```
1. Agent runs. Hits a gap. Gap-Fill catches it. Agent continues.
   ↓
2. When the agent finally stops, the Stop Hook logs the iteration history:
   - Which minimums were initially missed?
   - What caused the miss? (missing tool? unclear scope? premature convergence?)
   ↓
3. Watcher reads the gap log on a cadence. Writes a pattern article:
   knowledge/patterns/agent-miss-patterns.md
   ↓
4. Recurring misses become NEW MANIFEST MINIMUMS.
   Example: if Vision misses "academic papers" in 3 of 5 runs,
   add `academic_papers_reviewed: ≥2` to his manifest.
   ↓
5. The manifest evolves. Becky gets harder to satisfice against over time.
```

**Why this is novel:** every agent framework we surveyed treats "thoroughness" as a fixed prompt. Nobody lets the definition of "thorough" EVOLVE based on observed misses. Becky's coverage requirements are a LIVING DOCUMENT, updated by the Watcher, synced to the knowledge base, and loaded into every subsequent run.

**Where it lives:**
- Gap logs: `gaps-log/<agent>-<date>.jsonl`
- Pattern analysis: `knowledge/patterns/agent-miss-patterns.md`
- Manifest updates: commits to `agents/*.md` with message `feat(manifests): tighten <agent> based on observed misses`

---

## Sync to the Knowledge Base

Every change to this system writes to the knowledge base:

1. **This design doc** → summarized as `knowledge/concepts/anti-satisficing-system.md`
2. **Every Stop Hook block event** → appended to `knowledge/patterns/agent-miss-patterns.md` (periodic rollup by Watcher)
3. **Every manifest tightening** → an ADR-style entry in `knowledge/decisions/manifest-evolution.md`
4. **The memory index** gets a pointer to this system

The knowledge base is both input AND output of the system. Becky's learning compounds.

---

## Rollout Order

1. Write this design doc ✅
2. Add the Gap-Fill Protocol block + Coverage Manifest to every agent file
3. Build `completion-gate.py` and wire it via `settings.json`
4. Extend `pre-compact.py` + add a SessionStart compact-matcher
5. Dry run: spawn Deadpool on a real surface → observe Stop Hook behavior
6. Dry run: spawn Friday on a real commit → observe manifest enforcement
7. Write the knowledge-base concept article + update the memory index
8. Commit on a feature branch, open a PR

---

## Success Criteria

The system works if:
- An agent cannot stop without producing the Gap-Fill block (external enforcement)
- Deadpool, run against a surface with N test points, does NOT stop after a partial pass
- Friday, run against a real commit, produces use cases for EVERY affected surface
- After compaction, the agent still knows its manifest
- Watcher can point at real gap-log entries and propose manifest updates

It's failing if:
- Agents still say "want me to continue?"
- Surfaces still get missed
- Manifests never evolve
- The knowledge base stays static

---

*"Stopping is a design flaw, not a context limitation."*

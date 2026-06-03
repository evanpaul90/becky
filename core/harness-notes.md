# The Claude Code Harness — what Becky runs on

> Becky is a *specialized harness* built on top of Claude Code's harness. Knowing the substrate makes
> Becky better. Sources: Thariq Shihipar (@trq212, Anthropic) "a harness for every task: dynamic
> workflows" + code.claude.com/docs (workflows, glossary, agent-teams, hooks). Pulled 2026-06-03. REPO-SAFE.

## What a harness is
*"The tools, context management, and execution environment that turn a language model into a capable
agent. Claude Code is the harness; Claude is the model inside it."* Becky adds a domain harness on top —
named agents, the SDLC, the modes, the Done Oracle. Dynamic workflows let Claude **write its own harness
on the fly** for a task.

## The agentic loop
gather context → act → verify → repeat until done. Hooks, skills, and MCP plug into phases of this loop.
Becky's 14-phase SDLC is a structured, named instance of this loop.

## Dynamic workflows (what `becky-loop-premortem` and the modes use)
A JS script the runtime runs in the background, orchestrating subagents at scale. The **plan lives in
code, not in turn-by-turn context** — intermediate results stay in script variables, so the main context
holds only the final answer. Patterns: classify-and-act · fan-out-and-synthesize · **adversarial
verification** · tournament · **loop-until-done**. Caps: 16 concurrent / 1000 total agents; no FS/shell
from the script (agents do that); resumable within the same session. Save to `.claude/workflows/` →
becomes a `/command`.

**Why Anthropic built them — and why it validates Becky:** dynamic workflows exist to mitigate
**agentic laziness** (stops after partial progress), **self-preferential bias** (an agent prefers its own
result when asked to verify it), and **goal drift** (loss of fidelity after compaction). The structural
fix is *separate subagents with isolated context*. That is **exactly** Becky's builder≠verifier invariant
and the pre-mortem's ORC-10 / SM-08 / L13. We converged on Anthropic's own reasoning.

## Verification loop == Becky's Done Oracle
Glossary, verbatim: *"How a session knows the work is actually done rather than just plausible… iterate
until the check passes instead of stopping after one attempt. A verification loop is the prerequisite for
`/goal`, unattended runs, and dynamic workflows: without one, the only thing deciding the agent is
finished is the agent itself."* → `done-oracle.md` IS Becky's verification loop. Anthropic names it the
prerequisite for unattended runs; we built it.

## Primitives Becky should use more of
- **Agent teams** (experimental, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`): peer sessions with their own
  context, a shared task list, and direct messaging — plus `TeammateIdle` / `TaskCreated` / `TaskCompleted`
  hooks for quality gates. → **War Room could become a real agent team** (genuine peer debate) instead of role-play.
- **Hooks** (deterministic lifecycle handlers; shell / HTTP / MCP / LLM / subagent): `PreToolUse` (the
  Heimdall verdict gate), `Stop` (the Gap-Fill block), `SessionStart` + pre-compact (loop-state persistence, L29).
- **Channels** (Telegram / Discord / iMessage push events into a running session): the always-on layer
  for `sentinel` — a real harness primitive, not a bespoke bridge.
- **`/goal` + `/loop`**: completion-gated repeated execution; pair them with the Done Oracle for hands-off `deliver`.
- **Worktree isolation** (`isolation: worktree`): parallel agents on separate branches — `migrate` mode's mechanism.

## Constraints that shape Becky's design
- **Auto memory:** only the **first 200 lines / 25 KB** of `MEMORY.md` loads each session → keep the index
  under both (the memory-index tool enforces the byte ceiling; also stay < 200 entries). Auto memory +
  project-root CLAUDE.md survive compaction and reload from disk; **instructions given only in
  conversation can be lost** → persist loop state to disk (L29).
- Workflow scripts can't use `Date.now`/`Math.random` (would break resume) and have no FS/shell.

## The one-line takeaway
Claude Code gave us the primitives (harness, dynamic workflows, subagents, hooks, verification loop).
Becky is the opinionated, domain-owned, scar-hardened harness assembled from them — and the parts
Anthropic says matter most (independent verification, isolated-context subagents) are the parts we leaned on hardest.

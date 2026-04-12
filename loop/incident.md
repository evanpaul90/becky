# Incident — After Every P0

Fires when a P0 incident occurs. This is the closed learning loop: incident → root cause → new rule → automated enforcement → recompile.

## Trigger

- Any P0 bug discovered in production
- Any P0 process violation (e.g., AUDITED reported as DONE)
- Can be manually invoked for P1 incidents worth formalizing

## Process

### 1. Root Cause

Answer with specifics:
- **What happened?** Observable symptoms.
- **What was the direct cause?** The code/config/process that failed.
- **What was the systemic cause?** Why did the direct cause exist? What allowed it to ship?
- **What prevented detection?** Why didn't tests/lint/review catch it?

### 2. Rule

Draft a new rule for `core/rules/`:

```yaml
---
id: "X-N"                    # Next available ID in the appropriate category
title: "..."
severity: "P0"
origin: "incident"
incident_ref: "date + commit hash + one-line description"
enforcement: "..."            # How will this be automatically enforced?
scope: "all"
---
```

The rule body must include:
- The rule itself (imperative, unambiguous)
- Why it exists (what went wrong)
- Good/bad examples
- Enforcement mechanism

### 3. Automate

If possible, add automated enforcement:
- **ESLint rule**: For code patterns that should never appear
- **Pre-commit hook**: For checks that should run before every commit
- **CI check**: For checks that require a build or test run
- **Compiler check**: For contradictions or stale references in rules/agents

If automation isn't possible, the rule is enforced manually by the [[heimdall]] during verification.

### 4. Recompile

Run `compile.ts` to regenerate CLAUDE.md and AGENTS.md with the new rule. Both runtimes immediately enforce the new guardrail.

### 5. File

The incident produces:
- A new rule in `core/rules/`
- A wiki article in `wiki/raw/` (→ [[watcher]] compiles to `wiki/compiled/incidents/`)
- An update to `memory/project/` with the incident context
- (If automated) a new ESLint rule, hook, or CI check

## The promise

Every P0 makes the system stronger. The same shape of failure should never ship twice. This is the compound interest of Becky's learning loop.

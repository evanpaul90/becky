# Greenfield Mode

Use this mode when building something new — a new product, a new feature area, a new module with no existing code.

Greenfield opens with **discovery** (what are we building?) and proceeds through a fixed pipeline. Each step has an owning agent and produces artifacts that the next step consumes.

## Pipeline

| Step | Agent | Produces | Gate |
|------|-------|----------|------|
| 1. Discovery | [[fury]] | Product brief | Founder approves brief |
| 2. UX Design | [[shuri]] | UX specification | Fury confirms FR coverage |
| 3. Architecture | [[strange]] | Architecture doc, ADRs, data model | Fury + Shuri confirm alignment |
| 4. Stories | [[fury]] | Epics and stories list | Readiness check passes |
| 5. Implementation | [[stark]] | Code + tests | Tests pass, push checklist clean |
| 6. Testing | [[widow]] | Test report with evidence | All critical paths covered |
| 7. Verification | [[heimdall]] | Verdict (DONE/VERIFIED/AUDITED) | Verdict filed |
| 8. Knowledge | [[watcher]] | Wiki articles | Index updated |

## Gates

Each step has a gate — a condition that must be met before the next step starts. Gates prevent the pipeline from flowing downstream with incomplete work.

- **Brief approved**: The founder has read the brief and confirmed direction. Not "PM thinks it's good."
- **FR coverage**: Every functional requirement in the PRD has a home in the UX spec.
- **Alignment**: PRD + UX + Architecture all agree on scope, data model, and user journeys.

- **Readiness**: Implementation readiness check confirms no gaps between planning artifacts and stories.
- **Tests pass**: Full test suite green. Push checklist satisfied.
- **Critical paths covered**: Golden path + top 3 error paths tested with evidence.
- **Verdict filed**: Heimdall has emitted a structured verdict per [[anti-inflation]].
- **Index updated**: Watcher has compiled knowledge from the completed work.

## Iteration

If a gate fails, the pipeline does not proceed. The failing agent's work goes back to the responsible upstream agent:
- UX gap → back to Fury (PRD missing an FR)
- Architecture gap → back to Shuri (screen spec implies data that wasn't modeled)
- Implementation gap → back to Strange (API contract doesn't support the FR)
- Verification fails → back to Stark (evidence insufficient for claimed tier)

## Learning loop

After step 8, the [[loop/retro]] fires. The retro produces:
- What worked, what didn't
- Rule candidates (if an incident occurred, → `core/rules/`)
- Wiki article via [[watcher]]

The retro output feeds back into the system's knowledge, making the next greenfield cycle better.

# Becky Modes — the entry points, on one page

> Every way you start Becky, what it loops on, and how it knows it's done. The loop modes all
> terminate on `core/done-oracle.md` (independent runtime verification — never self-report).
> Agents and pipeline: `core/sdlc.md`. Scars each gate: `core/lessons-ledger.md`. REPO-SAFE.

## The autonomy spectrum (borrowed vocabulary, our verification)
- **Gated** — run one phase, stop at the gate, human approves (`run` / `approve` / `revise`).
- **Autopilot** — run all phases unattended, one pass (`autopilot`).
- **Loop-until-delivered** — autopilot + the Done Oracle as the termination predicate + failure self-routing.
- **Ambient** — standing, scheduled; acts on a signal; risky actions human-gated (`sentinel`).

## Build / fix modes
| Mode | Starts | Loop? | Stops when |
|---|---|---|---|
| `greenfield <name>` | new build, 14-phase SDLC | gated/autopilot | phases complete, gates passed |
| `brownfield <problem>` | fix/extend, 11-phase | gated/autopilot | bug fixed + verified |
| `deliver <task>` ⭐ | greenfield/brownfield, **looped** | **loop-until-delivered** | **Done Oracle GREEN** (every AC DONE w/ runtime proof) or honest budget-stop |
| `design <name>` | UX/redesign pipeline | gated | design spec + baselines done |

## Quality / hardening loops
| Mode | Starts | Loop? | Stops when |
|---|---|---|---|
| `hunt <surface>` | adversarial bug hunt (Deadpool+Widow) | loop-until-dry | K dry rounds (no new CONFIRMED bug) |
| `harden <target>` | security/invariant campaign | loop-until-dry | K dry rounds (no new weakness) |
| `test` | the testing campaign | loop | coverage manifest satisfied |
| `migrate <change>` | work-list transform, worktree-isolated | loop-per-site | every site DONE + verified (N/N) |

## Watch / survey
| Mode | Starts | Loop? | Stops when |
|---|---|---|---|
| `sentinel <signal>` | always-on watcher (cron) | **ambient** | per-run: signal clear; risky actions escalated, never auto-taken |
| `scan` / `triage` | platform-wide scan → classify → fix | loop | nothing new found |

## Convene
| Mode | Starts | Stops when |
|---|---|---|
| `warroom <problem>` | all agents on one hard problem (was `assemble`) | convergence + exit criteria locked to the Done Oracle |
| `retro [slug]` | retrospective on a finished task | lessons captured by Watcher |

## The throughline
Every loop above stops on **independent, runtime-grounded verification**, not on an agent saying "done."
A secondary budget/iteration cap can stop a loop early — and when it does, the loop reports *exactly what
is still red*, never a false "delivered." That honesty is the whole point (and the industry's open wound).

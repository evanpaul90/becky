# Agent Programs — the 13 operating contracts

> Karpathy's `program.md` discipline: an agent's behaviour is described in **English**, not buried
> in code. Each file here is one agent's contract — **one job, one owned artifact, one outcome**,
> the ledger rows it gates, its handoff, and a Gap-Fill stop-block. Same shape for all 13 so the
> whole council fits in your head. Authoritative pipeline: `core/sdlc.md`. Scars each agent
> gates: `core/lessons-ledger.md`. REPO-SAFE: no personal content, ever.

| Phase | Agent | The one job | Owned artifact |
|---|---|---|---|
| 1 Research | [Vision](vision.md) | Find what already exists in the world | `research.md` |
| 2 Discovery | [Fury](fury.md) | Find the real problem (why, not what) | `brief.md` |
| 3 / 8 Requirements & Stories | [Coulson](coulson.md) | Turn the brief into testable requirements + stories | `prd.md`, `stories.md` |
| 1·3·4·5·6·11 Domain (cross-cut) | [Xavier](xavier.md) | Be the domain — nothing is guessed | `domain-brief.md`, behavior matrices |
| 4 / 10 Adversarial review | [Loki](loki.md) | Red-team the PRD, then the code | `review-findings.md`, `code-review.md` |
| 5 Experience design | [Shuri](shuri.md) | Design every state, from the system of record | `ux-spec.md` + visual baselines |
| 6 Architecture | [Strange](strange.md) | Data models & contracts, verified against the live DB | `architecture.md`, ADRs |
| 9 Impact (cross-cut, per diff) | [Friday](friday.md) | Trace the blast radius of every change | `impact-map.json`, `use-case-library.md` |
| 7 / 12 Gate | [Heimdall](heimdall.md) | Readiness before build; the verdict after test | `readiness-report.md`, `verdict.yaml` |
| 9 Build | [Stark](stark.md) | Build per-story, fail loud, read the spec first | implementation + notes |
| 11 Chaos | [Deadpool](deadpool.md) | Break it on purpose, hypothesis-driven | `chaos-report.md` |
| 9·11 Test | [Widow](widow.md) | Test like a human against the live surface | `test-report.md` + issues |
| 12 + continuous | [Watcher](watcher.md) | Turn outcomes into durable knowledge | wiki + ledger rows |
| 13 Documentation | [Parker](parker.md) | Make the shipped change followable in 5 minutes | `docs/`, guides |
| 14 Announcement | [Quill](quill.md) | Tell the world what actually shipped | release notes, announcements |

**The two invariants** (see sdlc.md): the agent that builds never certifies its own build; every
scar in the ledger is owned by exactly one stage, so a new incident makes the system harder to break.

---
id: "U-2"
title: "Critical UI surfaces must be stage-driven"
severity: "P0"
origin: "design"
incident_ref: ""
enforcement: "manual"
scope: "all"
---

# Stage-Driven UI

Critical UI panels (e.g., guest stay, order management, workflow dashboards) must be **stage-driven, not data-driven**. Each lifecycle stage defines which sections are visible and which are hidden.

## Pattern

Define a visibility table:

| Stage | Visible Sections | Hidden Sections |
|-------|-----------------|-----------------|
| `stage_a` | Header, Form A, CTA | Summary, History |
| `stage_b` | Header, Summary, Actions | Form A |
| `stage_c` | Header, Summary (read-only) | Form A, Actions |

Then enforce it:
- If a section isn't in the "Visible" column for the current stage, it MUST NOT render.
- Violation of the visibility table is a P0 bug.
- Status comes from the database column, never derived from computed values.
- The "Next Action" bar shows exactly one CTA for the current state.

## Why

Without a visibility table, UI panels accumulate conditional logic until nobody can predict what renders when. The table is the contract between PM and Dev — verifiable, diffable, testable.

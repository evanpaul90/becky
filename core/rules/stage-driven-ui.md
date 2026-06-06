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

Critical UI panels (e.g., order detail, subscription management, workflow dashboards) must be **stage-driven, not data-driven**. Render sections from an explicit lifecycle stage — never derive state from data presence. Each lifecycle stage defines which sections are visible and which are hidden.

## Pattern

Define a visibility table keyed by the explicit lifecycle stage. Example, an order panel:

| Stage | Visible Sections | Hidden Sections |
|-------|-----------------|-----------------|
| `draft` | Header, Edit form, "Submit" CTA | Line-item summary, Payment, History |
| `active` | Header, Line-item summary, Payments, Actions | Edit form |
| `closed` | Header, Line-item summary (read-only), Invoice actions | Edit form, Actions, Payment entry |

Then enforce it:
- If a section isn't in the "Visible" column for the current stage, it MUST NOT render.
- Violation of the visibility table is a P0 bug.
- The stage comes from the database status column, never derived from computed values. (e.g., never infer "closed" from `balance === 0` or from the existence of a related record.)
- The "Next Action" bar shows exactly one CTA for the current state.

## Why

Without a visibility table, UI panels accumulate conditional logic until nobody can predict what renders when. The table is the contract between PM and Dev — verifiable, diffable, testable.

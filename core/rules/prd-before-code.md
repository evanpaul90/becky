---
id: "P-2"
title: "Read the PRD before building"
severity: "P1"
origin: "design"
incident_ref: ""
enforcement: "manual"
scope: "stark,widow"
---

# PRD Before Code

Before implementing any story, Stark and Widow MUST read:
1. The story specification
2. The referenced functional requirements in the PRD
3. The UX spec for the affected surface
4. The architecture doc for the affected module

If implementation contradicts the PRD, the PRD wins. If the PRD is wrong, update the PRD first, then implement. Never improvise from assumptions.

This rule exists because agents that skip the PRD consistently ship features that pass their own self-assessment but fail the founder's acceptance criteria — they build what seems reasonable rather than what was specified.

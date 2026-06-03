Create a new design/redesign task with the Ultrathink Design pipeline.

The task name is: $ARGUMENTS

If no task name was provided, ask: "Usage: /becky-design <describe what you're designing>"

## Overview

The Ultrathink Design pipeline is a closed loop most teams never build. Shuri designs in a design tool
with a full design system. Loki critiques before any code is written. Stark builds with per-screen visual
fidelity checks. Widow compares every implementation against the mockup — auto-fix until they match. Both
themes. All 4 states. Zero drift.

Throughout this pipeline, "the design tool" means whatever generative/structured design environment you
use (e.g. a Stitch or Figma project) that can emit HTML/CSS for a screen and hold a shared design-system
spec.

## The Pipeline: 8 Phases

```
Shuri (system) → Shuri (screens) → Loki (critique) → Strange (architecture) → Stark+Widow (build+VFL) → Widow (accessibility) → Widow (baselines) → Heimdall+Watcher
```

Create `tasks/<slug>/_task.yaml`:
```yaml
task: "<task name>"
slug: "<slug>"
mode: design
pipeline: ultrathink-design
created: "<today>"
status: phase-0-design-system
current_agent: shuri
phases:
  0-design-system:
    agent: shuri
    subagent: shuri-designer
    status: active
    gate: "Design system created with full design-system spec, tokens match project"
    outputs: []
  1-screen-generation:
    agent: shuri
    subagent: shuri-designer
    status: pending
    gate: "All screens generated with all 4 states, desktop + mobile"
    outputs: []
  2-design-critique:
    agent: loki
    subagent: loki-design-reviewer
    status: pending
    gate: "Zero MUST FIX findings, all states verified, accessibility pre-checked"
    outputs: []
  3-component-architecture:
    agent: strange
    subagent: strange-architect
    status: pending
    gate: "Component map complete, routes defined, component-library mapping done"
    outputs: []
  4-build-with-vfl:
    agent: stark + widow
    subagent: stark-builder
    status: pending
    gate: "All screens implemented, all above 90% visual fidelity, both themes"
    outputs: []
  5-accessibility:
    agent: widow
    subagent: widow-tester
    status: pending
    gate: "WCAG AA passed, keyboard nav verified, both themes"
    outputs: []
  6-regression-baselines:
    agent: widow
    subagent: widow-visual-fidelity
    status: pending
    gate: "Playwright screenshot baselines saved for every screen, every state, both themes"
    outputs: []
  7-verify-learn:
    agent: heimdall + watcher
    subagent: heimdall-gatekeeper
    status: pending
    gate: "Verdict filed, design knowledge extracted"
    outputs: []
autopilot: false
visual_fidelity_threshold: 90
four_state_mandate: true
dual_theme_mandate: true
```

## Phase Details

### Phase 0: Design System Setup (Shuri)
Spawn `shuri-designer`. Shuri creates the design-tool project and the design system with a full
design-system spec containing brand rules, component conventions, state conventions, accessibility
requirements. This spec is the BRAIN — everything the design tool needs to know about how the product
looks.

**HUMAN CHECKPOINT:** Autopilot pauses here. Review the design system tokens and sample components.
`/becky-approve` to proceed.

### Phase 1: Screen Generation (Shuri)
Spawn `shuri-designer` again. Shuri generates ALL screens:
- Each screen in success state (DESKTOP + MOBILE)
- Each screen's loading state (skeleton variants)
- Each screen's empty state (illustration + CTA variants)
- Each screen's error state (error + retry variants)

4 states × 2 devices = 8 screens per feature screen.

**HUMAN CHECKPOINT:** Autopilot pauses here. Review ALL mockups. This is the design review.
`/becky-approve` to proceed.

### Phase 2: Design Critique (Loki)
Spawn `loki-design-reviewer`. Loki reviews all designs for:
- Consistency across screens
- Accessibility pre-check (contrast, touch targets, color-alone)
- State completeness (all 4 for every screen)
- Broken promises (UI promises vs what could happen)
- Responsive sanity

If MUST FIX findings → return to Shuri for revisions.

### Phase 3: Component Architecture (Strange)
Spawn `strange-architect`. Strange maps:
- Each generated screen to a route (e.g. `/dashboard/<feature>`)
- Each visual element to a component-library component (or a new component if needed)
- Component hierarchy (page → layout → sections → components)
- Data requirements per component (API routes, DB queries)
- Theme token mapping (design-tool tokens → CSS variables)

### Phase 4: Build with Visual Fidelity Loop (Stark + Widow)

THIS IS THE INNOVATION. For EACH screen:

1. **Stark builds** the component from:
   - the design tool's exported HTML (per screen)
   - Strange's component map
   - the component library

2. **Widow checks visual fidelity** (spawn `widow-visual-fidelity`):
   - Screenshots the implementation via Playwright
   - Compares against the design-tool mockup
   - Scores fidelity (structural + visual + theme)
   - If < 90% → returns to Stark with a diff report
   - If ≥ 90% → PASS, move to next screen

3. **Both themes verified per screen**

4. **All 4 states verified per screen**

The loop: Build → Screenshot → Compare → Fix → Re-screenshot → Compare → Pass → Next screen.

No screen moves forward until it visually matches the design.

### Phase 5: Accessibility (Widow)
Spawn `widow-tester` with Playwright MCP:
- Tab through every screen — verify focus order is logical
- Check color contrast in both themes (automated via Playwright evaluate + axe-core)
- Verify screen reader announcements (aria-labels, roles, live regions)
- Check keyboard-only navigation for all interactions

### Phase 6: Regression Baselines (Widow)
Spawn `widow-visual-fidelity`:
- Screenshot every screen, every state, both themes
- Save as Playwright baseline files
- These become PERMANENT regression guards
- Any future code change that alters these screenshots triggers a visual diff
- Store at `tests/visual-baselines/<feature>/`

### Phase 7: Verify + Learn (Heimdall + Watcher)
Spawn `heimdall-gatekeeper`:
- Visual fidelity report: all screens ≥ 90%?
- Accessibility: WCAG AA passed?
- State completeness: all 4 states for every screen?
- Both themes: verified?
- Baselines: saved?

Spawn `watcher-chronicler`:
- Design decisions documented
- Component patterns catalogued
- Visual fidelity loop lessons recorded
- Design system tokens documented for future screens

## What Makes This Powerful

1. **Closed-loop visual fidelity** — Mockup → Build → Screenshot → Compare → Auto-fix. Few teams automate this.
2. **4-state mandate** — Every screen designed in success, loading, error, empty BEFORE coding.
3. **Dual-theme from Day 1** — Both themes verified per screen, not as an afterthought.
4. **Design critique BEFORE code** — Loki catches accessibility and consistency issues when they're cheap
   to fix (in the design tool), not expensive (in code).
5. **Permanent regression baselines** — Every passing screen becomes a visual test that runs forever.
6. **Design-system spec as single source** — Brand rules, component conventions, state patterns — all in
   one spec the design tool reads before generating ANYTHING.

## Step 1: Create task structure and begin Phase 0

Create the folder structure with 8 phase directories. Create `_task.yaml`. Then spawn `shuri-designer`
for Phase 0 (Design System Setup).

After Phase 0 completes, show the design system and say:
"Shuri has set up the design system. Review the tokens and sample components. `/becky-approve` to start
generating screens."

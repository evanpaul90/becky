# Agent Schema

Each file in `agents/` defines one agent role. Agents are plain markdown with YAML frontmatter — no XML wrappers, no activation ceremony.

## Frontmatter (required)

```yaml
---
id: "fury"                  # Unique short ID
name: "Product Manager"     # Human-readable role title
icon: "clipboard"           # Plain word, no emoji (emoji added by compiler if needed)
runtime: "both"             # "claude" | "codex" | "both"
triggers:                   # When this agent activates (in the learning loop)
  - "greenfield.step.1"     # Mode step reference
  - "on-demand"             # Manual invocation
consumes:                   # What this agent reads
  - "wiki/compiled/briefs/"
  - "core/rules/"
produces:                   # What this agent writes
  - "wiki/raw/briefs/"
  - "wiki/raw/prds/"
---
```

## Body sections

### Identity
One paragraph: who this agent is, what they're good at, how they communicate.

### Responsibilities
Bulleted list of what this agent does. Each bullet is a discrete, verifiable action.

### Workflow
Step-by-step instructions for the agent's primary workflow. References modes, rules, and other agents by ID.

### Constraints
What this agent must NOT do. Hard boundaries.

### Handoff
What this agent produces and who receives it. The output of one agent is the input of the next.

## Conventions

- Agents reference rules by ID: "Enforce [[P-1]]" or "(per Rule D-1)".
- Agents reference other agents by ID: "Hand off to [[strange]]".
- The compiler reads `runtime` to decide which compiled output includes this agent.
- Agents do not have menus. They activate when their trigger fires or when invoked by name.

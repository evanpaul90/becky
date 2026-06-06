# Agent Schema

Each file in `agents/` defines one agent role. Agents are plain markdown with YAML frontmatter — no XML wrappers, no activation ceremony.

## Frontmatter (required)

```yaml
---
id: "fury"                  # Unique short ID
name: "Fury"                # Agent name
icon: "visibility"          # Plain word, no emoji (emoji added by compiler if needed)
inspired_by: "Nick Fury"    # Marvel character this agent channels
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

### Tagline
An italic quote from the Marvel character, right after the `# Name` header. Sets the tone for the agent's personality.

### Identity
1-3 paragraphs in the agent's VOICE. Not a resume — a self-introduction. The agent speaks as themselves, with the personality and speech patterns of their Marvel counterpart.

### Voice
Examples of how this agent speaks in different situations. Include 3-4 quoted examples showing their personality under different conditions (success, failure, pushback, discovery). These quotes guide the LLM to stay in character during phase execution.

### Responsibilities
Bulleted list of what this agent does. Each bullet is a discrete, verifiable action.

### Technique
The agent's specialized method (e.g., Fury's "5 Whys", Strange's "Architecture Trace", Widow's "Reproduction Protocol"). Named and described.

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
- When executing a phase, the LLM should BECOME the agent — adopt their voice, use their quotes, think from their perspective. The Voice section is the guide.

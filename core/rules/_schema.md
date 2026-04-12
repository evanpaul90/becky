# Rule Schema

Every file in `core/rules/` is a single guardrail. Rules are the source of truth — CLAUDE.md and AGENTS.md are compiled from them.

## Frontmatter (required)

```yaml
---
id: "D-1"                          # Unique ID. Prefix: D=database, R=read-safety, F=financial, U=ui, P=process, G=general
title: "No as-any on Supabase ops"  # One-line title
severity: "P0"                      # P0 = violation is a production incident. P1 = violation is a bug. P2 = advisory.
origin: "incident"                  # "incident" (born from a real failure) or "design" (preventive)
incident_ref: ""                    # If origin=incident: commit hash, date, or issue number
enforcement: "eslint"               # "eslint" | "hook" | "ci" | "manual" | "compiler"
scope: "all"                        # "all" | "claude" | "codex" | comma-separated agent names
---
```

## Body

The body is plain markdown. It should contain:

1. **The rule itself** — clear, imperative, unambiguous
2. **Why it exists** — what went wrong (for incident-origin) or what it prevents (for design-origin)
3. **Good/bad examples** — concrete code or process examples
4. **Enforcement** — how the rule is checked (ESLint rule name, hook script, manual step)

## Conventions

- One rule per file. If a rule has sub-rules (e.g., D-1 through D-8), they can live in one file grouped under a single theme, or split into individual files. Choose based on whether they share context.
- File name matches the theme: `db-safety.md`, not `rule-47.md`.
- Rules reference each other by ID: "See [[R-1]]" or "(per Rule D-3)".
- When a rule is retired, move it to `core/rules/_retired/` with a note explaining why.
- The compiler reads frontmatter to decide which rules go into CLAUDE.md vs AGENTS.md (based on `scope`).

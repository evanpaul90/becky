Create a new rule in the Becky rule system.

The rule title is: $ARGUMENTS

If no title was provided, ask the user: "Usage: /becky-rules-add <rule title>"

## Step 1: Read existing rules

Read all files in `core/rules/` (excluding `_schema.md`). For each rule file, parse the YAML frontmatter to extract the `id` field. Collect all existing IDs.

Read `core/rules/_schema.md` to understand the required frontmatter format.

## Step 2: Determine the next ID

IDs follow the pattern: `<PREFIX>-<NUMBER>` where PREFIX is one of:
- `D` -- Database rules
- `R` -- Read safety rules
- `F` -- Financial rules
- `U` -- UI rules
- `P` -- Process rules
- `G` -- General rules

Ask the user which category this rule belongs to (or infer from the title if obvious). Then find the highest existing number for that prefix and increment by 1.

## Step 3: Gather the rule details

Ask the user to describe the rule. Specifically ask:

1. **What is the rule?** State it as a clear, imperative instruction.
2. **Why does it exist?** What went wrong (for incident-origin) or what does it prevent (for design-origin)?
3. **What is the severity?** P0 (violation is a production incident), P1 (violation is a bug), P2 (advisory).
4. **What is the origin?** "incident" (born from a real failure) or "design" (preventive). If incident, what was the incident reference (commit hash, date, or issue number)?
5. **How is it enforced?** "eslint", "hook", "ci", "manual", or "compiler".
6. **What is the scope?** "all", "claude", "codex", or specific agent names.
7. **Can you provide a good example and a bad example?** Concrete code or process examples showing the right and wrong way.

## Step 4: Create the rule file

Generate a filename from the rule title: lowercase, replace spaces with hyphens, remove special characters. For example: "no silent error drops" becomes `no-silent-error-drops.md`.

Write the rule file to `core/rules/<filename>.md` with proper frontmatter:

```markdown
---
id: "<PREFIX>-<NUMBER>"
title: "<rule title>"
severity: "<P0|P1|P2>"
origin: "<incident|design>"
incident_ref: "<reference if applicable>"
enforcement: "<eslint|hook|ci|manual|compiler>"
scope: "<all|claude|codex|agent names>"
---

# <Rule Title>

<The rule statement -- clear, imperative, unambiguous.>

## Why This Exists

<What went wrong or what this prevents.>

## Examples

### Bad

<Code or process example showing the wrong way.>

### Good

<Code or process example showing the right way.>

## Enforcement

<How this rule is checked -- ESLint rule name, hook script, manual step, etc.>
```

## Step 5: Verify

Print the created rule file path and contents.

Count total rules now in `core/rules/`.

Print: "Rule <ID> created. There are now <N> rules in the system."

Print: "To compile this rule into CLAUDE.md and AGENTS.md, run `becky compile`. To verify all rules for issues, run `becky verify`."

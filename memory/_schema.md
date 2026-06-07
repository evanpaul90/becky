# Memory Schema

Becky uses a three-tier memory system inspired by hermes-agent. Each tier has different persistence, scope, and maintenance rules.

## Tiers

### Global (`.becky/memory/global/`)

Cross-project knowledge that applies everywhere. Examples:
- "Supabase RLS requires authenticated role in JWT"
- "Playwright tests flake on CI when run in parallel — use `--workers=1`"
- "Vercel builds fail silently if `.env.local` has Windows line endings"

**Persistence**: Permanent until explicitly retired.
**Written by**: [[watcher]] during skill-distill.
**Read by**: All agents in all projects.

### Project (`.becky/memory/project/`)

Knowledge specific to one project. Examples (using a fictional e-commerce app, "Acme Store"):
- "Acme Store uses customer_id for orders, not user_id"
- "Acme Store's checkout flow serves the cart data model, never the reverse"
- "Acme Store's auth JWT must include role:authenticated for the database to apply row-level security"

**Persistence**: Permanent for the project's lifetime.
**Written by**: [[watcher]] during retro, [[stark]] during implementation.
**Read by**: All agents working on this project.

### Session (`.becky/memory/session/`)

Ephemeral notes from a single work session. Examples:
- "Currently on story S-042, task 3 of 7"
- "Build fails because migration 063 wasn't applied — applying now"
- "Founder said 'skip the dark theme for now, ship light first'"

**Persistence**: Until the next skill-distill (monthly). Then archived.
**Written by**: Any agent during active work.
**Read by**: Any agent in the current session. The [[watcher]] reads all session files during skill-distill.

## File format

```markdown
---
tier: "project"
created: "2026-04-12"
source: "incident"           # incident | retro | session | manual
agent: "stark"               # Which agent wrote this
tags: ["database", "rls"]
---

Content. Plain markdown. Keep under 200 words per file.
Reference rules by ID: [[D-1]]. Reference wiki articles by title: [[Silent Write Incident]].
```

## Conventions

- One topic per file. Name files descriptively: `supabase-rls-jwt-role.md`, not `note-47.md`.
- Session files are named with date prefix: `2026-04-12-story-s042-progress.md`.
- The [[watcher]]'s skill-distill compresses session files into project/global files and archives the originals.
- Memory files are input to `compile.ts` when `include_memory_refs: true` in config.

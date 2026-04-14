# Becky Memory Compiler

Karpathy-inspired knowledge base that automatically captures every Claude Code session, extracts decisions/patterns/lessons, and compiles them into a structured wiki that Becky's agents can query.

> Adapted from [claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler) by Cole Medin, which implements [Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) architecture.

## What It Does

```
Session ends → hook captures transcript → flush.py extracts knowledge → daily log
                                                                            ↓
                                                            compile.py (auto 6PM)
                                                                            ↓
                                                                knowledge/
                                                            ├── index.md (master catalog)
                                                            ├── concepts/ (atomic articles)
                                                            ├── connections/ (cross-links)
                                                            └── qa/ (filed answers)
```

Every session makes Becky smarter. Decisions compound. Patterns are recognized. Mistakes are never repeated.

## Setup

### 1. Install uv (Python package manager)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Copy files to your project
```bash
# From the becky repo root:
cp -r memory-compiler/hooks/ <your-project>/.becky/hooks/
cp -r memory-compiler/scripts/ <your-project>/.becky/scripts/
cp memory-compiler/pyproject.toml <your-project>/.becky/
cp memory-compiler/SCHEMA.md <your-project>/.becky/SCHEMA.md
```

### 3. Create directories
```bash
mkdir -p <your-project>/.becky/daily
mkdir -p <your-project>/.becky/knowledge/{concepts,connections,qa}
```

### 4. Wire hooks into Claude Code
Add to your project's `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "cd .becky && uv run python hooks/session-start.py",
        "timeout": 15000
      }]
    }],
    "PreCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "cd .becky && uv run python hooks/pre-compact.py",
        "timeout": 10000
      }]
    }],
    "SessionEnd": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "cd .becky && uv run python hooks/session-end.py",
        "timeout": 10000
      }]
    }]
  }
}
```

### 5. Install dependencies
```bash
cd <your-project>/.becky && uv sync
```

### 6. Initialize knowledge base
```bash
# Create empty index
echo "# Knowledge Base Index\n\n| Article | Summary | Compiled From | Updated |\n|---------|---------|---------------|---------|" > .becky/knowledge/index.md
```

## How It Works

### Automatic (zero effort)
- **SessionStart** → injects knowledge index into every conversation
- **PreCompact** → captures context before auto-compaction (long sessions)
- **SessionEnd** → extracts knowledge into daily log
- **Auto-compile** → runs at 6PM local time, turns daily logs into wiki articles

### Manual
```bash
# Compile all unprocessed daily logs
cd .becky && uv run python scripts/compile.py

# Query the knowledge base
cd .becky && uv run python scripts/query.py "What patterns have I seen with folio creation?"

# Lint for health
cd .becky && uv run python scripts/lint.py

# Force recompile everything
cd .becky && uv run python scripts/compile.py --all
```

## How Becky Uses It

### Watcher reads the knowledge base
When Watcher runs (retro, knowledge phase), it reads `knowledge/index.md` and relevant articles to enrich its chronicle with historical patterns.

### Widow references past bugs
Before testing, Widow can query the knowledge base: "What bugs have been found in the billing module?" The knowledge base returns compiled articles with patterns, not raw session logs.

### Strange traces with history
When analyzing a bug, Strange checks: "Has this code path failed before?" The knowledge base surfaces past incidents and their resolutions.

### Fury plans with context
When scoping test requirements, Fury reads the knowledge base to understand what's been tested before, what failed, and what patterns exist.

## Obsidian Integration

The knowledge base uses `[[wikilinks]]` — point an Obsidian vault at `.becky/knowledge/` for:
- Graph view of connected concepts
- Backlinks between articles
- Full-text search
- Visual navigation

## Costs

| Operation | Cost |
|-----------|------|
| Memory flush (per session) | ~$0.02-0.05 |
| Compile one daily log | ~$0.45-0.65 |
| Query | ~$0.15-0.25 |
| Lint | ~$0.15-0.25 |

Uses your existing Claude subscription (Max/Team/Enterprise). No separate API billing.

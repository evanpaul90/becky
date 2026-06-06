# Skill Distill — Monthly Compression

Fires monthly. Watcher reads all session memory from the past month, extracts patterns, and compresses them into project and global memory.

## Trigger

- Monthly (first session of the month)
- Can be manually invoked

## Process

### 1. Read

The [[watcher]] reads all files in `memory/session/` from the past month.

### 2. Pattern extraction

Identify:
- **Frequently invoked rules**: Which rules from `core/rules/` came up most? Are they working, or is there a systemic issue?
- **Repeated decisions**: Were the same architectural/process decisions made multiple times? Should they be codified as rules?
- **Tool discoveries**: New tool patterns, workflow shortcuts, or configuration insights that should be preserved.
- **Agent behavior notes**: Which agents performed well? Which needed correction? Any feedback that should be encoded into agent definitions?

### 3. Compress

For each pattern:
- If it's project-specific → write to `memory/project/`
- If it's universal → write to `memory/global/`
- If it should be a rule → draft a rule and flag for review
- If it's a wiki article → file to `wiki/raw/concepts/`

### 4. Archive

Move processed session files to `memory/session/_archive/YYYY-MM/`.

### 5. Prune

Check `memory/project/` and `memory/global/` for stale entries:
- Does the referenced file/function/config still exist?
- Is the rule still in `core/rules/` or was it retired?
- Is the project context still active?

Remove or update stale entries.

## Output

- Updated `memory/project/` and `memory/global/`
- New wiki articles in `wiki/raw/concepts/`
- Archived session files
- (Optional) draft rules for review

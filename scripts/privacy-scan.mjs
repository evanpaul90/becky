#!/usr/bin/env node
/**
 * privacy-scan.mjs — dependency-free repo scanner for secrets & personal data.
 *
 * Usage:
 *   node scripts/privacy-scan.mjs            # scan the whole repo
 *   node scripts/privacy-scan.mjs <dir>      # scan a specific subtree
 *
 * What it does
 * ------------
 * Walks the repository (skipping node_modules/.git/dist/.netlify) and scans
 * text files for two classes of problems:
 *
 *   (a) Common secret patterns — OpenAI/Anthropic keys, AWS access keys,
 *       "Bearer <token>" headers, JWTs, private-key PEM headers, and .env-style
 *       assignments of *_KEY / *_SECRET / *_TOKEN that have a non-empty value.
 *
 *   (b) Personal-identity markers — loaded from an OPTIONAL deny-list file at
 *       scripts/.privacy-deny.local (one regex per line, '#' starts a comment).
 *       That file is git-ignored, so your personal terms are NEVER committed.
 *       If the file is absent, a small built-in structural set is used so the
 *       scan still does something useful out of the box. Copy
 *       scripts/.privacy-deny.example to scripts/.privacy-deny.local and add
 *       your own names/handles/domains to make this genuinely strict.
 *
 * Output
 * ------
 * Prints one line per hit:  file:line  [pattern]  snippet
 * Then a summary. Exit code is 1 if any hit was found, 0 if the repo is clean.
 * Wire it as a pre-commit hook to keep secrets and personal data out of history
 * (see SECURITY.md).
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repo root is the parent of scripts/. Allow an explicit override via argv[2].
const REPO_ROOT = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(__dirname, "..");

const DENY_LIST_PATH = join(__dirname, ".privacy-deny.local");

// Directories we never descend into.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".netlify",
  ".next",
  "coverage",
]);

// Only these extensions are treated as scannable text.
const TEXT_EXTENSIONS = new Set([
  ".md",
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".txt",
]);

/**
 * Secret patterns. Each has a human label and a RegExp.
 * NOTE: these are intentionally created fresh (not global/sticky reused across
 * lines) to avoid lastIndex statefulness surprises — we build a new RegExp per
 * line via `pattern.regexSource`.
 */
const SECRET_PATTERNS = [
  // Anthropic key (more specific) must come before the generic sk- check.
  { label: "anthropic-key", regexSource: "sk-ant-[A-Za-z0-9_\\-]{16,}" },
  { label: "openai-key", regexSource: "sk-[A-Za-z0-9]{20,}" },
  { label: "aws-access-key", regexSource: "AKIA[0-9A-Z]{16}" },
  { label: "bearer-token", regexSource: "Bearer\\s+[A-Za-z0-9_\\-\\.=]{12,}" },
  // JWT: three base64url segments separated by dots, starting with the
  // canonical "eyJ" header prefix.
  {
    label: "jwt",
    regexSource: "eyJ[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+",
  },
  {
    label: "private-key-header",
    regexSource: "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
  },
  // .env-style assignment of a *_KEY / *_SECRET / *_TOKEN with a non-empty,
  // non-placeholder value. We exclude obvious placeholders (empty, "", '',
  // your-..., xxx, changeme, <...>).
  {
    label: "env-secret-assignment",
    regexSource:
      "[A-Za-z0-9_]*(?:KEY|SECRET|TOKEN)\\s*[:=]\\s*(?!['\"]?\\s*$)(?!['\"]?(?:your[-_]|xxx|changeme|<|\\$\\{|placeholder))['\"]?[A-Za-z0-9_\\-\\.\\/+=]{8,}",
  },
];

/**
 * Built-in fallback personal-identity markers. These are structural/generic —
 * adopters are expected to supply their own real terms via the git-ignored
 * deny-list. We keep this conservative to avoid noise, but useful enough to
 * catch the most common accidental leaks of contact info.
 */
const BUILTIN_IDENTITY_PATTERNS = [
  // Email addresses.
  {
    label: "email-address",
    regexSource: "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}",
  },
  // Phone-like sequences (international or local, 9+ digits with separators).
  {
    label: "phone-number",
    regexSource: "(?:\\+\\d{1,3}[\\s\\-]?)?(?:\\d[\\s\\-]?){9,13}\\d",
  },
];

/**
 * Load deny-list regexes from the optional git-ignored file. One regex per
 * line; '#' starts a comment; blank lines ignored. Invalid regexes are
 * reported and skipped (we never crash on a bad line).
 */
function loadIdentityPatterns() {
  if (!existsSync(DENY_LIST_PATH)) {
    return {
      source: "built-in (no deny-list found)",
      patterns: BUILTIN_IDENTITY_PATTERNS,
    };
  }

  const raw = readFileSync(DENY_LIST_PATH, "utf8");
  const patterns = [];
  let lineNo = 0;
  for (const rawLine of raw.split(/\r?\n/)) {
    lineNo += 1;
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    try {
      // Validate the regex now so we fail fast with a clear message.
      // eslint-disable-next-line no-new
      new RegExp(line);
      patterns.push({ label: `deny:line-${lineNo}`, regexSource: line });
    } catch (err) {
      console.error(
        `  ! skipping invalid deny-list regex at line ${lineNo}: ${line}  (${err.message})`,
      );
    }
  }

  if (patterns.length === 0) {
    return {
      source: "built-in (deny-list present but empty)",
      patterns: BUILTIN_IDENTITY_PATTERNS,
    };
  }

  return { source: `scripts/.privacy-deny.local (${patterns.length})`, patterns };
}

/** Recursively collect scannable files under `dir`. */
function collectFiles(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // unreadable dir — skip silently
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectFiles(full, out);
      continue;
    }

    if (!entry.isFile()) continue;

    // Never scan the deny-list itself (it legitimately contains personal terms).
    if (full === DENY_LIST_PATH) continue;

    if (TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

/** Scan a single file. Returns an array of hit objects. */
function scanFile(absPath, allPatterns) {
  let content;
  try {
    content = readFileSync(absPath, "utf8");
  } catch {
    return [];
  }

  const relPath = relative(REPO_ROOT, absPath) || absPath;
  const lines = content.split(/\r?\n/);
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 0) continue;

    for (const pattern of allPatterns) {
      // Fresh RegExp per (line, pattern) — no shared lastIndex state.
      const re = new RegExp(pattern.regexSource);
      const match = re.exec(line);
      if (match) {
        hits.push({
          file: relPath,
          line: i + 1,
          label: pattern.label,
          snippet: redact(line.trim()),
        });
      }
    }
  }
  return hits;
}

/** Trim long lines so output stays readable; preserve the meaningful start. */
function redact(text) {
  const MAX = 120;
  if (text.length <= MAX) return text;
  return text.slice(0, MAX) + " …";
}

function main() {
  const identity = loadIdentityPatterns();

  // Tag secret patterns so labels are clearly secret-vs-identity in output.
  const secretPatterns = SECRET_PATTERNS.map((p) => ({
    label: `secret:${p.label}`,
    regexSource: p.regexSource,
  }));
  const identityPatterns = identity.patterns.map((p) => ({
    label: `identity:${p.label}`,
    regexSource: p.regexSource,
  }));
  const allPatterns = [...secretPatterns, ...identityPatterns];

  console.log("privacy-scan — scanning for secrets and personal data");
  console.log(`  root:        ${REPO_ROOT}`);
  console.log(`  deny-list:   ${identity.source}`);
  console.log("");

  const files = collectFiles(REPO_ROOT, []);
  let totalHits = 0;
  const labelCounts = new Map();

  for (const file of files) {
    const hits = scanFile(file, allPatterns);
    for (const hit of hits) {
      totalHits += 1;
      labelCounts.set(hit.label, (labelCounts.get(hit.label) || 0) + 1);
      console.log(`${hit.file}:${hit.line}  [${hit.label}]  ${hit.snippet}`);
    }
  }

  console.log("");
  console.log("─".repeat(60));
  console.log(`Scanned ${files.length} text file(s).`);

  if (totalHits === 0) {
    console.log("Result: CLEAN — no secrets or personal-data markers found.");
    process.exit(0);
  }

  console.log(`Result: ${totalHits} hit(s) found:`);
  for (const [label, count] of [...labelCounts.entries()].sort()) {
    console.log(`  ${count.toString().padStart(4)}  ${label}`);
  }
  console.log("");
  console.log(
    "Review each hit above. Remove secrets/personal data before committing.",
  );
  console.log(
    "False positive? Tune scripts/.privacy-deny.local or the patterns in this script.",
  );
  process.exit(1);
}

main();

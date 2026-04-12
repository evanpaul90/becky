/**
 * Becky Verifier
 *
 * Checks rules for:
 * - Missing frontmatter fields
 * - Duplicate rule IDs
 * - Stale wikilink references
 * - Rules without enforcement
 * - Agents referencing non-existent rules
 *
 * Usage: npx tsx core/verify.ts
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse as parseYaml } from "yaml";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

interface Issue {
  severity: "error" | "warning";
  file: string;
  message: string;
}

const issues: Issue[] = [];

function addIssue(severity: "error" | "warning", file: string, message: string) {
  issues.push({ severity, file, message });
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
  const body = match[2].trim();
  return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// Check rules
// ---------------------------------------------------------------------------

function checkRules() {
  const rulesDir = join(BECKY_ROOT, "core", "rules");
  const files = readdirSync(rulesDir).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  );

  const allIds = new Set<string>();
  const requiredFields = ["id", "title", "severity", "origin", "enforcement", "scope"];

  for (const filename of files) {
    const filepath = join(rulesDir, filename);
    const raw = readFileSync(filepath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    // Check required fields
    for (const field of requiredFields) {
      if (!frontmatter[field]) {
        addIssue("error", filename, `Missing required frontmatter field: ${field}`);
      }
    }

    // Check duplicate IDs
    const ids = String(frontmatter.id || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const id of ids) {
      if (allIds.has(id)) {
        addIssue("error", filename, `Duplicate rule ID: ${id}`);
      }
      allIds.add(id);
    }

    // Check empty body
    if (!body || body.length < 50) {
      addIssue("warning", filename, `Rule body is very short (${body.length} chars) — consider adding detail`);
    }

    // Check enforcement is specified
    const enforcement = String(frontmatter.enforcement || "");
    if (enforcement === "manual") {
      addIssue("warning", filename, `Rule has manual-only enforcement — consider adding automated enforcement`);
    }
  }

  return allIds;
}

// ---------------------------------------------------------------------------
// Check agents
// ---------------------------------------------------------------------------

function checkAgents(ruleIds: Set<string>) {
  const agentsDir = join(BECKY_ROOT, "agents");
  const files = readdirSync(agentsDir).filter(
    (f) => f.endsWith(".md") && !f.startsWith("_")
  );

  const agentIds = new Set<string>();

  for (const filename of files) {
    const filepath = join(agentsDir, filename);
    const raw = readFileSync(filepath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    // Check required fields
    if (!frontmatter.id) addIssue("error", filename, "Agent missing id");
    if (!frontmatter.name) addIssue("error", filename, "Agent missing name");
    if (!frontmatter.runtime) addIssue("error", filename, "Agent missing runtime");

    if (frontmatter.id) agentIds.add(String(frontmatter.id));

    // Check for wikilink references to rules
    const ruleRefs = body.match(/\[\[([A-Z]-\d+)\]\]/g) || [];
    for (const ref of ruleRefs) {
      const id = ref.replace(/[\[\]]/g, "");
      if (!ruleIds.has(id)) {
        addIssue("warning", filename, `References non-existent rule: ${id}`);
      }
    }

    // Check for agent cross-references
    const agentRefs = body.match(/\[\[(\w+)\]\]/g) || [];
    // We'll validate these after all agents are loaded
  }

  return agentIds;
}

// ---------------------------------------------------------------------------
// Check wiki
// ---------------------------------------------------------------------------

function checkWiki() {
  const indexPath = join(BECKY_ROOT, "wiki", "compiled", "index.md");
  if (!existsSync(indexPath)) {
    addIssue("warning", "wiki/compiled/index.md", "Wiki index does not exist");
    return;
  }

  const compiledDir = join(BECKY_ROOT, "wiki", "compiled");
  const subdirs = ["concepts", "decisions", "incidents"];

  for (const subdir of subdirs) {
    const dirPath = join(compiledDir, subdir);
    if (!existsSync(dirPath)) {
      addIssue("warning", `wiki/compiled/${subdir}`, "Wiki subdirectory does not exist");
    }
  }
}

// ---------------------------------------------------------------------------
// Check modes
// ---------------------------------------------------------------------------

function checkModes(agentIds: Set<string>) {
  const modesDir = join(BECKY_ROOT, "modes");
  const files = ["greenfield.md", "brownfield.md"];

  for (const filename of files) {
    const filepath = join(modesDir, filename);
    if (!existsSync(filepath)) {
      addIssue("error", filename, "Mode file does not exist");
      continue;
    }

    const raw = readFileSync(filepath, "utf-8");
    const agentRefs = raw.match(/\[\[(\w+)\]\]/g) || [];

    for (const ref of agentRefs) {
      const id = ref.replace(/[\[\]]/g, "");
      // Skip non-agent references (rule IDs, article names)
      if (id.match(/^[A-Z]-\d+$/) || id.includes("/")) continue;
      if (!agentIds.has(id)) {
        addIssue("warning", filename, `References non-existent agent: ${id}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Becky verify — checking for issues...\n");

  const ruleIds = checkRules();
  const agentIds = checkAgents(ruleIds);
  checkWiki();
  checkModes(agentIds);

  // Report
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.log(`ERRORS (${errors.length}):`);
    for (const e of errors) {
      console.log(`  [ERROR] ${e.file}: ${e.message}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`  [WARN]  ${w.file}: ${w.message}`);
    }
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("All checks passed. No issues found.");
  }

  console.log(`\nSummary: ${ruleIds.size} rules, ${agentIds.size} agents, ${errors.length} errors, ${warnings.length} warnings`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main();

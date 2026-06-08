/**
 * Becky Scan
 *
 * Scans an existing project and produces a conversational analysis report.
 * Detects agent frameworks, reads planning artifacts, analyzes the codebase,
 * and suggests where to start.
 *
 * Usage: npx tsx core/cli.ts scan [target-dir]
 */

import chalk from "chalk";
import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { globSync } from "glob";
import { parse as parseYaml } from "yaml";



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FrameworkInfo {
  name: string;
  found: string[];
  details: string;
}

interface ArtifactCounts {
  prds: string[];
  architecture: string[];
  uxSpecs: string[];
  epicsStories: string[];
  sprintStatus: string[];
  incidents: string[];
}

interface SprintStoryInfo {
  done: number;
  inProgress: number;
  pending: number;
  blocked: number;
  details: string[];
}

interface SourceFileCounts {
  [ext: string]: number;
}

interface ScanReport {
  projectName: string;
  projectDescription: string;
  stack: string[];
  frameworks: FrameworkInfo[];
  artifacts: ArtifactCounts;
  sprintInfo: SprintStoryInfo | null;
  sourceFiles: SourceFileCounts;
  migrationCount: number;
  testCount: number;
  envFiles: string[];
  claudeMdRules: string[];
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Phase 1: Detect frameworks
// ---------------------------------------------------------------------------

function detectFrameworks(root: string): FrameworkInfo[] {
  const frameworks: FrameworkInfo[] = [];

  // BMad
  const bmadDirs = ["_bmad", "_bmad-output"].filter((d) =>
    existsSync(join(root, d))
  );
  if (bmadDirs.length > 0) {
    const fileCount = bmadDirs.reduce((sum, d) => {
      try {
        return (
          sum +
          globSync("**/*", { cwd: join(root, d), nodir: true, dot: false })
            .length
        );
      } catch {
        return sum;
      }
    }, 0);
    frameworks.push({
      name: "BMad",
      found: bmadDirs.map((d) => `${d}/`),
      details: `${fileCount} files across ${bmadDirs.join(", ")}`,
    });
  }

  // Hermes
  const hermesIndicators = [".hermes", "hermes.toml", "hermes"].filter((d) =>
    existsSync(join(root, d))
  );
  if (hermesIndicators.length > 0) {
    frameworks.push({
      name: "Hermes",
      found: hermesIndicators,
      details: `Indicators: ${hermesIndicators.join(", ")}`,
    });
  }

  // Claude Code
  if (existsSync(join(root, "CLAUDE.md"))) {
    const stat = statSync(join(root, "CLAUDE.md"));
    const sizeKb = Math.round(stat.size / 1024);
    frameworks.push({
      name: "Claude Code",
      found: ["CLAUDE.md"],
      details: `${sizeKb}KB instruction file`,
    });
  }

  // Codex/OpenAI
  if (existsSync(join(root, "AGENTS.md"))) {
    const stat = statSync(join(root, "AGENTS.md"));
    const sizeKb = Math.round(stat.size / 1024);
    frameworks.push({
      name: "Codex / OpenAI",
      found: ["AGENTS.md"],
      details: `${sizeKb}KB agent file`,
    });
  }

  // Cursor
  if (existsSync(join(root, ".cursor"))) {
    frameworks.push({
      name: "Cursor",
      found: [".cursor/"],
      details: "Cursor IDE config detected",
    });
  }

  return frameworks;
}

// ---------------------------------------------------------------------------
// Phase 2: Read planning artifacts
// ---------------------------------------------------------------------------

function readPlanningArtifacts(root: string): ArtifactCounts {
  const result: ArtifactCounts = {
    prds: [],
    architecture: [],
    uxSpecs: [],
    epicsStories: [],
    sprintStatus: [],
    incidents: [],
  };

  // Search in _bmad-output and _bmad if they exist
  const searchDirs = ["_bmad-output", "_bmad", "."].filter((d) =>
    existsSync(join(root, d))
  );

  for (const dir of searchDirs) {
    const base = join(root, dir);
    try {
      const allMd = globSync("**/*.md", {
        cwd: base,
        nodir: true,
        dot: false,
      });

      for (const file of allMd) {
        const lower = file.toLowerCase();
        if (lower.includes("prd")) result.prds.push(join(dir, file));
        if (lower.includes("architecture"))
          result.architecture.push(join(dir, file));
        if (lower.includes("ux") || lower.includes("design"))
          result.uxSpecs.push(join(dir, file));
        if (lower.includes("epic") || lower.includes("stories"))
          result.epicsStories.push(join(dir, file));
        if (lower.includes("incident") || lower.includes("postmortem"))
          result.incidents.push(join(dir, file));
      }

      const yamlFiles = globSync("**/sprint-status*.yaml", {
        cwd: base,
        nodir: true,
        dot: false,
      });
      for (const file of yamlFiles) {
        result.sprintStatus.push(join(dir, file));
      }
    } catch {
      // Skip unreadable directories
    }
  }

  // Deduplicate
  result.prds = [...new Set(result.prds)];
  result.architecture = [...new Set(result.architecture)];
  result.uxSpecs = [...new Set(result.uxSpecs)];
  result.epicsStories = [...new Set(result.epicsStories)];
  result.sprintStatus = [...new Set(result.sprintStatus)];
  result.incidents = [...new Set(result.incidents)];

  return result;
}

// ---------------------------------------------------------------------------
// Phase 3: Read the codebase
// ---------------------------------------------------------------------------

interface PackageInfo {
  name: string;
  description: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function readPackageJson(root: string): PackageInfo | null {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const raw = readFileSync(pkgPath, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      name: (data.name as string) || "(unnamed)",
      description: (data.description as string) || "",
      dependencies: (data.dependencies as Record<string, string>) || {},
      devDependencies: (data.devDependencies as Record<string, string>) || {},
    };
  } catch {
    return null;
  }
}

function inferStack(pkg: PackageInfo): string[] {
  const stack: string[] = [];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (allDeps["next"]) stack.push(`Next.js ${allDeps["next"]}`);
  else if (allDeps["react"]) stack.push("React");
  else if (allDeps["vue"]) stack.push("Vue");
  else if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) stack.push("Svelte");
  else if (allDeps["express"]) stack.push("Express");
  else if (allDeps["fastify"]) stack.push("Fastify");

  if (allDeps["typescript"] || allDeps["tsx"]) stack.push("TypeScript");
  if (allDeps["tailwindcss"]) stack.push("Tailwind CSS");
  if (allDeps["@supabase/supabase-js"] || allDeps["@supabase/ssr"])
    stack.push("Supabase");
  if (allDeps["@clerk/nextjs"] || allDeps["@clerk/clerk-sdk-node"])
    stack.push("Clerk Auth");
  if (allDeps["stripe"]) stack.push("Stripe");
  if (allDeps["posthog-js"] || allDeps["posthog-node"])
    stack.push("PostHog");
  if (allDeps["@sentry/nextjs"] || allDeps["@sentry/node"])
    stack.push("Sentry");
  if (allDeps["prisma"] || allDeps["@prisma/client"]) stack.push("Prisma");
  if (allDeps["drizzle-orm"]) stack.push("Drizzle");

  return stack;
}

function countSourceFiles(root: string): SourceFileCounts {
  const counts: SourceFileCounts = {};
  const extensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".rb",
    ".go",
    ".rs",
    ".java",
    ".css",
    ".scss",
    ".vue",
    ".svelte",
  ];

  try {
    const files = globSync("**/*.{ts,tsx,js,jsx,py,rb,go,rs,java,css,scss,vue,svelte}", {
      cwd: root,
      nodir: true,
      dot: false,
      ignore: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "build/**",
        "coverage/**",
        ".becky/**",
        "_bmad-output/**",
        "_bmad/**",
      ],
    });

    for (const file of files) {
      const ext = extname(file);
      if (extensions.includes(ext)) {
        counts[ext] = (counts[ext] || 0) + 1;
      }
    }
  } catch {
    // Skip on error
  }

  return counts;
}

function countMigrations(root: string): number {
  const migrationsDir = join(root, "supabase", "migrations");
  if (!existsSync(migrationsDir)) return 0;
  try {
    return readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).length;
  } catch {
    return 0;
  }
}

function countTests(root: string): number {
  try {
    const testFiles = globSync(
      "**/*.{test,spec}.{ts,tsx,js,jsx}",
      {
        cwd: root,
        nodir: true,
        dot: false,
        ignore: ["node_modules/**", "dist/**", ".next/**"],
      }
    );
    const testDirFiles = globSync(
      "{tests,test,__tests__}/**/*.{ts,tsx,js,jsx}",
      {
        cwd: root,
        nodir: true,
        dot: false,
        ignore: ["node_modules/**"],
      }
    );
    const allTests = new Set([...testFiles, ...testDirFiles]);
    return allTests.size;
  } catch {
    return 0;
  }
}

function findEnvFiles(root: string): string[] {
  const envPatterns = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.staging",
    ".env.example",
  ];
  return envPatterns.filter((f) => existsSync(join(root, f)));
}

// ---------------------------------------------------------------------------
// Phase 4: Read CLAUDE.md rules
// ---------------------------------------------------------------------------

function extractClaudeMdRules(root: string): string[] {
  const claudePath = join(root, "CLAUDE.md");
  if (!existsSync(claudePath)) return [];

  try {
    const content = readFileSync(claudePath, "utf-8");
    const lines = content.split("\n");
    const rules: string[] = [];

    for (const line of lines) {
      // Look for rule-like headings: "### Rule X:", "## Rule D-1:", numbered rules
      const ruleMatch = line.match(/^#{2,4}\s+(Rule\s+\S+.*)/i);
      if (ruleMatch) {
        rules.push(ruleMatch[1].trim());
        continue;
      }
      // Look for "Key Conventions" or similar section headers
      const conventionMatch = line.match(/^#{2,3}\s+(.*(?:Convention|Safety|Rule|Non-negotiable).*)/i);
      if (conventionMatch && !rules.includes(conventionMatch[1].trim())) {
        rules.push(conventionMatch[1].trim());
      }
    }

    return rules;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Phase 4b: Parse sprint status
// ---------------------------------------------------------------------------

function parseSprintStatus(root: string, files: string[]): SprintStoryInfo | null {
  if (files.length === 0) return null;

  const info: SprintStoryInfo = {
    done: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    details: [],
  };

  for (const file of files) {
    const fullPath = join(root, file);
    if (!existsSync(fullPath)) continue;

    try {
      const raw = readFileSync(fullPath, "utf-8");
      const data = parseYaml(raw) as Record<string, unknown>;

      // Walk the YAML looking for status fields
      const walkForStatus = (obj: unknown, path: string): void => {
        if (obj === null || obj === undefined) return;
        if (typeof obj !== "object") return;

        const record = obj as Record<string, unknown>;

        if (typeof record.status === "string") {
          const status = record.status.toLowerCase();
          if (status === "done" || status === "complete" || status === "completed") {
            info.done++;
          } else if (status === "in-progress" || status === "in_progress" || status === "active") {
            info.inProgress++;
          } else if (status === "blocked") {
            info.blocked++;
            const name = (record.name as string) || (record.title as string) || path;
            info.details.push(`BLOCKED: ${name}`);
          } else if (status === "pending" || status === "todo" || status === "not-started") {
            info.pending++;
          }
        }

        for (const [key, value] of Object.entries(record)) {
          if (key === "status") continue;
          if (typeof value === "object" && value !== null) {
            walkForStatus(value, `${path}.${key}`);
          }
        }
      };

      walkForStatus(data, file);
    } catch {
      info.details.push(`Could not parse ${file}`);
    }
  }

  return info.done + info.inProgress + info.pending + info.blocked > 0
    ? info
    : null;
}

// ---------------------------------------------------------------------------
// Phase 4c: Parse epic/story checkboxes
// ---------------------------------------------------------------------------

function parseCheckboxCompletion(root: string, files: string[]): { done: number; total: number } {
  let done = 0;
  let total = 0;

  for (const file of files) {
    const fullPath = join(root, file);
    if (!existsSync(fullPath)) continue;

    try {
      const content = readFileSync(fullPath, "utf-8");
      const doneMatches = content.match(/- \[x\]/gi);
      const pendingMatches = content.match(/- \[ \]/g);
      if (doneMatches) done += doneMatches.length;
      if (pendingMatches) total += pendingMatches.length;
      if (doneMatches) total += doneMatches.length;
    } catch {
      // Skip
    }
  }

  return { done, total };
}

// ---------------------------------------------------------------------------
// Phase 5: Generate suggestions
// ---------------------------------------------------------------------------

function generateSuggestions(report: ScanReport): string[] {
  const suggestions: string[] = [];

  if (
    report.frameworks.some((f) => f.name === "BMad") &&
    report.artifacts.prds.length > 0
  ) {
    suggestions.push(
      "Run `becky learn _bmad-output/` to import your planning artifacts into Becky's wiki"
    );
  }

  if (report.claudeMdRules.length > 0) {
    suggestions.push(
      "Your CLAUDE.md has rules that should be migrated to Becky's `core/rules/` for proper compilation and enforcement"
    );
  }

  if (report.sprintInfo && report.sprintInfo.blocked > 0) {
    suggestions.push(
      `Unblock ${report.sprintInfo.blocked} blocked stories first — blockers compound`
    );
  }

  if (report.sprintInfo && report.sprintInfo.inProgress > 0) {
    suggestions.push(
      `Finish the ${report.sprintInfo.inProgress} in-progress stories before starting new work`
    );
  }

  if (report.migrationCount > 0 && report.testCount === 0) {
    suggestions.push(
      "You have migrations but zero test files — consider adding tests before the next migration"
    );
  }

  if (report.frameworks.length === 0) {
    suggestions.push(
      "No existing agent frameworks detected — run `/becky-greenfield` to start fresh with Becky"
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Run `/becky-brownfield` to begin archaeology on this existing codebase"
    );
    suggestions.push(
      "Or run `/becky-greenfield` to start a new feature within this project"
    );
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Phase 6: Format and print the report
// ---------------------------------------------------------------------------

function formatReport(report: ScanReport): string {
  const lines: string[] = [];
  const rule = (label: string) => "─".repeat(Math.max(label.length, 20));

  // Header
  lines.push("");
  lines.push(
    "  Hey. I've been reading through your project. Here's what I see."
  );
  lines.push("");

  // PROJECT
  lines.push("  PROJECT");
  lines.push(`  ${rule("PROJECT")}`);
  lines.push(`  Name:         ${report.projectName}`);
  if (report.projectDescription) {
    lines.push(`  Description:  ${report.projectDescription}`);
  }
  if (report.stack.length > 0) {
    lines.push(`  Stack:        ${report.stack.join(", ")}`);
  }

  const sourceEntries = Object.entries(report.sourceFiles).sort(
    (a, b) => b[1] - a[1]
  );
  if (sourceEntries.length > 0) {
    const fileSummary = sourceEntries
      .map(([ext, count]) => `${count} ${ext}`)
      .join(", ");
    const totalFiles = sourceEntries.reduce((sum, [, c]) => sum + c, 0);
    lines.push(`  Source files:  ${totalFiles} total (${fileSummary})`);
  }
  if (report.migrationCount > 0) {
    lines.push(`  Migrations:   ${report.migrationCount}`);
  }
  lines.push(`  Tests:        ${report.testCount}`);
  if (report.envFiles.length > 0) {
    lines.push(`  Env files:    ${report.envFiles.join(", ")}`);
  }
  lines.push("");

  // EXISTING AGENT FRAMEWORKS
  if (report.frameworks.length > 0) {
    lines.push("  EXISTING AGENT FRAMEWORKS");
    lines.push(`  ${rule("EXISTING AGENT FRAMEWORKS")}`);
    for (const fw of report.frameworks) {
      lines.push(`  ${fw.name}`);
      lines.push(`    Found: ${fw.found.join(", ")}`);
      lines.push(`    ${fw.details}`);
    }
    lines.push("");
  }

  // PLANNING ARTIFACTS
  const totalArtifacts =
    report.artifacts.prds.length +
    report.artifacts.architecture.length +
    report.artifacts.uxSpecs.length +
    report.artifacts.epicsStories.length +
    report.artifacts.incidents.length;

  if (totalArtifacts > 0) {
    lines.push("  PLANNING ARTIFACTS");
    lines.push(`  ${rule("PLANNING ARTIFACTS")}`);
    lines.push(
      `  PRDs: ${report.artifacts.prds.length}  |  Architecture: ${report.artifacts.architecture.length}  |  UX Specs: ${report.artifacts.uxSpecs.length}  |  Stories/Epics: ${report.artifacts.epicsStories.length}`
    );
    if (report.artifacts.incidents.length > 0) {
      lines.push(
        `  Incidents/Postmortems: ${report.artifacts.incidents.length}`
      );
    }
    if (report.artifacts.sprintStatus.length > 0) {
      lines.push(
        `  Sprint status files: ${report.artifacts.sprintStatus.join(", ")}`
      );
    }
    lines.push("");
  }

  // WHAT LOOKS DONE / PENDING
  if (report.sprintInfo) {
    const total =
      report.sprintInfo.done +
      report.sprintInfo.inProgress +
      report.sprintInfo.pending +
      report.sprintInfo.blocked;

    lines.push("  WHAT LOOKS DONE");
    lines.push(`  ${rule("WHAT LOOKS DONE")}`);
    lines.push(
      `  ${report.sprintInfo.done} stories done out of ${total} total (${total > 0 ? Math.round((report.sprintInfo.done / total) * 100) : 0}%)`
    );
    lines.push("");

    lines.push("  WHAT LOOKS PENDING");
    lines.push(`  ${rule("WHAT LOOKS PENDING")}`);
    lines.push(`  ${report.sprintInfo.inProgress} in progress`);
    lines.push(`  ${report.sprintInfo.pending} pending`);
    if (report.sprintInfo.blocked > 0) {
      lines.push(
        `  ${report.sprintInfo.blocked} BLOCKED`
      );
      for (const detail of report.sprintInfo.details) {
        lines.push(`    ${detail}`);
      }
    }
    lines.push("");
  }

  // RULES I SHOULD ADOPT
  if (report.claudeMdRules.length > 0) {
    lines.push("  RULES I SHOULD ADOPT");
    lines.push(`  ${rule("RULES I SHOULD ADOPT")}`);
    for (const r of report.claudeMdRules.slice(0, 15)) {
      lines.push(`  - ${r}`);
    }
    if (report.claudeMdRules.length > 15) {
      lines.push(
        `  ... and ${report.claudeMdRules.length - 15} more rules`
      );
    }
    lines.push("");
  }

  // WHERE I'D START
  lines.push("  WHERE I'D START");
  lines.push(`  ${rule("WHERE I'D START")}`);
  lines.push("  Based on what I see, here's my suggestion:");
  report.suggestions.forEach((s, i) => {
    lines.push(`  ${i + 1}. ${s}`);
  });
  lines.push("");
  lines.push(
    "  Ready when you are. Run /becky-greenfield or /becky-brownfield to begin."
  );
  lines.push("");

  return lines.join("\n");
}

function printReport(report: ScanReport): void {
  const rule = (label: string) =>
    chalk.dim("─".repeat(Math.max(label.length, 20)));

  console.log();
  console.log(
    "  Hey. I've been reading through your project. Here's what I see."
  );
  console.log();

  // PROJECT
  console.log(chalk.bold("  PROJECT"));
  console.log(`  ${rule("PROJECT")}`);
  console.log(`  Name:         ${chalk.bold(report.projectName)}`);
  if (report.projectDescription) {
    console.log(`  Description:  ${report.projectDescription}`);
  }
  if (report.stack.length > 0) {
    console.log(`  Stack:        ${chalk.cyan(report.stack.join(", "))}`);
  }

  const sourceEntries = Object.entries(report.sourceFiles).sort(
    (a, b) => b[1] - a[1]
  );
  if (sourceEntries.length > 0) {
    const fileSummary = sourceEntries
      .map(([ext, count]) => `${chalk.bold(String(count))} ${ext}`)
      .join(", ");
    const totalFiles = sourceEntries.reduce((sum, [, c]) => sum + c, 0);
    console.log(
      `  Source files:  ${chalk.bold(String(totalFiles))} total (${fileSummary})`
    );
  }
  if (report.migrationCount > 0) {
    console.log(
      `  Migrations:   ${chalk.bold(String(report.migrationCount))}`
    );
  }
  console.log(
    `  Tests:        ${report.testCount === 0 ? chalk.yellow("0") : chalk.bold(String(report.testCount))}`
  );
  if (report.envFiles.length > 0) {
    console.log(
      `  Env files:    ${chalk.dim(report.envFiles.join(", "))}`
    );
  }
  console.log();

  // EXISTING AGENT FRAMEWORKS
  if (report.frameworks.length > 0) {
    console.log(chalk.bold("  EXISTING AGENT FRAMEWORKS"));
    console.log(`  ${rule("EXISTING AGENT FRAMEWORKS")}`);
    for (const fw of report.frameworks) {
      console.log(`  ${chalk.green(fw.name)}`);
      console.log(`    Found: ${chalk.cyan(fw.found.join(", "))}`);
      console.log(`    ${chalk.dim(fw.details)}`);
    }
    console.log();
  }

  // PLANNING ARTIFACTS
  const totalArtifacts =
    report.artifacts.prds.length +
    report.artifacts.architecture.length +
    report.artifacts.uxSpecs.length +
    report.artifacts.epicsStories.length +
    report.artifacts.incidents.length;

  if (totalArtifacts > 0) {
    console.log(chalk.bold("  PLANNING ARTIFACTS"));
    console.log(`  ${rule("PLANNING ARTIFACTS")}`);
    console.log(
      `  PRDs: ${chalk.bold(String(report.artifacts.prds.length))}  |  Architecture: ${chalk.bold(String(report.artifacts.architecture.length))}  |  UX Specs: ${chalk.bold(String(report.artifacts.uxSpecs.length))}  |  Stories/Epics: ${chalk.bold(String(report.artifacts.epicsStories.length))}`
    );
    if (report.artifacts.incidents.length > 0) {
      console.log(
        `  Incidents/Postmortems: ${chalk.yellow(String(report.artifacts.incidents.length))}`
      );
    }
    if (report.artifacts.sprintStatus.length > 0) {
      console.log(
        `  Sprint status files: ${chalk.dim(report.artifacts.sprintStatus.join(", "))}`
      );
    }
    console.log();
  }

  // WHAT LOOKS DONE / PENDING
  if (report.sprintInfo) {
    const total =
      report.sprintInfo.done +
      report.sprintInfo.inProgress +
      report.sprintInfo.pending +
      report.sprintInfo.blocked;
    const pct =
      total > 0 ? Math.round((report.sprintInfo.done / total) * 100) : 0;

    console.log(chalk.bold("  WHAT LOOKS DONE"));
    console.log(`  ${rule("WHAT LOOKS DONE")}`);
    console.log(
      `  ${chalk.green(String(report.sprintInfo.done))} stories done out of ${chalk.bold(String(total))} total (${chalk.bold(String(pct))}%)`
    );
    console.log();

    console.log(chalk.bold("  WHAT LOOKS PENDING"));
    console.log(`  ${rule("WHAT LOOKS PENDING")}`);
    console.log(
      `  ${chalk.yellow(String(report.sprintInfo.inProgress))} in progress`
    );
    console.log(
      `  ${chalk.dim(String(report.sprintInfo.pending))} pending`
    );
    if (report.sprintInfo.blocked > 0) {
      console.log(
        `  ${chalk.red(String(report.sprintInfo.blocked))} BLOCKED`
      );
      for (const detail of report.sprintInfo.details) {
        console.log(`    ${chalk.red(detail)}`);
      }
    }
    console.log();
  }

  // RULES I SHOULD ADOPT
  if (report.claudeMdRules.length > 0) {
    console.log(chalk.bold("  RULES I SHOULD ADOPT"));
    console.log(`  ${rule("RULES I SHOULD ADOPT")}`);
    for (const r of report.claudeMdRules.slice(0, 15)) {
      console.log(`  ${chalk.dim("-")} ${r}`);
    }
    if (report.claudeMdRules.length > 15) {
      console.log(
        chalk.dim(
          `  ... and ${report.claudeMdRules.length - 15} more rules`
        )
      );
    }
    console.log();
  }

  // WHERE I'D START
  console.log(chalk.bold("  WHERE I'D START"));
  console.log(`  ${rule("WHERE I'D START")}`);
  console.log("  Based on what I see, here's my suggestion:");
  report.suggestions.forEach((s, i) => {
    console.log(`  ${chalk.green(String(i + 1))}. ${s}`);
  });
  console.log();
  console.log(
    `  Ready when you are. Run ${chalk.green("/becky-greenfield")} or ${chalk.green("/becky-brownfield")} to begin.`
  );
  console.log();
}

// ---------------------------------------------------------------------------
// Phase 6: Save the analysis
// ---------------------------------------------------------------------------

function saveReport(root: string, report: ScanReport, plainText: string): void {
  // Try .becky/ first, fall back to root
  const beckyDir = join(root, ".becky");
  const outputDir = existsSync(beckyDir) ? beckyDir : root;

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = join(outputDir, "scan-report.md");

  const md = [
    "# Becky Scan Report",
    "",
    `_Generated: ${new Date().toISOString().split("T")[0]}_`,
    "",
    `## Project`,
    "",
    `- **Name:** ${report.projectName}`,
    report.projectDescription
      ? `- **Description:** ${report.projectDescription}`
      : "",
    report.stack.length > 0
      ? `- **Stack:** ${report.stack.join(", ")}`
      : "",
    `- **Migrations:** ${report.migrationCount}`,
    `- **Tests:** ${report.testCount}`,
    "",
    Object.entries(report.sourceFiles).length > 0
      ? `### Source Files\n\n${Object.entries(report.sourceFiles)
          .sort((a, b) => b[1] - a[1])
          .map(([ext, count]) => `- ${ext}: ${count}`)
          .join("\n")}`
      : "",
    "",
  ];

  if (report.frameworks.length > 0) {
    md.push("## Existing Agent Frameworks", "");
    for (const fw of report.frameworks) {
      md.push(`### ${fw.name}`, "");
      md.push(`- Found: ${fw.found.join(", ")}`);
      md.push(`- ${fw.details}`);
      md.push("");
    }
  }

  const totalArtifacts =
    report.artifacts.prds.length +
    report.artifacts.architecture.length +
    report.artifacts.uxSpecs.length +
    report.artifacts.epicsStories.length;

  if (totalArtifacts > 0) {
    md.push("## Planning Artifacts", "");
    md.push(`- PRDs: ${report.artifacts.prds.length}`);
    md.push(`- Architecture: ${report.artifacts.architecture.length}`);
    md.push(`- UX Specs: ${report.artifacts.uxSpecs.length}`);
    md.push(`- Stories/Epics: ${report.artifacts.epicsStories.length}`);
    if (report.artifacts.incidents.length > 0) {
      md.push(`- Incidents: ${report.artifacts.incidents.length}`);
    }
    md.push("");
  }

  if (report.sprintInfo) {
    const total =
      report.sprintInfo.done +
      report.sprintInfo.inProgress +
      report.sprintInfo.pending +
      report.sprintInfo.blocked;

    md.push("## Sprint Status", "");
    md.push(`- Done: ${report.sprintInfo.done} / ${total}`);
    md.push(`- In Progress: ${report.sprintInfo.inProgress}`);
    md.push(`- Pending: ${report.sprintInfo.pending}`);
    if (report.sprintInfo.blocked > 0) {
      md.push(`- **Blocked: ${report.sprintInfo.blocked}**`);
      for (const d of report.sprintInfo.details) {
        md.push(`  - ${d}`);
      }
    }
    md.push("");
  }

  if (report.claudeMdRules.length > 0) {
    md.push("## Rules from CLAUDE.md", "");
    for (const r of report.claudeMdRules) {
      md.push(`- ${r}`);
    }
    md.push("");
  }

  md.push("## Suggestions", "");
  for (const s of report.suggestions) {
    md.push(`1. ${s}`);
  }
  md.push("");

  writeFileSync(reportPath, md.filter((l) => l !== undefined).join("\n"), "utf-8");
  console.log(
    `  Report saved to ${chalk.cyan(reportPath)}`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  const targetDir = resolve(process.argv[3] || ".");

  if (!existsSync(targetDir)) {
    console.log(chalk.red(`  Directory not found: ${targetDir}`));
    process.exit(1);
  }

  console.log();
  console.log(
    chalk.bold.magenta("  Becky scan") +
      ` — reading ${chalk.cyan(targetDir)}`
  );
  console.log(chalk.dim("  This may take a moment for large projects..."));
  console.log();

  // Phase 1: Detect frameworks
  const frameworks = detectFrameworks(targetDir);

  // Phase 2: Read planning artifacts
  const artifacts = readPlanningArtifacts(targetDir);

  // Phase 3: Read the codebase
  const pkg = readPackageJson(targetDir);
  const stack = pkg ? inferStack(pkg) : [];
  const sourceFiles = countSourceFiles(targetDir);
  const migrationCount = countMigrations(targetDir);
  const testCount = countTests(targetDir);
  const envFiles = findEnvFiles(targetDir);

  // Phase 4: Analyze what's done vs pending
  const sprintInfo = parseSprintStatus(targetDir, artifacts.sprintStatus);
  const claudeMdRules = extractClaudeMdRules(targetDir);

  // If no sprint info from YAML, try checkbox parsing from epics/stories
  if (!sprintInfo && artifacts.epicsStories.length > 0) {
    const checkboxes = parseCheckboxCompletion(targetDir, artifacts.epicsStories);
    if (checkboxes.total > 0) {
      // We don't overwrite sprintInfo here since the type is different,
      // but we'll include it in suggestions
    }
  }

  // Build the report
  const report: ScanReport = {
    projectName: pkg?.name || dirname(targetDir).split("/").pop() || "(unknown)",
    projectDescription: pkg?.description || "",
    stack,
    frameworks,
    artifacts,
    sprintInfo,
    sourceFiles,
    migrationCount,
    testCount,
    envFiles,
    claudeMdRules,
    suggestions: [],
  };

  report.suggestions = generateSuggestions(report);

  // Phase 5: Print the report
  printReport(report);

  // Phase 6: Save the analysis
  const plainText = formatReport(report);
  saveReport(targetDir, report, plainText);
}

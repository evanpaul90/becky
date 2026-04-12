/**
 * Becky Brownfield Command
 *
 * Creates a new brownfield task with the 7-phase pipeline:
 * Discover → Document → Plan → Intervene → Test → Verify → Knowledge
 *
 * Usage: becky brownfield <task name>
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import chalk from "chalk";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

const PHASES = [
  { key: "1-discover",  folder: "phase-1-discover",  agent: "strange + stark", gate: "Audit complete" },
  { key: "2-document",  folder: "phase-2-document",  agent: "watcher",         gate: "Index covers existing system" },
  { key: "3-plan",      folder: "phase-3-plan",      agent: "fury",            gate: "Founder approves plan" },
  { key: "4-intervene", folder: "phase-4-intervene", agent: "stark",           gate: "Tests pass, push checklist clean" },
  { key: "5-test",      folder: "phase-5-test",      agent: "widow",           gate: "No regressions, features verified" },
  { key: "6-verify",    folder: "phase-6-verify",    agent: "heimdall",        gate: "Verdict filed with evidence" },
  { key: "7-knowledge", folder: "phase-7-knowledge", agent: "watcher",         gate: "Wiki index updated" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  const today = new Date().toISOString().split("T")[0];
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${today}-${slug}`;
}

function buildTaskYaml(taskName: string, slug: string): string {
  const today = new Date().toISOString().split("T")[0];

  const phases: Record<string, { agent: string; status: string; gate: string; outputs: never[] }> = {};
  for (const phase of PHASES) {
    phases[phase.key] = {
      agent: phase.agent,
      status: "pending",
      gate: phase.gate,
      outputs: [],
    };
  }

  const doc = {
    task: taskName,
    slug,
    mode: "brownfield",
    created: today,
    status: "phase-1-discover",
    current_agent: "strange + stark",
    phases,
    autopilot: false,
  };

  return stringifyYaml(doc, { lineWidth: 120 });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
  const taskName = process.argv.slice(3).join(" ");

  if (!taskName) {
    console.log(chalk.red("Usage: becky brownfield <task name>"));
    console.log(chalk.gray('  Example: becky brownfield "fix booking checkout flow"'));
    process.exit(1);
  }

  const slug = slugify(taskName);
  const taskDir = join(BECKY_ROOT, "tasks", slug);

  // Create phase folders
  console.log(chalk.bold(`\nCreating brownfield task: ${taskName}\n`));

  mkdirSync(taskDir, { recursive: true });

  for (const phase of PHASES) {
    const phaseDir = join(taskDir, phase.folder);
    mkdirSync(phaseDir, { recursive: true });
    console.log(`  ${chalk.cyan(`tasks/${slug}/${phase.folder}/`)}  ${chalk.gray("→")}  ${chalk.yellow(phase.agent)}`);
  }

  // Write _task.yaml
  const yamlContent = buildTaskYaml(taskName, slug);
  writeFileSync(join(taskDir, "_task.yaml"), yamlContent, "utf-8");
  console.log(`  ${chalk.cyan(`tasks/${slug}/_task.yaml`)}`);

  // Summary
  console.log(chalk.bold(`\nTask created: ${chalk.green(slug)}`));
  console.log(chalk.gray(`Mode: brownfield | Phases: ${PHASES.length} | First agent: strange + stark\n`));
  console.log(`Run ${chalk.cyan("'becky run'")} to start Phase 1, or ${chalk.cyan("'becky autopilot'")} to run all phases.`);
}

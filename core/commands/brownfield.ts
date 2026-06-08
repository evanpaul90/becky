/**
 * Becky Brownfield Command
 *
 * Creates a new brownfield task with the 11-phase, archaeology-first pipeline:
 * Archaeology → Document → Impact → Plan → Readiness GATE → Intervene → Code review
 * → Test+Chaos → Verify GATE → Docs → Learn. See core/sdlc.md.
 *
 * Usage: becky brownfield <task name>
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { getTasksDir } from "../workspace.js";
import { stringify as stringifyYaml } from "yaml";
import chalk from "chalk";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

const PHASES = [
  { key: "1-archaeology", folder: "phase-1-archaeology", agent: "vision + strange",  gate: "Audit complete — deps, dead routes, what truly exists" },
  { key: "2-document",    folder: "phase-2-document",    agent: "watcher",           gate: "Wiki covers the existing system" },
  { key: "3-impact",      folder: "phase-3-impact",      agent: "friday",            gate: "Blast radius mapped — every affected surface" },
  { key: "4-plan",        folder: "phase-4-plan",        agent: "fury + coulson",    gate: "Intervention plan approved — what changes, in what order" },
  { key: "5-readiness",   folder: "phase-5-readiness",   agent: "heimdall",          gate: "GATE: plan + env + release path ready" },
  { key: "6-intervene",   folder: "phase-6-intervene",   agent: "stark",             gate: "Targeted change built; build→lint→fix→test clean" },
  { key: "7-code-review", folder: "phase-7-code-review", agent: "loki",              gate: "Findings triaged; rules + lint clean" },
  { key: "8-test",        folder: "phase-8-test",        agent: "widow + deadpool",  gate: "Regression + chaos: existing features still work" },
  { key: "9-verify",      folder: "phase-9-verify",      agent: "heimdall",          gate: "GATE: DONE verdict with runtime proof" },
  { key: "10-docs",       folder: "phase-10-docs",       agent: "parker",            gate: "Docs updated to match the change" },
  { key: "11-knowledge",  folder: "phase-11-knowledge",  agent: "watcher",           gate: "Wiki + ledger reflect the change" },
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
    status: "phase-1-archaeology",
    current_agent: "vision + strange",
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
  const taskDir = join(getTasksDir(), slug);

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
  console.log(chalk.gray(`Mode: brownfield | Phases: ${PHASES.length} | First agent: vision + strange\n`));
  console.log(`Run ${chalk.cyan("'becky run'")} to start Phase 1, or ${chalk.cyan("'becky autopilot'")} to run all phases.`);
}

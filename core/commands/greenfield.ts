/**
 * Becky Greenfield Command
 *
 * Creates a new greenfield task with the 8-phase pipeline:
 * Discovery → Design → Architecture → Stories → Build → Test → Verify → Knowledge
 *
 * Usage: becky greenfield <task name>
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
  { key: "1-discovery",    folder: "phase-1-discovery",    agent: "fury",     gate: "Brief reviewed and approved" },
  { key: "2-design",       folder: "phase-2-design",       agent: "shuri",    gate: "Every FR has a UX home" },
  { key: "3-architecture", folder: "phase-3-architecture", agent: "strange",  gate: "PRD + UX + Architecture aligned" },
  { key: "4-stories",      folder: "phase-4-stories",      agent: "fury",     gate: "Stories trace to FRs, readiness check passes" },
  { key: "5-build",        folder: "phase-5-build",        agent: "stark",    gate: "Tests pass, push checklist clean" },
  { key: "6-test",         folder: "phase-6-test",         agent: "widow",    gate: "Critical paths covered with evidence" },
  { key: "7-verify",       folder: "phase-7-verify",       agent: "heimdall", gate: "Verdict filed with evidence" },
  { key: "8-knowledge",    folder: "phase-8-knowledge",    agent: "watcher",  gate: "Wiki index updated" },
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
    mode: "greenfield",
    created: today,
    status: "phase-1-discovery",
    current_agent: "fury",
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
    console.log(chalk.red("Usage: becky greenfield <task name>"));
    console.log(chalk.gray('  Example: becky greenfield "user authentication flow"'));
    process.exit(1);
  }

  const slug = slugify(taskName);
  const taskDir = join(BECKY_ROOT, "tasks", slug);

  // Create phase folders
  console.log(chalk.bold(`\nCreating greenfield task: ${taskName}\n`));

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
  console.log(chalk.gray(`Mode: greenfield | Phases: ${PHASES.length} | First agent: fury\n`));
  console.log(`Run ${chalk.cyan("'becky run'")} to start Phase 1, or ${chalk.cyan("'becky autopilot'")} to run all phases.`);
}

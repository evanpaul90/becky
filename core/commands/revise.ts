/**
 * Becky Revise Command
 *
 * Records feedback for the current phase and resets it to pending
 * so the agent can re-run with the new context.
 *
 * Usage: becky revise "your feedback here"
 */

import { readFileSync, readdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import chalk from "chalk";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseEntry {
  agent: string;
  status: string;
  gate: string;
  outputs: string[];
}

interface TaskYaml {
  task: string;
  slug: string;
  mode: string;
  created: string;
  status: string;
  current_agent: string;
  phases: Record<string, PhaseEntry>;
  autopilot: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findActiveTask(): { taskYaml: TaskYaml; taskDir: string } | null {
  const tasksDir = join(BECKY_ROOT, "tasks");
  if (!existsSync(tasksDir)) return null;

  const entries = readdirSync(tasksDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const yamlPath = join(tasksDir, entry.name, "_task.yaml");
    if (!existsSync(yamlPath)) continue;

    const raw = readFileSync(yamlPath, "utf-8");
    const taskYaml = parseYaml(raw) as TaskYaml;

    if (taskYaml.status !== "complete") {
      return { taskYaml, taskDir: join(tasksDir, entry.name) };
    }
  }

  return null;
}

function parsePhaseStatus(status: string): { number: string; name: string } | null {
  const match = status.match(/^phase-(\d+)-(.+)$/);
  if (!match) return null;
  return { number: match[1], name: match[2] };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
  const feedback = process.argv.slice(3).join(" ");

  if (!feedback) {
    console.log(chalk.red("Usage: becky revise \"your feedback here\""));
    console.log(chalk.gray("  Example: becky revise \"PRD is missing error handling requirements\""));
    process.exit(1);
  }

  const result = findActiveTask();

  if (!result) {
    console.log(chalk.yellow("No active task."));
    console.log(`Run ${chalk.cyan("'becky greenfield <name>'")} or ${chalk.cyan("'becky brownfield <name>'")} to create one.`);
    return;
  }

  const { taskYaml, taskDir } = result;
  const parsed = parsePhaseStatus(taskYaml.status);

  if (!parsed) {
    console.log(chalk.red(`Invalid task status: ${taskYaml.status}`));
    return;
  }

  const phaseKey = `${parsed.number}-${parsed.name}`;
  const phase = taskYaml.phases[phaseKey];

  if (!phase) {
    console.log(chalk.red(`Phase not found in _task.yaml: ${phaseKey}`));
    return;
  }

  // Write feedback to phase folder
  const phaseFolder = `phase-${parsed.number}-${parsed.name}`;
  const feedbackPath = join(taskDir, phaseFolder, "feedback.md");
  const timestamp = new Date().toISOString();
  const feedbackEntry = `\n## Feedback — ${timestamp}\n\n${feedback}\n`;

  if (existsSync(feedbackPath)) {
    appendFileSync(feedbackPath, feedbackEntry, "utf-8");
  } else {
    writeFileSync(feedbackPath, `# Phase ${parsed.number} Feedback\n${feedbackEntry}`, "utf-8");
  }

  // Reset phase status to pending
  phase.status = "pending";
  const updatedYaml = stringifyYaml(taskYaml, { lineWidth: 120 });
  writeFileSync(join(taskDir, "_task.yaml"), updatedYaml, "utf-8");

  // Print confirmation
  console.log(chalk.bold(`\nFeedback recorded in ${chalk.cyan(`${phaseFolder}/feedback.md`)}`));
  console.log(chalk.gray(`Phase ${parsed.number} — ${parsed.name} reset to pending.`));
  console.log(`\nRun ${chalk.cyan("'becky run'")} to re-run this phase.`);
}

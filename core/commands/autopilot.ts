/**
 * Becky Autopilot
 *
 * Finds the active task and runs all remaining phases autonomously
 * via the orchestrator. Heimdall flags anything that needs human review.
 *
 * Usage: becky autopilot [--deploy-staging]
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { getTasksDir } from "../workspace.js";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import chalk from "chalk";
import { orchestrate } from "../orchestrator.js";

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
  const tasksDir = getTasksDir();
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  const result = findActiveTask();

  if (!result) {
    console.error(chalk.red("No active task found."));
    console.error("Create a task first with 'becky greenfield' or 'becky brownfield'.");
    process.exit(1);
  }

  const { taskYaml, taskDir } = result;

  // Set autopilot flag
  taskYaml.autopilot = true;
  writeFileSync(join(taskDir, "_task.yaml"), stringifyYaml(taskYaml, { lineWidth: 120 }), "utf-8");

  const deployStaging = process.argv.includes("--deploy-staging");

  console.log("");
  console.log(chalk.bold.cyan("  AUTOPILOT MODE"));
  console.log("");
  console.log("  Running all remaining phases autonomously.");
  console.log("  Heimdall will flag anything that needs human review.");
  console.log("");

  try {
    await orchestrate(taskDir, { deployStaging });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  Autopilot failed: ${msg}`));
    process.exit(1);
  }
}

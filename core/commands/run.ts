/**
 * Becky Run Command
 *
 * Finds the active task, activates the current phase, and prints
 * agent context so the user knows what to feed their AI agent.
 *
 * Usage: becky run
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
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

interface AgentFrontmatter {
  id: string;
  name: string;
  consumes?: string[];
  produces?: string[];
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

function loadAgentFrontmatter(agentId: string): AgentFrontmatter | null {
  // Handle compound agents like "strange + stark"
  const primaryAgent = agentId.split("+")[0].trim();
  const agentPath = join(BECKY_ROOT, "agents", `${primaryAgent}.md`);
  if (!existsSync(agentPath)) return null;

  const raw = readFileSync(agentPath, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  return parseYaml(fmMatch[1]) as AgentFrontmatter;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
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

  // Update phase status to active
  phase.status = "active";
  const updatedYaml = stringifyYaml(taskYaml, { lineWidth: 120 });
  writeFileSync(join(taskDir, "_task.yaml"), updatedYaml, "utf-8");

  // Print task + phase header
  console.log(chalk.bold(`\nTask: ${taskYaml.task}`));
  console.log(`Phase: ${chalk.cyan(`${parsed.number} — ${parsed.name}`)} | Agent: ${chalk.yellow(phase.agent)}\n`);

  // Print agent context
  console.log(chalk.bold(`Agent ${chalk.yellow(phase.agent)} is ready. The agent will:`));

  // Load agent frontmatter for consumes/produces
  const agentFm = loadAgentFrontmatter(phase.agent);

  if (agentFm?.consumes && agentFm.consumes.length > 0) {
    console.log(chalk.gray("  Read:"));
    for (const item of agentFm.consumes) {
      console.log(`    ${chalk.gray("•")} ${item}`);
    }
  }

  if (agentFm?.produces && agentFm.produces.length > 0) {
    console.log(chalk.gray("  Produce:"));
    for (const item of agentFm.produces) {
      console.log(`    ${chalk.gray("•")} ${item}`);
    }
  }

  // Print gate
  console.log(`\n${chalk.bold("Gate:")} ${phase.gate}`);

  // Print next steps
  const phaseFolder = `phase-${parsed.number}-${parsed.name}`;
  console.log(`\nRun your AI agent with the context from ${chalk.cyan(`tasks/${taskYaml.slug}/${phaseFolder}/`)}`);
  console.log(`\nWhen done, run ${chalk.cyan("'becky approve'")} to pass the gate, or ${chalk.cyan("'becky revise \"feedback\"'")} to iterate.`);
}

/**
 * Becky Autopilot
 *
 * Scans tasks/ for an active task, then writes _autopilot-instructions.md
 * into every remaining phase folder so an AI agent can execute sequentially.
 *
 * Usage: becky autopilot
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import chalk from "chalk";

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

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
  const body = match[2].trim();
  return { frontmatter, body };
}

function loadAgent(agentId: string): AgentFrontmatter | null {
  const primaryAgent = agentId.split("+")[0].trim();
  const agentPath = join(BECKY_ROOT, "agents", `${primaryAgent}.md`);
  if (!existsSync(agentPath)) return null;
  const raw = readFileSync(agentPath, "utf-8");
  const { frontmatter } = parseFrontmatter(raw);
  return frontmatter as unknown as AgentFrontmatter;
}

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

function collectPreviousOutputs(taskDir: string, phaseKeys: string[], upToIndex: number): string[] {
  const outputs: string[] = [];

  for (let i = 0; i < upToIndex; i++) {
    const phaseFolder = `phase-${phaseKeys[i]}`;
    const phaseDir = join(taskDir, phaseFolder);
    if (!existsSync(phaseDir)) continue;

    const files = readdirSync(phaseDir).filter(
      (f) => !f.startsWith("_") && !f.startsWith(".")
    );
    for (const file of files) {
      outputs.push(`${phaseFolder}/${file}`);
    }
  }

  return outputs;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
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

  console.log("");
  console.log(chalk.bold.cyan("AUTOPILOT MODE") + " \u2014 Running all remaining phases.");
  console.log(chalk.dim("Human-judgment gates will be auto-passed with [AUTOPILOT] flag."));
  console.log(chalk.dim("Heimdall will flag anything that needs human review."));
  console.log("");

  // Sort phase keys numerically (e.g., "1-discovery", "2-design", ...)
  const phaseKeys = Object.keys(taskYaml.phases).sort((a, b) => {
    const numA = parseInt(a.split("-")[0], 10);
    const numB = parseInt(b.split("-")[0], 10);
    return numA - numB;
  });

  let instructionsWritten = 0;

  phaseKeys.forEach((phaseKey, idx) => {
    const phase = taskYaml.phases[phaseKey];

    if (phase.status !== "pending") return;

    const phaseNum = phaseKey.split("-")[0];
    const phaseName = phaseKey.split("-").slice(1).join("-");

    console.log(
      `  Phase ${phaseNum} \u2014 ${chalk.bold(phaseName)} (${chalk.yellow(phase.agent)})... `
    );

    // Load agent metadata
    const agent = loadAgent(phase.agent);
    const agentName = agent?.name ?? phase.agent;
    const agentConsumes = agent?.consumes ?? [];
    const agentProduces = agent?.produces ?? [];

    // Ensure phase directory exists
    const phaseFolder = `phase-${phaseKey}`;
    const phaseDir = join(taskDir, phaseFolder);
    if (!existsSync(phaseDir)) {
      mkdirSync(phaseDir, { recursive: true });
    }

    // Collect previous phase outputs
    const previousOutputs = collectPreviousOutputs(taskDir, phaseKeys, idx);

    // Build instructions
    let instructions = `# Autopilot Instructions \u2014 Phase ${phaseNum}\n\n`;
    instructions += `## Agent\n\n`;
    instructions += `- **Name:** ${agentName}\n`;
    instructions += `- **ID:** ${phase.agent}\n\n`;

    instructions += `## What to Read\n\n`;
    if (agentConsumes.length > 0) {
      for (const path of agentConsumes) {
        instructions += `- \`${path}\`\n`;
      }
    } else {
      instructions += `- _(no consumes defined for this agent)_\n`;
    }
    instructions += `\n`;

    instructions += `## What to Produce\n\n`;
    if (agentProduces.length > 0) {
      for (const path of agentProduces) {
        instructions += `- \`${path}\`\n`;
      }
    } else {
      instructions += `- _(no produces defined for this agent)_\n`;
    }
    instructions += `\n`;

    instructions += `## Gate Criteria\n\n`;
    instructions += `${phase.gate || "_(no gate defined)_"}\n\n`;

    instructions += `## Previous Phase Outputs\n\n`;
    if (previousOutputs.length > 0) {
      for (const output of previousOutputs) {
        instructions += `- \`${output}\`\n`;
      }
    } else {
      instructions += `- _(no previous outputs \u2014 this is the first phase)_\n`;
    }
    instructions += `\n`;

    instructions += `---\n\n`;
    instructions += `**AUTOPILOT MODE:** Complete this phase fully. Write all outputs to this directory.\n`;

    // Write instructions file
    const instructionsPath = join(phaseDir, "_autopilot-instructions.md");
    writeFileSync(instructionsPath, instructions, "utf-8");

    // Update phase status to ready
    phase.status = "ready";

    console.log(
      chalk.green("  \u2713") +
        ` Instructions written to ${phaseFolder}/_autopilot-instructions.md`
    );

    instructionsWritten++;
  });

  // Persist updated task yaml with phase statuses
  writeFileSync(join(taskDir, "_task.yaml"), stringifyYaml(taskYaml, { lineWidth: 120 }), "utf-8");

  console.log("");
  console.log(
    chalk.bold(`Autopilot instructions written for ${instructionsWritten} phases.`)
  );
  console.log("Each phase folder now contains _autopilot-instructions.md with full context.");
  console.log("Run your AI agent on each phase folder in sequence.");
  console.log("");
}

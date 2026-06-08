/**
 * Becky Onboard
 *
 * Interactive walkthrough that orients the user to Becky OS: folder structure,
 * agent roster, available commands, and next-step suggestions.
 *
 * Usage: npx tsx core/cli.ts onboard
 */

import chalk from "chalk";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { getTasksDir, getWikiDir } from "../workspace.js";
import { parse as parseYaml } from "yaml";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface FolderInfo {
  path: string;
  description: string;
}

const FOLDERS: FolderInfo[] = [
  { path: "core/rules/",     description: "Codified rules that agents enforce — the law of the land" },
  { path: "agents/",         description: "Agent definitions — each file is one role with triggers and permissions" },
  { path: "wiki/",           description: "Project knowledge base — raw inputs and compiled articles" },
  { path: "memory/",         description: "Persistent memory — global, project-scoped, and session-scoped" },
  { path: "tasks/",          description: "Active tasks — each subfolder is a pipeline in progress" },
  { path: "modes/",          description: "Pipeline definitions — greenfield, brownfield, and custom modes" },
  { path: "loop/",           description: "Closed learning loops — retros, incidents, skill distillation" },
  { path: "bridge/",         description: "A2A bridge templates — coordinate between Claude and Codex runtimes" },
];

interface AgentInfo {
  id: string;
  name: string;
  role: string;
}

const AGENTS: AgentInfo[] = [
  { id: "fury",     name: "Fury",     role: "Product Manager — owns briefs, PRDs, and requirements discovery" },
  { id: "strange",  name: "Strange",  role: "Architect — designs system architecture and technical decisions" },
  { id: "shuri",    name: "Shuri",    role: "UX Designer — creates UX specs and interaction patterns" },
  { id: "stark",    name: "Stark",    role: "Developer — implements code from specs and architecture" },
  { id: "widow",    name: "Widow",    role: "QA Engineer — writes tests and validates acceptance criteria" },
  { id: "heimdall", name: "Heimdall", role: "Gatekeeper — reviews verdicts, enforces quality standards" },
  { id: "watcher",  name: "Watcher",  role: "Scribe — compiles wiki, runs retros, distills knowledge" },
];

interface CommandInfo {
  name: string;
  description: string;
}

const COMMAND_LIST: CommandInfo[] = [
  { name: "init",       description: "Initialize Becky in a target project" },
  { name: "compile",    description: "Generate CLAUDE.md and AGENTS.md from rules" },
  { name: "verify",     description: "Check rules, agents, and wiki for issues" },
  { name: "onboard",    description: "Interactive walkthrough (you are here)" },
  { name: "learn",      description: "Import existing docs into the wiki" },
  { name: "greenfield", description: "Start a new project from scratch" },
  { name: "brownfield", description: "Onboard an existing codebase" },
  { name: "run",        description: "Execute a task pipeline" },
  { name: "approve",    description: "Approve a pending verdict or deliverable" },
  { name: "revise",     description: "Request revisions on a deliverable" },
  { name: "autopilot",  description: "Run the full pipeline unattended" },
  { name: "status",     description: "Show current project state and counts" },
  { name: "assemble",   description: "Assemble agents for a task" },
  { name: "retro",      description: "Run a retrospective on completed work" },
  { name: "rules add",  description: "Add a new rule interactively" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function section(title: string): void {
  console.log();
  console.log(chalk.bold.magenta(`  ${title}`));
  console.log(chalk.dim("  " + "─".repeat(title.length + 2)));
}

function hasFolderContents(dir: string): boolean {
  if (!existsSync(dir)) return false;
  try {
    const entries = readdirSync(dir);
    return entries.some((e) => !e.startsWith("."));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  // Welcome
  console.log();
  console.log(chalk.bold.magenta("  Welcome to Becky OS."));
  console.log();
  console.log(
    "  Becky is a multi-agent coding OS. Agents collaborate through a shared"
  );
  console.log(
    "  wiki, enforce codified rules, and run structured pipelines to ship"
  );
  console.log("  software with high quality and full traceability.");

  // Folder structure
  section("Folder Structure");
  for (const folder of FOLDERS) {
    const fullPath = join(BECKY_ROOT, folder.path);
    const exists = existsSync(fullPath);
    const status = exists ? chalk.green("exists") : chalk.red("missing");
    console.log(
      `    ${chalk.cyan(folder.path.padEnd(18))} ${folder.description} [${status}]`
    );
  }

  // Agent roster
  section("Agent Roster");
  for (const agent of AGENTS) {
    console.log(
      `    ${chalk.yellow(agent.name.padEnd(12))} ${agent.role}`
    );
  }

  // Commands
  section("Available Commands");
  const maxLen = Math.max(...COMMAND_LIST.map((c) => c.name.length));
  for (const cmd of COMMAND_LIST) {
    console.log(
      `    becky ${chalk.green(cmd.name.padEnd(maxLen + 2))} ${cmd.description}`
    );
  }

  // Config check
  section("Configuration");
  const configPath = join(BECKY_ROOT, "becky.config.yaml");
  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, "utf-8");
    const config = parseYaml(raw) as Record<string, Record<string, string>>;
    const projectName = config?.project?.name;
    const userName = config?.user?.name;

    if (!projectName || !userName) {
      console.log(
        chalk.yellow("    becky.config.yaml needs attention:")
      );
      if (!projectName) {
        console.log(
          `      - ${chalk.cyan("project.name")} is empty — set your project name`
        );
      }
      if (!userName) {
        console.log(
          `      - ${chalk.cyan("user.name")} is empty — set your name so agents can address you`
        );
      }
      console.log();
      console.log(
        `    Edit: ${chalk.cyan(configPath)}`
      );
    } else {
      console.log(
        `    Project: ${chalk.bold(projectName)}  |  User: ${chalk.bold(userName)}`
      );
    }
  } else {
    console.log(
      chalk.yellow("    becky.config.yaml not found — run ") +
        chalk.green("becky init") +
        chalk.yellow(" first")
    );
  }

  // Tasks check
  section("Next Steps");
  const tasksDir = getTasksDir();
  const hasTaskFolders =
    existsSync(tasksDir) &&
    readdirSync(tasksDir).some(
      (e) => !e.startsWith(".") && !e.startsWith("_")
    );

  if (!hasTaskFolders) {
    console.log(
      "    No tasks found. To get started:"
    );
    console.log(
      `      ${chalk.green("becky greenfield")}   Start a new project from scratch`
    );
    console.log(
      `      ${chalk.green("becky brownfield")}   Onboard an existing codebase`
    );
  } else {
    console.log(
      `    Tasks found in ${chalk.cyan("tasks/")} — run ${chalk.green("becky status")} to see current state.`
    );
  }

  // Wiki check
  const compiledDir = join(getWikiDir(), "compiled");
  const hasArticles =
    existsSync(compiledDir) &&
    ["concepts", "decisions", "incidents"].some((sub) =>
      hasFolderContents(join(compiledDir, sub))
    );

  if (!hasArticles) {
    console.log();
    console.log(
      "    Wiki is empty. If you have existing docs:"
    );
    console.log(
      `      ${chalk.green("becky learn ./path/to/docs")}   Import markdown files into wiki`
    );
  }

  console.log();
}

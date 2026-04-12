/**
 * Becky CLI
 *
 * Main router for `becky <command>`. Reads process.argv[2] as the command
 * name and dynamically imports the corresponding handler.
 *
 * Usage: npx tsx core/cli.ts <command> [args...]
 */

import chalk from "chalk";
import { resolve, dirname } from "node:path";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

// ---------------------------------------------------------------------------
// Command registry
// ---------------------------------------------------------------------------

interface CommandEntry {
  path: string;
  description: string;
}

const COMMANDS: Record<string, CommandEntry> = {
  init:       { path: "core/init.ts",               description: "Initialize Becky in a target project" },
  compile:    { path: "core/compile.ts",             description: "Generate CLAUDE.md and AGENTS.md from rules" },
  verify:     { path: "core/verify.ts",              description: "Check rules, agents, and wiki for issues" },
  onboard:    { path: "core/commands/onboard.ts",    description: "Interactive walkthrough of Becky OS" },
  learn:      { path: "core/commands/learn.ts",      description: "Import existing docs into the wiki" },
  greenfield: { path: "core/commands/greenfield.ts", description: "Start a new project from scratch" },
  brownfield: { path: "core/commands/brownfield.ts", description: "Onboard an existing codebase" },
  run:        { path: "core/commands/run.ts",        description: "Execute a task pipeline" },
  approve:    { path: "core/commands/approve.ts",    description: "Approve a pending verdict or deliverable" },
  revise:     { path: "core/commands/revise.ts",     description: "Request revisions on a deliverable" },
  autopilot:  { path: "core/commands/autopilot.ts",  description: "Run the full pipeline unattended" },
  status:     { path: "core/commands/status.ts",     description: "Show current project state and counts" },
  assemble:   { path: "core/commands/assemble.ts",   description: "Assemble agents for a task" },
  retro:      { path: "core/commands/retro.ts",      description: "Run a retrospective on completed work" },
  rules:      { path: "core/commands/rules-add.ts",  description: "Manage rules (subcommands: add)" },
};

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log();
  console.log(chalk.bold.magenta("  Becky") + " — multi-agent coding OS");
  console.log();
  console.log(chalk.dim("  Usage:") + "  becky <command> [args...]");
  console.log();
  console.log(chalk.dim("  Commands:"));
  console.log();

  const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  for (const [name, entry] of Object.entries(COMMANDS)) {
    console.log(
      `    ${chalk.green(name.padEnd(maxLen + 2))}${entry.description}`
    );
  }

  console.log();
  console.log(chalk.dim("  Examples:"));
  console.log(`    becky ${chalk.green("onboard")}                 Interactive walkthrough`);
  console.log(`    becky ${chalk.green("learn")} ./docs             Import markdown docs into wiki`);
  console.log(`    becky ${chalk.green("status")}                  Show current state`);
  console.log(`    becky ${chalk.green("rules")} add               Add a new rule interactively`);
  console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  // Special case: `becky rules add` routes to rules-add.ts
  if (command === "rules") {
    const sub = process.argv[3];
    if (sub === "add") {
      const modPath = resolve(BECKY_ROOT, COMMANDS.rules.path);
      const mod = await import(modPath);
      await (mod.run ?? mod.default)();
      return;
    }
    console.log(chalk.red(`Unknown rules subcommand: ${sub ?? "(none)"}`));
    console.log(`  Available: becky rules add`);
    process.exit(1);
  }

  const entry = COMMANDS[command];
  if (!entry) {
    console.log(chalk.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
  }

  const modPath = resolve(BECKY_ROOT, entry.path);
  const mod = await import(modPath);

  // Handlers export either run() or default()
  if (typeof mod.run === "function") {
    await mod.run();
  } else if (typeof mod.default === "function") {
    await mod.default();
  } else {
    // Fallback: the module's top-level code already executed on import (like compile.ts)
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal:"), err instanceof Error ? err.message : err);
  process.exit(1);
});

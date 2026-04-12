/**
 * Becky Assemble — The War Room
 *
 * Creates a structured _assemble.md for multi-agent problem analysis.
 * Each of the 7 agents brings their specific lens and elicitation technique.
 *
 * Usage: becky assemble "describe your problem"
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import chalk from "chalk";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

interface AgentLens {
  name: string;
  lens: string;
  firstQuestion: string;
  technique: string;
}

const AGENTS: AgentLens[] = [
  {
    name: "Fury",
    lens: "Blast radius & stakes",
    firstQuestion: "Who is affected? How many? Since when? What changed?",
    technique: "5 Whys",
  },
  {
    name: "Strange",
    lens: "Architecture & root cause",
    firstQuestion: "What's the data flow? Where could this break? Which rules apply?",
    technique: "Architecture Trace",
  },
  {
    name: "Shuri",
    lens: "User experience & broken promises",
    firstQuestion: "What does the user see? What were they promised? Where's the trust break?",
    technique: "Broken Promise Audit",
  },
  {
    name: "Stark",
    lens: "Code path & implementation",
    firstQuestion: "Show me the code path. Which file, which line, which function?",
    technique: "Code Trace",
  },
  {
    name: "Widow",
    lens: "Reproduction & evidence",
    firstQuestion: "Can I reproduce this? What's the test? What evidence do we need?",
    technique: "Reproduction Protocol",
  },
  {
    name: "Heimdall",
    lens: "Exit criteria & verification",
    firstQuestion: "What does DONE look like for this fix? What evidence will I need?",
    technique: "Pre-mortem",
  },
  {
    name: "Watcher",
    lens: "History & pattern matching",
    firstQuestion: "Has this happened before? What does the wiki say? Which incident does this resemble?",
    technique: "Pattern Match",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSlug(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `assemble-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function buildAssembleDoc(problem: string): string {
  let doc = `# War Room — Avenger Assemble\n\n`;
  doc += `**Problem:** ${problem}\n\n`;
  doc += `---\n\n`;

  // Phase 1: First Reads
  doc += `## Phase 1: First Reads\n\n`;
  doc += `Each agent gives their immediate reaction from their specific lens.\n\n`;

  for (const agent of AGENTS) {
    doc += `### ${agent.name}'s Read\n\n`;
    doc += `**Lens:** ${agent.lens}\n`;
    doc += `**First question:** ${agent.firstQuestion}\n`;
    doc += `**Technique:** ${agent.technique}\n\n`;
    doc += `_(pending)_\n\n`;
  }

  // Phase 2: Deep Dives
  doc += `---\n\n`;
  doc += `## Phase 2: Elicitation Deep Dives\n\n`;
  doc += `Based on first reads, agents probe deeper using their specialized techniques.\n\n`;

  for (const agent of AGENTS) {
    doc += `### ${agent.name} — ${agent.technique}\n\n`;
    doc += `_(pending)_\n\n`;
  }

  // Phase 3: Debate
  doc += `---\n\n`;
  doc += `## Phase 3: Debate & Convergence\n\n`;
  doc += `Agents challenge each other's proposals. Agreement without tension means someone isn't doing their job.\n\n`;
  doc += `_(pending)_\n\n`;

  // Phase 4: Convergence
  doc += `---\n\n`;
  doc += `## Phase 4: Convergence\n\n`;
  doc += `### Root Cause\n\n`;
  doc += `_(agreed by Strange + Stark + Watcher)_\n\n`;
  doc += `### Fix Plan\n\n`;
  doc += `_(proposed by Stark, reviewed by Strange)_\n\n`;
  doc += `### Exit Criteria\n\n`;
  doc += `_(locked by Heimdall)_\n\n`;
  doc += `### Assignments\n\n`;
  doc += `| Agent | Action |\n`;
  doc += `|-------|--------|\n`;
  doc += `| Stark | |\n`;
  doc += `| Widow | |\n`;
  doc += `| Heimdall | |\n`;
  doc += `| Watcher | |\n`;
  doc += `| Fury | |\n`;
  doc += `| Strange | |\n`;
  doc += `| Shuri | |\n`;

  return doc;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
  const problem = process.argv.slice(3).join(" ").trim();

  if (!problem) {
    console.error(chalk.red('Usage: becky assemble "describe your problem"'));
    process.exit(1);
  }

  const slug = buildSlug();
  const taskDir = join(BECKY_ROOT, "tasks", slug);
  mkdirSync(taskDir, { recursive: true });

  const doc = buildAssembleDoc(problem);
  const docPath = join(taskDir, "_assemble.md");
  writeFileSync(docPath, doc, "utf-8");

  console.log("");
  console.log(chalk.bold(`War room created at tasks/${slug}/`));
  console.log("Open _assemble.md and work through it with your AI agent.");
  console.log("");
  console.log(chalk.bold("The 7 Agents:"));
  console.log("");

  const maxName = Math.max(...AGENTS.map((a) => a.name.length));
  for (const agent of AGENTS) {
    console.log(
      `  ${chalk.yellow(agent.name.padEnd(maxName + 2))}${agent.lens}`
    );
  }

  console.log("");
}

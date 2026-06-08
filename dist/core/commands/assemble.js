/**
 * Becky Assemble — The War Room
 *
 * Creates a structured _assemble.md for multi-agent problem analysis.
 * Each of the 15 agents — the 13-agent council plus the 2 Wordsmiths —
 * brings their specific lens and elicitation technique.
 *
 * Usage: becky assemble "describe your problem"
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getTasksDir } from "../workspace.js";
import chalk from "chalk";
const AGENTS = [
    {
        name: "Vision",
        lens: "Prior art & feasibility",
        firstQuestion: "Has anyone already solved this? What's out there before we build?",
        technique: "Prior-Art Search",
    },
    {
        name: "Fury",
        lens: "Blast radius & stakes",
        firstQuestion: "Who is affected? How many? Since when? What changed?",
        technique: "5 Whys",
    },
    {
        name: "Coulson",
        lens: "Requirements & exit shape",
        firstQuestion: "What does done look like, exactly? Where are the numbered, testable requirements?",
        technique: "Acceptance Trace",
    },
    {
        name: "Xavier",
        lens: "Domain knowledge",
        firstQuestion: "What does the industry already know? Which edge cases and compliance traps apply?",
        technique: "Domain Recall",
    },
    {
        name: "Shuri",
        lens: "User experience & broken promises",
        firstQuestion: "What does the user see? What were they promised? Where's the trust break?",
        technique: "Broken Promise Audit",
    },
    {
        name: "Strange",
        lens: "Architecture & root cause",
        firstQuestion: "What's the data flow? Where could this break? Which rules apply?",
        technique: "Architecture Trace",
    },
    {
        name: "Stark",
        lens: "Code path & implementation",
        firstQuestion: "Show me the code path. Which file, which line, which function?",
        technique: "Code Trace",
    },
    {
        name: "Loki",
        lens: "Adversarial review",
        firstQuestion: "How would I break this? Which assumption doesn't hold under pressure?",
        technique: "Red-Team",
    },
    {
        name: "Widow",
        lens: "Reproduction & evidence",
        firstQuestion: "Can I reproduce this? What's the test? What evidence do we need?",
        technique: "Reproduction Protocol",
    },
    {
        name: "Deadpool",
        lens: "Chaos & abuse",
        firstQuestion: "What if I abuse it? What happens when I do the thing nobody's supposed to do?",
        technique: "Abuse Case",
    },
    {
        name: "Friday",
        lens: "Impact analysis",
        firstQuestion: "How many surfaces does this touch? What's the full blast radius?",
        technique: "Blast Radius Map",
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
    {
        name: "Parker",
        lens: "Docs & guides",
        firstQuestion: "Will the docs still be true after this? What did we just make a lie?",
        technique: "Doc Truth Check",
    },
    {
        name: "Quill",
        lens: "DevRel & announcements",
        firstQuestion: "Is this worth announcing? And is the change real and verified before I write a word?",
        technique: "Changelog Anchor",
    },
];
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildSlug() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `assemble-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}
function buildAssembleDoc(problem) {
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
    for (const agent of AGENTS) {
        doc += `| ${agent.name} | |\n`;
    }
    return doc;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function run() {
    const problem = process.argv.slice(3).join(" ").trim();
    if (!problem) {
        console.error(chalk.red('Usage: becky assemble "describe your problem"'));
        process.exit(1);
    }
    const slug = buildSlug();
    const taskDir = join(getTasksDir(), slug);
    mkdirSync(taskDir, { recursive: true });
    const doc = buildAssembleDoc(problem);
    const docPath = join(taskDir, "_assemble.md");
    writeFileSync(docPath, doc, "utf-8");
    console.log("");
    console.log(chalk.bold(`War room created at tasks/${slug}/`));
    console.log("Open _assemble.md and work through it with your AI agent.");
    console.log("");
    console.log(chalk.bold("The 15 Agents:"));
    console.log("");
    const maxName = Math.max(...AGENTS.map((a) => a.name.length));
    for (const agent of AGENTS) {
        console.log(`  ${chalk.yellow(agent.name.padEnd(maxName + 2))}${agent.lens}`);
    }
    console.log("");
}

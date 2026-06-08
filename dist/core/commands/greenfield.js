/**
 * Becky Greenfield Command
 *
 * Creates a new greenfield task with the full 14-phase SDLC (all 15 agents used):
 * Research → Discovery → Requirements → Adversarial review → Experience → Architecture
 * → Readiness GATE → Stories → Build → Code review → Test+Chaos → Verify GATE → Docs → Announce
 * See core/sdlc.md.
 *
 * Usage: becky greenfield <task name>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getTasksDir } from "../workspace.js";
import { stringify as stringifyYaml } from "yaml";
import chalk from "chalk";
// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------
const PHASES = [
    { key: "1-research", folder: "phase-1-research", agent: "vision", gate: "Landscape mapped — prior art, competitors, feasibility" },
    { key: "2-discovery", folder: "phase-2-discovery", agent: "fury", gate: "Brief approved — the real problem is named" },
    { key: "3-requirements", folder: "phase-3-requirements", agent: "coulson", gate: "Numbered, testable FRs + stories, traced to needs" },
    { key: "4-review-prd", folder: "phase-4-review-prd", agent: "loki", gate: "PRD red-teamed; gaps and edge cases closed" },
    { key: "5-experience", folder: "phase-5-experience", agent: "shuri", gate: "Every FR has a UX home; all states designed" },
    { key: "6-architecture", folder: "phase-6-architecture", agent: "strange", gate: "Data model + contracts verified against the live system" },
    { key: "7-readiness", folder: "phase-7-readiness", agent: "heimdall", gate: "GATE: specs aligned, release path + env ready" },
    { key: "8-stories", folder: "phase-8-stories", agent: "coulson", gate: "ACs written as executable assertions" },
    { key: "9-build", folder: "phase-9-build", agent: "stark", gate: "Build→lint→fix→test loop clean (Friday traces impact)" },
    { key: "10-code-review", folder: "phase-10-code-review", agent: "loki", gate: "Rules + lint compliance; findings triaged" },
    { key: "11-test", folder: "phase-11-test", agent: "widow + deadpool", gate: "Runtime e2e + chaos: critical paths & invariants covered" },
    { key: "12-verify", folder: "phase-12-verify", agent: "heimdall + watcher", gate: "GATE: DONE verdict with runtime proof; lessons captured" },
    { key: "13-docs", folder: "phase-13-docs", agent: "parker", gate: "Docs match the shipped code; 5-minute onboarding" },
    { key: "14-announce", folder: "phase-14-announce", agent: "quill", gate: "Release notes anchored to the verdict — no vaporware" },
];
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(name) {
    const today = new Date().toISOString().split("T")[0];
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return `${today}-${slug}`;
}
function buildTaskYaml(taskName, slug) {
    const today = new Date().toISOString().split("T")[0];
    const phases = {};
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
        status: "phase-1-research",
        current_agent: "vision",
        phases,
        autopilot: false,
    };
    return stringifyYaml(doc, { lineWidth: 120 });
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function run() {
    const taskName = process.argv.slice(3).join(" ");
    if (!taskName) {
        console.log(chalk.red("Usage: becky greenfield <task name>"));
        console.log(chalk.gray('  Example: becky greenfield "user authentication flow"'));
        process.exit(1);
    }
    const slug = slugify(taskName);
    const taskDir = join(getTasksDir(), slug);
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
    console.log(chalk.gray(`Mode: greenfield | Phases: ${PHASES.length} | First agent: vision\n`));
    console.log(`Run ${chalk.cyan("'becky run'")} to start Phase 1, or ${chalk.cyan("'becky autopilot'")} to run all phases.`);
}

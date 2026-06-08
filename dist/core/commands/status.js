/**
 * Becky Status
 *
 * Shows the current state of the Becky workspace: active tasks, rule count,
 * wiki article count, and memory entry count.
 *
 * Usage: npx tsx core/cli.ts status
 */
import chalk from "chalk";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { getInstallRoot } from "../paths.js";
import { getTasksDir, getWikiDir, getMemoryDir } from "../workspace.js";
import { parse as parseYaml } from "yaml";
const BECKY_ROOT = getInstallRoot();
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function countMdFiles(dir) {
    if (!existsSync(dir))
        return 0;
    try {
        return readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).length;
    }
    catch {
        return 0;
    }
}
function countAllMdFiles(dir) {
    if (!existsSync(dir))
        return 0;
    let count = 0;
    try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                count += countAllMdFiles(fullPath);
            }
            else if (entry.endsWith(".md") && !entry.startsWith("_")) {
                count++;
            }
        }
    }
    catch {
        // Ignore unreadable directories
    }
    return count;
}
function loadTasks() {
    const tasksDir = getTasksDir();
    if (!existsSync(tasksDir))
        return [];
    const tasks = [];
    const entries = readdirSync(tasksDir);
    for (const entry of entries) {
        if (entry.startsWith(".") || entry.startsWith("_"))
            continue;
        const taskDir = join(tasksDir, entry);
        const stat = statSync(taskDir);
        if (!stat.isDirectory())
            continue;
        const taskFile = join(taskDir, "_task.yaml");
        if (!existsSync(taskFile)) {
            tasks.push({
                name: entry,
                mode: "unknown",
                phase: "unknown",
                status: "no _task.yaml",
            });
            continue;
        }
        try {
            const raw = readFileSync(taskFile, "utf-8");
            const data = parseYaml(raw);
            tasks.push({
                name: data.name || entry,
                mode: data.mode || "unknown",
                phase: data.phase || "unknown",
                status: data.status || "unknown",
            });
        }
        catch {
            tasks.push({
                name: entry,
                mode: "parse error",
                phase: "parse error",
                status: "parse error",
            });
        }
    }
    return tasks;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function run() {
    console.log();
    console.log(chalk.bold.magenta("  Becky Status"));
    console.log(chalk.dim("  " + "─".repeat(14)));
    // Tasks
    const tasks = loadTasks();
    console.log();
    console.log(chalk.bold("  Tasks"));
    if (tasks.length === 0) {
        console.log(chalk.dim("    No active tasks."));
    }
    else {
        const nameWidth = Math.max(...tasks.map((t) => t.name.length), 4);
        const modeWidth = Math.max(...tasks.map((t) => t.mode.length), 4);
        const phaseWidth = Math.max(...tasks.map((t) => t.phase.length), 5);
        // Header
        console.log(chalk.dim(`    ${"Name".padEnd(nameWidth + 2)}${"Mode".padEnd(modeWidth + 2)}${"Phase".padEnd(phaseWidth + 2)}Status`));
        for (const task of tasks) {
            const statusColor = task.status === "done"
                ? chalk.green
                : task.status === "in-progress"
                    ? chalk.yellow
                    : chalk.dim;
            console.log(`    ${chalk.cyan(task.name.padEnd(nameWidth + 2))}${task.mode.padEnd(modeWidth + 2)}${task.phase.padEnd(phaseWidth + 2)}${statusColor(task.status)}`);
        }
    }
    // Counts
    console.log();
    console.log(chalk.bold("  Counts"));
    const rulesDir = join(BECKY_ROOT, "core", "rules");
    const ruleCount = countMdFiles(rulesDir);
    const wikiCompiledDir = join(getWikiDir(), "compiled");
    const wikiCount = countAllMdFiles(wikiCompiledDir);
    const memoryProjectDir = join(getMemoryDir(), "project");
    const memoryGlobalDir = join(getMemoryDir(), "global");
    const memoryProjectCount = countMdFiles(memoryProjectDir);
    const memoryGlobalCount = countMdFiles(memoryGlobalDir);
    const memoryTotal = memoryProjectCount + memoryGlobalCount;
    const agentsDir = join(BECKY_ROOT, "agents");
    const agentCount = countMdFiles(agentsDir);
    console.log(`    Rules:          ${chalk.bold(String(ruleCount))}`);
    console.log(`    Wiki articles:  ${chalk.bold(String(wikiCount))}`);
    console.log(`    Memory entries: ${chalk.bold(String(memoryTotal))} (${memoryProjectCount} project, ${memoryGlobalCount} global)`);
    console.log(`    Agents:         ${chalk.bold(String(agentCount))}`);
    console.log(`    Active tasks:   ${chalk.bold(String(tasks.length))}`);
    // Config snapshot
    const configPath = join(BECKY_ROOT, "becky.config.yaml");
    if (existsSync(configPath)) {
        try {
            const raw = readFileSync(configPath, "utf-8");
            const config = parseYaml(raw);
            const projectName = config?.project?.name;
            const runtime = config?.runtime?.primary;
            const verifier = config?.runtime?.verifier;
            console.log();
            console.log(chalk.bold("  Config"));
            console.log(`    Project:  ${projectName ? chalk.bold(projectName) : chalk.yellow("(not set)")}`);
            console.log(`    Runtime:  ${runtime || "claude"} (primary) / ${verifier || "codex"} (verifier)`);
        }
        catch {
            // Config parse failure is non-fatal for status
        }
    }
    console.log();
}

/**
 * Becky Approve Command
 *
 * Passes the gate on the current phase, records outputs, and advances
 * the task to the next phase (or marks it complete).
 *
 * Usage: becky approve
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getTasksDir } from "../workspace.js";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import chalk from "chalk";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findActiveTask() {
    const tasksDir = getTasksDir();
    if (!existsSync(tasksDir))
        return null;
    const entries = readdirSync(tasksDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const yamlPath = join(tasksDir, entry.name, "_task.yaml");
        if (!existsSync(yamlPath))
            continue;
        const raw = readFileSync(yamlPath, "utf-8");
        const taskYaml = parseYaml(raw);
        if (taskYaml.status !== "complete") {
            return { taskYaml, taskDir: join(tasksDir, entry.name) };
        }
    }
    return null;
}
function parsePhaseStatus(status) {
    const match = status.match(/^phase-(\d+)-(.+)$/);
    if (!match)
        return null;
    return { number: match[1], name: match[2] };
}
function listPhaseFiles(phaseDir) {
    if (!existsSync(phaseDir))
        return [];
    return readdirSync(phaseDir).filter((f) => !f.startsWith("."));
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function run() {
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
    // Mark current phase as passed
    phase.status = "passed";
    // Record outputs from the phase folder
    const phaseFolder = `phase-${parsed.number}-${parsed.name}`;
    const phaseDir = join(taskDir, phaseFolder);
    const files = listPhaseFiles(phaseDir);
    phase.outputs = files;
    if (files.length > 0) {
        console.log(chalk.gray(`\nOutputs recorded (${files.length} files):`));
        for (const file of files) {
            console.log(`  ${chalk.gray("•")} ${phaseFolder}/${file}`);
        }
    }
    // Determine next phase
    const phaseKeys = Object.keys(taskYaml.phases);
    const currentIndex = phaseKeys.indexOf(phaseKey);
    const nextPhaseKey = phaseKeys[currentIndex + 1];
    if (!nextPhaseKey) {
        // Last phase — task complete
        taskYaml.status = "complete";
        taskYaml.current_agent = "";
        const updatedYaml = stringifyYaml(taskYaml, { lineWidth: 120 });
        writeFileSync(join(taskDir, "_task.yaml"), updatedYaml, "utf-8");
        console.log(chalk.bold.green(`\nTask complete!`));
        console.log(chalk.gray(`All ${phaseKeys.length} phases passed for "${taskYaml.task}".`));
    }
    else {
        // Advance to next phase
        const nextPhase = taskYaml.phases[nextPhaseKey];
        const nextNumber = nextPhaseKey.split("-")[0];
        const nextName = nextPhaseKey.slice(nextNumber.length + 1);
        taskYaml.status = `phase-${nextPhaseKey}`;
        taskYaml.current_agent = nextPhase.agent;
        const updatedYaml = stringifyYaml(taskYaml, { lineWidth: 120 });
        writeFileSync(join(taskDir, "_task.yaml"), updatedYaml, "utf-8");
        console.log(chalk.bold(`\nGate passed.`));
        console.log(`Advancing to Phase ${chalk.cyan(`${nextNumber} — ${nextName}`)} (${chalk.yellow(nextPhase.agent)})`);
        console.log(`\nRun ${chalk.cyan("'becky run'")} to start the next phase.`);
    }
}

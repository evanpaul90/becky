/**
 * Becky CLI
 *
 * Main router for `becky <command>`. Reads process.argv[2] as the command name
 * and loads the corresponding handler via a literal dynamic import (so it works
 * both from TypeScript source and compiled — the specifier resolves relative to
 * this file's own location, never a guessed root).
 */
import chalk from "chalk";
const COMMANDS = {
    init: { load: () => import("./init.js"), description: "Initialize Becky in a target project" },
    scan: { load: () => import("./commands/scan.js"), description: "Scan an existing project and analyze its state" },
    compile: { load: () => import("./compile.js"), description: "Generate CLAUDE.md and AGENTS.md from rules" },
    verify: { load: () => import("./verify.js"), description: "Check rules, agents, and wiki for issues" },
    onboard: { load: () => import("./commands/onboard.js"), description: "Interactive walkthrough of Becky OS" },
    learn: { load: () => import("./commands/learn.js"), description: "Import existing docs into the wiki" },
    greenfield: { load: () => import("./commands/greenfield.js"), description: "Start a new project from scratch" },
    brownfield: { load: () => import("./commands/brownfield.js"), description: "Onboard an existing codebase" },
    run: { load: () => import("./commands/run.js"), description: "Execute a task pipeline" },
    approve: { load: () => import("./commands/approve.js"), description: "Approve a pending verdict or deliverable" },
    revise: { load: () => import("./commands/revise.js"), description: "Request revisions on a deliverable" },
    autopilot: { load: () => import("./commands/autopilot.js"), description: "Run the full pipeline unattended" },
    status: { load: () => import("./commands/status.js"), description: "Show current project state and counts" },
    assemble: { load: () => import("./commands/assemble.js"), description: "Assemble agents for a task" },
    retro: { load: () => import("./commands/retro.js"), description: "Run a retrospective on completed work" },
    rules: { load: () => import("./commands/rules-add.js"), description: "Manage rules (subcommands: add)" },
    // Agentic loop modes — run as Claude Code skills (see core/modes.md)
    deliver: { skill: "/becky-deliver", description: "Loop a build until the Done Oracle is GREEN (loop-until-delivered)" },
    hunt: { skill: "/becky-hunt", description: "Adversarial bug hunt — loop until no new confirmed bug" },
    harden: { skill: "/becky-harden", description: "Security & invariant campaign — loop until no new weakness" },
    test: { skill: "/becky-test", description: "The testing campaign — runtime e2e + chaos until coverage is met" },
    migrate: { skill: "/becky-migrate", description: "Large mechanical migration — discover, transform per-site, verify each" },
    sentinel: { skill: "/becky-sentinel", description: "Always-on watcher — monitor → triage → fix → verify, on a schedule" },
    design: { skill: "/becky-design", description: "UX / redesign pipeline with visual baselines" },
    triage: { skill: "/becky-triage", description: "Platform-wide scan → classify → fix" },
    warroom: { skill: "/becky-warroom", description: "Convene all 15 agents on one hard problem" },
};
// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function printHelp() {
    console.log();
    console.log(chalk.bold.magenta("  Becky") + " — multi-agent coding OS");
    console.log();
    console.log(chalk.dim("  Usage:") + "  becky <command> [args...]");
    console.log();
    console.log(chalk.dim("  Commands:"));
    console.log();
    const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
    for (const [name, entry] of Object.entries(COMMANDS)) {
        console.log(`    ${chalk.green(name.padEnd(maxLen + 2))}${entry.description}`);
    }
    console.log();
    console.log(chalk.dim("  Examples:"));
    console.log(`    becky ${chalk.green("onboard")}                 Interactive walkthrough`);
    console.log(`    becky ${chalk.green("scan")} /path/to/project   Analyze an existing project`);
    console.log(`    becky ${chalk.green("learn")} ./docs             Import markdown docs into wiki`);
    console.log(`    becky ${chalk.green("status")}                  Show current state`);
    console.log(`    becky ${chalk.green("rules")} add               Add a new rule interactively`);
    console.log();
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function runHandler(mod) {
    if (typeof mod.run === "function") {
        await mod.run();
    }
    else if (typeof mod.default === "function") {
        await mod.default();
    }
    // else: the module's top-level code already executed on import (compile/verify/init).
}
async function main() {
    const command = process.argv[2];
    if (!command || command === "--help" || command === "-h") {
        printHelp();
        process.exit(0);
    }
    // Special case: `becky rules add` routes to rules-add.ts
    if (command === "rules") {
        const sub = process.argv[3];
        if (sub === "add") {
            await runHandler(await COMMANDS.rules.load());
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
    // Agentic loop modes run inside Claude Code as slash-commands, not as node handlers.
    if (entry.skill) {
        console.log();
        console.log(`  ${chalk.bold(command)} is an agentic loop mode — run it in Claude Code:`);
        console.log(`    ${chalk.green(entry.skill)} ${chalk.gray("<args>")}`);
        console.log(chalk.gray(`  ${entry.description}`));
        console.log(chalk.gray(`  See core/modes.md for the full mode catalog.`));
        console.log();
        return;
    }
    await runHandler(await entry.load());
}
main().catch((err) => {
    console.error(chalk.red("Fatal:"), err instanceof Error ? err.message : err);
    process.exit(1);
});

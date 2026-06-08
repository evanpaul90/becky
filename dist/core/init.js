/**
 * Becky Init
 *
 * Initializes Becky in a target project by:
 * 1. Creating the .becky/ workspace structure
 * 2. Copying slash commands to .claude/commands/
 * 3. Copying starter config
 * 4. Detecting existing agent frameworks
 *
 * Usage: npx tsx core/cli.ts init [target-dir]
 */
import { mkdirSync, existsSync, copyFileSync, readdirSync, writeFileSync, } from "node:fs";
import { join, resolve } from "node:path";
import { getInstallRoot } from "./paths.js";
const BECKY_ROOT = getInstallRoot();
// ---------------------------------------------------------------------------
// .becky/ workspace directories to create in the target project
// ---------------------------------------------------------------------------
const BECKY_WORKSPACE_DIRS = [
    ".becky/tasks",
    ".becky/wiki/raw/briefs",
    ".becky/wiki/raw/prds",
    ".becky/wiki/raw/ux-specs",
    ".becky/wiki/raw/architecture",
    ".becky/wiki/raw/implementation-notes",
    ".becky/wiki/raw/test-reports",
    ".becky/wiki/raw/verdicts",
    ".becky/wiki/raw/retros",
    ".becky/wiki/compiled/concepts",
    ".becky/wiki/compiled/decisions",
    ".becky/wiki/compiled/incidents",
    ".becky/memory/global",
    ".becky/memory/project",
    ".becky/memory/session",
];
function detectFrameworks(targetDir) {
    const found = [];
    if (existsSync(join(targetDir, "_bmad")) ||
        existsSync(join(targetDir, "_bmad-output"))) {
        found.push({
            name: "BMad",
            indicator: existsSync(join(targetDir, "_bmad-output"))
                ? "_bmad-output/"
                : "_bmad/",
            message: "Found BMad artifacts",
        });
    }
    if (existsSync(join(targetDir, ".hermes")) ||
        existsSync(join(targetDir, "hermes.toml")) ||
        existsSync(join(targetDir, "hermes"))) {
        found.push({
            name: "Hermes",
            indicator: existsSync(join(targetDir, ".hermes"))
                ? ".hermes/"
                : existsSync(join(targetDir, "hermes.toml"))
                    ? "hermes.toml"
                    : "hermes/",
            message: "Found Hermes config",
        });
    }
    if (existsSync(join(targetDir, "CLAUDE.md"))) {
        found.push({
            name: "Claude Code",
            indicator: "CLAUDE.md",
            message: "Found existing CLAUDE.md",
        });
    }
    if (existsSync(join(targetDir, "AGENTS.md"))) {
        found.push({
            name: "Codex/OpenAI",
            indicator: "AGENTS.md",
            message: "Found existing AGENTS.md",
        });
    }
    return found;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
    // Works whether invoked directly (`tsx core/init.ts /path`) or routed through
    // the CLI (`becky init /path` → argv is ["node","cli.ts","init","/path"]).
    // Drop a leading "init" token so the target dir is read from the right slot.
    const rawArgs = process.argv.slice(2);
    const args = rawArgs[0] === "init" ? rawArgs.slice(1) : rawArgs;
    const targetDir = resolve(args[0] || ".");
    console.log(`Becky init — setting up in ${targetDir}\n`);
    // 1. Create .becky/ workspace directories
    for (const dir of BECKY_WORKSPACE_DIRS) {
        const fullPath = join(targetDir, dir);
        if (!existsSync(fullPath)) {
            mkdirSync(fullPath, { recursive: true });
        }
    }
    console.log("  Created .becky/ workspace");
    // 2. Copy becky.config.yaml into .becky/config.yaml
    const srcConfig = join(BECKY_ROOT, "becky.config.yaml");
    const beckyConfigDest = join(targetDir, ".becky", "config.yaml");
    if (existsSync(srcConfig) && !existsSync(beckyConfigDest)) {
        copyFileSync(srcConfig, beckyConfigDest);
        console.log("  Copied .becky/config.yaml");
    }
    // 3. Create wiki index if it doesn't exist
    const indexPath = join(targetDir, ".becky", "wiki", "compiled", "index.md");
    if (!existsSync(indexPath)) {
        const indexContent = [
            "# Wiki Index",
            "",
            "*No articles yet. The scribe will populate this index as work is completed.*",
            "",
            "## Concepts",
            "",
            "## Decisions",
            "",
            "## Incidents",
            "",
            "---",
            `Last compiled: ${new Date().toISOString().split("T")[0]} | Articles: 0 | Rules referenced: 0`,
        ].join("\n");
        writeFileSync(indexPath, indexContent, "utf-8");
    }
    // 4. Copy the memory schema into the namespaced workspace
    const memSchemaPath = join(targetDir, ".becky", "memory", "_schema.md");
    if (!existsSync(memSchemaPath)) {
        const schemaSrc = join(BECKY_ROOT, "memory", "_schema.md");
        if (existsSync(schemaSrc)) {
            copyFileSync(schemaSrc, memSchemaPath);
            console.log("  Copied .becky/memory/_schema.md");
        }
    }
    // 5. Copy slash commands to .claude/commands/
    const slashCommandsSrc = join(BECKY_ROOT, ".claude", "commands");
    const slashCommandsDest = join(targetDir, ".claude", "commands");
    if (existsSync(slashCommandsSrc)) {
        mkdirSync(slashCommandsDest, { recursive: true });
        const mdFiles = readdirSync(slashCommandsSrc).filter((f) => f.endsWith(".md"));
        let copiedCount = 0;
        for (const file of mdFiles) {
            const src = join(slashCommandsSrc, file);
            const dest = join(slashCommandsDest, file);
            copyFileSync(src, dest);
            copiedCount++;
        }
        console.log(`  Installed ${copiedCount} slash commands to .claude/commands/`);
    }
    // 6. Create .gitkeep files in empty workspace directories
    for (const dir of BECKY_WORKSPACE_DIRS) {
        const fullPath = join(targetDir, dir);
        if (existsSync(fullPath)) {
            const contents = readdirSync(fullPath);
            if (contents.length === 0) {
                writeFileSync(join(fullPath, ".gitkeep"), "", "utf-8");
            }
        }
    }
    // 7. Detect existing agent frameworks
    console.log();
    const frameworks = detectFrameworks(targetDir);
    if (frameworks.length > 0) {
        console.log("  Detected existing frameworks:");
        for (const fw of frameworks) {
            console.log(`    - ${fw.message} (${fw.indicator})`);
        }
        console.log();
        console.log("  Run 'becky scan' to analyze your existing work.");
    }
    console.log(`\nBecky init complete.`);
    console.log(`\nNext steps:`);
    console.log(`  1. Edit .becky/config.yaml — set project.name and user.name`);
    if (frameworks.length > 0) {
        console.log(`  2. Run: becky scan — analyze existing frameworks, artifacts, and codebase`);
        console.log(`  3. Run: becky compile — generate CLAUDE.md and AGENTS.md from rules`);
        console.log(`  4. Add project-specific rules to core/rules/ in the Becky repo.`);
    }
    else {
        console.log(`  2. Run: becky compile — generate CLAUDE.md and AGENTS.md from rules`);
        console.log(`  3. Add project-specific rules to core/rules/ in the Becky repo.`);
    }
}
main();

/**
 * Becky Learn
 *
 * Scans a directory for markdown files and copies them into the appropriate
 * wiki/raw/ subdirectory based on folder-name heuristics.
 *
 * Usage: npx tsx core/cli.ts learn /path/to/existing/docs
 */
import chalk from "chalk";
import { readFileSync, copyFileSync, mkdirSync, existsSync, writeFileSync, } from "node:fs";
import { join, resolve, basename, relative } from "node:path";
import { getInstallRoot } from "../paths.js";
import { getMemoryDir } from "../workspace.js";
import { globSync } from "glob";
const BECKY_ROOT = getInstallRoot();
const CATEGORY_RULES = [
    {
        label: "PRDs",
        patterns: ["prd"],
        target: "wiki/raw/prds",
    },
    {
        label: "Architecture",
        patterns: ["architecture"],
        target: "wiki/raw/architecture",
    },
    {
        label: "UX Specs",
        patterns: ["ux", "design"],
        target: "wiki/raw/ux-specs",
    },
    {
        label: "Incidents / Postmortems",
        patterns: ["incident", "postmortem"],
        target: "wiki/raw/incidents",
        alsoMemory: true,
    },
    {
        label: "Briefs",
        patterns: ["brief", "product-brief"],
        target: "wiki/raw/briefs",
    },
];
const DEFAULT_TARGET = "wiki/raw/imported";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function categorize(filePath) {
    const lowerPath = filePath.toLowerCase();
    for (const rule of CATEGORY_RULES) {
        for (const pattern of rule.patterns) {
            if (lowerPath.includes(pattern))
                return rule;
        }
    }
    return null;
}
function ensureDir(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function run() {
    const sourcePath = process.argv[3];
    if (!sourcePath) {
        console.log(chalk.red("  Missing source path."));
        console.log();
        console.log(`  Usage: becky ${chalk.green("learn")} ${chalk.cyan("/path/to/docs")}`);
        console.log();
        console.log("  Scans the directory recursively for .md files and copies them");
        console.log("  into the appropriate wiki/raw/ subdirectory.");
        process.exit(1);
    }
    const resolvedSource = resolve(sourcePath);
    if (!existsSync(resolvedSource)) {
        console.log(chalk.red(`  Source path does not exist: ${resolvedSource}`));
        process.exit(1);
    }
    console.log();
    console.log(chalk.bold.magenta("  Becky learn") +
        ` — importing from ${chalk.cyan(resolvedSource)}`);
    console.log();
    // Scan for markdown files
    const mdFiles = globSync("**/*.md", {
        cwd: resolvedSource,
        nodir: true,
        dot: false,
    });
    if (mdFiles.length === 0) {
        console.log(chalk.yellow("  No .md files found in the source directory."));
        process.exit(0);
    }
    console.log(`  Found ${chalk.bold(String(mdFiles.length))} markdown files. Categorizing...`);
    console.log();
    // Categorize and copy
    const counts = {};
    let memoryCount = 0;
    for (const relPath of mdFiles) {
        const fullSource = join(resolvedSource, relPath);
        const rule = categorize(relPath);
        const targetDir = rule
            ? join(BECKY_ROOT, rule.target)
            : join(BECKY_ROOT, DEFAULT_TARGET);
        const label = rule ? rule.label : "Imported";
        ensureDir(targetDir);
        const filename = basename(relPath);
        const targetPath = join(targetDir, filename);
        // Avoid overwriting — append a suffix if the file already exists
        let finalPath = targetPath;
        if (existsSync(targetPath)) {
            const timestamp = Date.now();
            const name = filename.replace(/\.md$/, "");
            finalPath = join(targetDir, `${name}-${timestamp}.md`);
        }
        copyFileSync(fullSource, finalPath);
        counts[label] = (counts[label] || 0) + 1;
        console.log(`    ${chalk.dim(relPath)} → ${chalk.cyan(relative(BECKY_ROOT, finalPath))}`);
        // Also create a memory entry for incidents/postmortems
        if (rule?.alsoMemory) {
            const memoryDir = join(getMemoryDir(), "project");
            ensureDir(memoryDir);
            const memoryPath = join(memoryDir, filename);
            if (!existsSync(memoryPath)) {
                const content = readFileSync(fullSource, "utf-8");
                const summary = content.split("\n").slice(0, 5).join("\n");
                writeFileSync(memoryPath, `# ${filename.replace(/\.md$/, "")}\n\nImported from: ${relPath}\n\n${summary}\n`, "utf-8");
                memoryCount++;
            }
        }
    }
    // Summary
    console.log();
    console.log(chalk.bold.magenta("  Summary"));
    console.log(chalk.dim("  " + "─".repeat(10)));
    for (const [label, count] of Object.entries(counts)) {
        console.log(`    ${chalk.bold(String(count).padStart(4))} ${label}`);
    }
    console.log(`    ${chalk.dim("────")}`);
    console.log(`    ${chalk.bold(String(mdFiles.length).padStart(4))} total files copied`);
    if (memoryCount > 0) {
        console.log(`    ${chalk.bold(String(memoryCount).padStart(4))} memory entries created (incidents/postmortems)`);
    }
    console.log();
    console.log(`  Next: run ${chalk.green("becky compile")} to regenerate CLAUDE.md and AGENTS.md.`);
    console.log();
}

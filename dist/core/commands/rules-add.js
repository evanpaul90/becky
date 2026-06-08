/**
 * Becky Rules Add
 *
 * Creates a new rule file in core/rules/ with proper frontmatter and the
 * next available ID, then auto-runs compile to regenerate CLAUDE.md + AGENTS.md.
 *
 * Usage: becky rules add "title of the new rule"
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getInstallRoot } from "../paths.js";
import { parse as parseYaml } from "yaml";
import chalk from "chalk";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BECKY_ROOT = getInstallRoot();
function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match)
        return { frontmatter: {}, body: raw };
    const frontmatter = parseYaml(match[1]);
    const body = match[2].trim();
    return { frontmatter, body };
}
function loadExistingIds() {
    const rulesDir = join(BECKY_ROOT, "core", "rules");
    if (!existsSync(rulesDir))
        return [];
    const files = readdirSync(rulesDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
    const ids = [];
    for (const filename of files) {
        const raw = readFileSync(join(rulesDir, filename), "utf-8");
        const { frontmatter } = parseFrontmatter(raw);
        if (frontmatter.id) {
            // A single file can contain multiple sub-rule IDs (e.g., D-1 through D-8).
            // Parse the body for additional IDs that look like "### Rule X-N" or "id: X-N".
            ids.push(frontmatter.id);
            // Also scan body for sub-rule patterns like "D-2", "D-3" etc.
            const subRulePattern = /\b([A-Z])-(\d+)\b/g;
            let match;
            while ((match = subRulePattern.exec(raw)) !== null) {
                const subId = `${match[1]}-${match[2]}`;
                if (!ids.includes(subId)) {
                    ids.push(subId);
                }
            }
        }
    }
    return ids;
}
function nextId(existingIds, prefix) {
    // If a prefix is provided, use it. Otherwise default to "G" (general).
    const cat = prefix?.toUpperCase() || "G";
    // Find highest number for this prefix
    let max = 0;
    for (const id of existingIds) {
        const match = id.match(new RegExp(`^${cat}-(\\d+)$`));
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > max)
                max = num;
        }
    }
    return `${cat}-${max + 1}`;
}
function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function run() {
    // argv layout: becky rules add "title..."
    // process.argv: [node, becky, rules, add, ...title words]
    const title = process.argv.slice(4).join(" ").trim();
    if (!title) {
        console.error(chalk.red('Usage: becky rules add "title of the new rule"'));
        process.exit(1);
    }
    // Determine prefix from argv[3] if it looks like a category letter, otherwise default
    // argv[3] is "add" in normal usage. The user can pass a prefix as part of the title
    // or we infer "G" for general.
    const prefixMatch = title.match(/^\[([A-Z])\]\s*/);
    let prefix;
    let cleanTitle = title;
    if (prefixMatch) {
        prefix = prefixMatch[1];
        cleanTitle = title.slice(prefixMatch[0].length);
    }
    const existingIds = loadExistingIds();
    const id = nextId(existingIds, prefix);
    const slug = slugify(cleanTitle);
    const filename = `${slug}.md`;
    const filePath = join(BECKY_ROOT, "core", "rules", filename);
    // Check for collision
    if (existsSync(filePath)) {
        console.error(chalk.red(`File already exists: core/rules/${filename}`));
        console.error("Choose a different title or rename the existing file.");
        process.exit(1);
    }
    // Build rule file
    let content = `---\n`;
    content += `id: "${id}"\n`;
    content += `title: "${cleanTitle}"\n`;
    content += `severity: "P1"\n`;
    content += `origin: "design"\n`;
    content += `incident_ref: ""\n`;
    content += `enforcement: "manual"\n`;
    content += `scope: "all"\n`;
    content += `---\n\n`;
    content += `# ${cleanTitle}\n\n`;
    content += `_TODO: Describe the rule, why it exists, good/bad examples, and enforcement._\n`;
    writeFileSync(filePath, content, "utf-8");
    console.log("");
    console.log(chalk.bold(`Rule created at core/rules/${filename}`));
    console.log(`  ID: ${chalk.cyan(id)}`);
    console.log(`  Title: ${cleanTitle}`);
    console.log("");
    console.log("Edit the rule body, then run 'becky compile' to include it in CLAUDE.md + AGENTS.md.");
    console.log("");
    // Auto-run compile
    console.log(chalk.dim("Auto-running compile..."));
    console.log("");
    const compileModule = await import("../compile.js");
    if (typeof compileModule.main === "function") {
        compileModule.main();
    }
    else {
        // compile.ts calls main() at module level — the import itself runs it
    }
}

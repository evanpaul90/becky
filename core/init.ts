/**
 * Becky Init
 *
 * Initializes Becky in a target project by:
 * 1. Creating the directory structure
 * 2. Copying starter rules (or symlinking to the Becky repo)
 * 3. Running the first compile to generate CLAUDE.md + AGENTS.md
 *
 * Usage: npx tsx core/init.ts [target-dir]
 */

import { mkdirSync, existsSync, copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

// ---------------------------------------------------------------------------
// Directory structure to create in the target project
// ---------------------------------------------------------------------------

const DIRS = [
  "wiki/raw/briefs",
  "wiki/raw/prds",
  "wiki/raw/ux-specs",
  "wiki/raw/architecture",
  "wiki/raw/implementation-notes",
  "wiki/raw/test-reports",
  "wiki/raw/verdicts",
  "wiki/raw/retros",
  "wiki/compiled/concepts",
  "wiki/compiled/decisions",
  "wiki/compiled/incidents",
  "memory/global",
  "memory/project",
  "memory/session",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const targetDir = resolve(process.argv[2] || ".");

  console.log(`Becky init — setting up in ${targetDir}\n`);

  // 1. Create directories
  for (const dir of DIRS) {
    const fullPath = join(targetDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`  Created ${dir}/`);
    }
  }

  // 2. Create wiki index if it doesn't exist
  const indexPath = join(targetDir, "wiki", "compiled", "index.md");
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
    console.log("  Created wiki/compiled/index.md");
  }

  // 3. Create memory schema if it doesn't exist
  const memSchemaPath = join(targetDir, "memory", "_schema.md");
  if (!existsSync(memSchemaPath)) {
    const schemaSrc = join(BECKY_ROOT, "memory", "_schema.md");
    if (existsSync(schemaSrc)) {
      copyFileSync(schemaSrc, memSchemaPath);
      console.log("  Copied memory/_schema.md");
    }
  }

  // 4. Create becky.config.yaml if it doesn't exist
  const configPath = join(targetDir, "becky.config.yaml");
  if (!existsSync(configPath)) {
    const srcConfig = join(BECKY_ROOT, "becky.config.yaml");
    if (existsSync(srcConfig)) {
      copyFileSync(srcConfig, configPath);
      console.log("  Created becky.config.yaml (edit project.name and user.name)");
    }
  }

  // 5. Create .gitkeep files in empty directories
  for (const dir of DIRS) {
    const fullPath = join(targetDir, dir);
    const contents = readdirSync(fullPath);
    if (contents.length === 0) {
      writeFileSync(join(fullPath, ".gitkeep"), "", "utf-8");
    }
  }

  console.log(`\nBecky init complete.`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit becky.config.yaml — set project.name and user.name`);
  console.log(`  2. Run: npx tsx ${join(BECKY_ROOT, "core", "compile.ts")} --target ${targetDir}`);
  console.log(`     This generates CLAUDE.md and AGENTS.md from the starter rules.`);
  console.log(`  3. Add project-specific rules to core/rules/ in the Becky repo.`);
}

main();

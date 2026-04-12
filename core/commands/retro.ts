/**
 * Becky Retro
 *
 * Creates a structured retro template for a completed task, pulling context
 * from phase outputs, verdicts, and feedback files.
 *
 * Usage: becky retro [task-slug]
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import chalk from "chalk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseEntry {
  agent: string;
  status: string;
  gate: string;
  outputs: string[];
}

interface TaskYaml {
  task: string;
  slug: string;
  mode: string;
  created: string;
  status: string;
  current_agent: string;
  phases: Record<string, PhaseEntry>;
  autopilot: boolean;
  completed_at?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");

function loadTaskYaml(taskDir: string): TaskYaml | null {
  const taskFile = join(taskDir, "_task.yaml");
  if (!existsSync(taskFile)) return null;
  const raw = readFileSync(taskFile, "utf-8");
  return parseYaml(raw) as TaskYaml;
}

function findTask(slug?: string): { slug: string; taskDir: string; task: TaskYaml } | null {
  const tasksDir = join(BECKY_ROOT, "tasks");
  if (!existsSync(tasksDir)) return null;

  // If slug provided, find that specific task
  if (slug) {
    const taskDir = join(tasksDir, slug);
    const task = loadTaskYaml(taskDir);
    if (task) return { slug, taskDir, task };
    return null;
  }

  // Find most recently completed task (by folder name sort, descending)
  const folders = readdirSync(tasksDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();

  for (const folder of folders) {
    const taskDir = join(tasksDir, folder);
    const task = loadTaskYaml(taskDir);
    if (task && task.status === "complete") {
      return { slug: folder, taskDir, task };
    }
  }

  return null;
}

function findFileContent(taskDir: string, pattern: string): string | null {
  const entries = readdirSync(taskDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("phase-")) continue;

    const phaseDir = join(taskDir, entry.name);
    const files = readdirSync(phaseDir);

    for (const file of files) {
      if (file.toLowerCase().includes(pattern.toLowerCase())) {
        return readFileSync(join(phaseDir, file), "utf-8");
      }
    }
  }

  return null;
}

function collectFeedbackFiles(taskDir: string): string[] {
  const feedback: string[] = [];
  const entries = readdirSync(taskDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("phase-")) continue;

    const phaseDir = join(taskDir, entry.name);
    const files = readdirSync(phaseDir);

    for (const file of files) {
      if (file.toLowerCase().includes("feedback")) {
        const content = readFileSync(join(phaseDir, file), "utf-8");
        feedback.push(`### ${entry.name}/${file}\n\n${content}`);
      }
    }
  }

  return feedback;
}

function collectImplementationNotes(taskDir: string): string | null {
  const entries = readdirSync(taskDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("phase-")) continue;

    const phaseDir = join(taskDir, entry.name);
    const files = readdirSync(phaseDir);

    for (const file of files) {
      if (
        file.toLowerCase().includes("implementation") ||
        file.toLowerCase().includes("build-notes") ||
        file.toLowerCase().includes("completion")
      ) {
        return readFileSync(join(phaseDir, file), "utf-8");
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run(): void {
  const slugArg = process.argv[3]?.trim();
  const result = findTask(slugArg || undefined);

  if (!result) {
    if (slugArg) {
      console.error(chalk.red(`No task found with slug "${slugArg}".`));
    } else {
      console.error(chalk.red("No completed task found for retro."));
    }
    process.exit(1);
  }

  const { slug, taskDir, task } = result;

  // Create retro directory
  const retroDir = join(taskDir, "retro");
  if (!existsSync(retroDir)) {
    mkdirSync(retroDir, { recursive: true });
  }

  // Gather context from phase outputs
  const verdictContent = findFileContent(taskDir, "verdict");
  const feedbackFiles = collectFeedbackFiles(taskDir);
  const implementationNotes = collectImplementationNotes(taskDir);

  // Build retro template
  let doc = `# Retro \u2014 ${task.task}\n\n`;
  doc += `**Task:** ${slug}\n`;
  doc += `**Completed:** ${task.completed_at ?? "_(date not recorded)_"}\n\n`;
  doc += `---\n\n`;

  // What Worked
  doc += `## What Worked\n\n`;
  doc += `_Which patterns, rules, or agent behaviors produced good outcomes?_\n\n`;
  if (verdictContent) {
    doc += `### Heimdall's Verdict (reference)\n\n`;
    doc += `\`\`\`\n${verdictContent.slice(0, 1000)}\n\`\`\`\n\n`;
  }
  doc += `- \n\n`;

  // What Didn't
  doc += `## What Didn't\n\n`;
  doc += `_Where did the pipeline break down? Where was rework needed?_\n\n`;
  if (feedbackFiles.length > 0) {
    doc += `### Feedback from revise cycles\n\n`;
    for (const fb of feedbackFiles) {
      doc += `${fb}\n\n`;
    }
  }
  if (implementationNotes) {
    doc += `### Implementation notes (reference)\n\n`;
    doc += `\`\`\`\n${implementationNotes.slice(0, 1000)}\n\`\`\`\n\n`;
  }
  doc += `- \n\n`;

  // What's New
  doc += `## What's New\n\n`;
  doc += `_Did this task reveal knowledge that should be captured?_\n\n`;
  doc += `- \n\n`;

  doc += `---\n\n`;

  // Rule Candidates
  doc += `## Rule Candidates\n\n`;
  doc += `_Did this task reveal a pattern that should become a rule?_\n\n`;
  doc += `| Pattern | Suggested ID | Severity | Notes |\n`;
  doc += `|---------|-------------|----------|-------|\n`;
  doc += `| | | | |\n\n`;

  // Wiki Articles
  doc += `## Wiki Articles\n\n`;
  doc += `_What knowledge from this task should Watcher compile?_\n\n`;
  doc += `| Topic | Category | Priority |\n`;
  doc += `|-------|----------|----------|\n`;
  doc += `| | concepts / decisions / incidents | |\n\n`;

  // Write
  const retroPath = join(retroDir, "retro.md");
  writeFileSync(retroPath, doc, "utf-8");

  console.log("");
  console.log(chalk.bold(`Retro template created at tasks/${slug}/retro/retro.md`));
  console.log("Review and fill in the template, then run 'becky compile' to update outputs.");
  console.log("");
}

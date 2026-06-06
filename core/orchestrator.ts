/**
 * Becky Orchestrator — The Execution Engine
 *
 * Reads a task's _task.yaml, iterates through pending phases, constructs
 * prompts, executes them via the `claude` CLI, captures output, runs gate
 * checks, and advances.
 *
 * Usage: import { orchestrate } from './orchestrator.js';
 *        await orchestrate(taskDir, { deployStaging: false });
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  appendFileSync,
  unlinkSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { spawnSync, execSync } from "node:child_process";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { tmpdir } from "node:os";
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
}

interface AgentDef {
  id: string;
  name: string;
  consumes?: string[];
  produces?: string[];
  body: string;
}

interface OrchestrateOptions {
  deployStaging?: boolean;
}

interface GateResult {
  passed: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BECKY_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
  const body = match[2].trim();
  return { frontmatter, body };
}

function loadAgent(agentId: string): AgentDef | null {
  const primaryAgent = agentId.split("+")[0].trim();
  const agentPath = join(BECKY_ROOT, "agents", `${primaryAgent}.md`);
  if (!existsSync(agentPath)) return null;
  const raw = readFileSync(agentPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(raw);
  return {
    id: (frontmatter.id as string) ?? primaryAgent,
    name: (frontmatter.name as string) ?? primaryAgent,
    consumes: frontmatter.consumes as string[] | undefined,
    produces: frontmatter.produces as string[] | undefined,
    body,
  };
}

function safeReadFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function readDirFiles(dirPath: string, extensions: string[], skipPrefixes: string[] = ["_"]): { name: string; content: string }[] {
  if (!existsSync(dirPath)) return [];
  const results: { name: string; content: string }[] = [];
  try {
    const files = readdirSync(dirPath).filter((f) => {
      const hasExt = extensions.some((ext) => f.endsWith(ext));
      const skipped = skipPrefixes.some((prefix) => f.startsWith(prefix));
      return hasExt && !skipped;
    });
    for (const file of files) {
      const content = safeReadFile(join(dirPath, file));
      if (content) results.push({ name: file, content });
    }
  } catch {
    // Directory unreadable — skip
  }
  return results;
}

function readDirFilesRecursive(dirPath: string, extensions: string[]): { name: string; content: string }[] {
  if (!existsSync(dirPath)) return [];
  const results: { name: string; content: string }[] = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subResults = readDirFilesRecursive(join(dirPath, entry.name), extensions);
        for (const sub of subResults) {
          results.push({ name: `${entry.name}/${sub.name}`, content: sub.content });
        }
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        const content = safeReadFile(join(dirPath, entry.name));
        if (content) results.push({ name: entry.name, content });
      }
    }
  } catch {
    // Directory unreadable — skip
  }
  return results;
}

function sortPhaseKeys(phases: Record<string, PhaseEntry>): string[] {
  return Object.keys(phases).sort((a, b) => {
    const numA = parseInt(a.split("-")[0], 10);
    const numB = parseInt(b.split("-")[0], 10);
    return numA - numB;
  });
}

function phaseNum(phaseKey: string): string {
  return phaseKey.split("-")[0];
}

function phaseName(phaseKey: string): string {
  return phaseKey.split("-").slice(1).join("-");
}

function phaseFolderName(phaseKey: string): string {
  return `phase-${phaseKey}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function writeTaskYaml(taskDir: string, taskYaml: TaskYaml): void {
  writeFileSync(join(taskDir, "_task.yaml"), stringifyYaml(taskYaml, { lineWidth: 120 }), "utf-8");
}

function appendStatusLog(taskDir: string, entry: string): void {
  const statusPath = join(taskDir, "_status.md");
  if (!existsSync(statusPath)) {
    writeFileSync(statusPath, `# Status Log\n\n`, "utf-8");
  }
  appendFileSync(statusPath, entry + "\n\n", "utf-8");
}

function findClaudeCli(): string | null {
  // Check for claude in PATH
  try {
    const result = spawnSync("which", ["claude"], { encoding: "utf-8", timeout: 5000 });
    if (result.status === 0 && result.stdout.trim()) {
      return "claude";
    }
  } catch {
    // Not found via which
  }

  // Check for npx claude
  try {
    const result = spawnSync("npx", ["claude", "--version"], { encoding: "utf-8", timeout: 15000 });
    if (result.status === 0) {
      return "npx claude";
    }
  } catch {
    // Not found via npx
  }

  // Check BECKY_RUNTIME env var
  const envRuntime = process.env.BECKY_RUNTIME;
  if (envRuntime) {
    return envRuntime;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Context Gathering
// ---------------------------------------------------------------------------

function gatherRulesContext(): string {
  const rulesDir = join(BECKY_ROOT, "core", "rules");
  const files = readDirFiles(rulesDir, [".md"], ["_"]);
  if (files.length === 0) return "(No rules found.)";
  return files.map((f) => `### ${f.name}\n\n${f.content}`).join("\n\n---\n\n");
}

function gatherWikiContext(): string {
  const parts: string[] = [];

  // Index
  const indexPath = join(BECKY_ROOT, "wiki", "compiled", "index.md");
  if (existsSync(indexPath)) {
    parts.push(safeReadFile(indexPath));
  }

  // Concepts, decisions, incidents
  for (const sub of ["concepts", "decisions", "incidents"]) {
    const subDir = join(BECKY_ROOT, "wiki", "compiled", sub);
    const files = readDirFiles(subDir, [".md", ".yaml"]);
    for (const file of files) {
      parts.push(`### ${sub}/${file.name}\n\n${file.content}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : "(No wiki content yet.)";
}

function gatherMemoryContext(): string {
  const parts: string[] = [];

  for (const sub of ["project", "global"]) {
    const subDir = join(BECKY_ROOT, "memory", sub);
    const files = readDirFiles(subDir, [".md", ".yaml"]);
    for (const file of files) {
      parts.push(`### memory/${sub}/${file.name}\n\n${file.content}`);
    }
  }

  return parts.length > 0 ? parts.join("\n\n") : "(No memory files found.)";
}

function gatherProjectConfig(): string {
  const configPath = join(BECKY_ROOT, "becky.config.yaml");
  if (!existsSync(configPath)) return "(No becky.config.yaml found.)";
  return safeReadFile(configPath);
}

function gatherPreviousPhaseOutputs(taskDir: string, phaseKeys: string[], upToIndex: number): string {
  const parts: string[] = [];

  for (let i = 0; i < upToIndex; i++) {
    const key = phaseKeys[i];
    const folder = phaseFolderName(key);
    const phaseDir = join(taskDir, folder);
    if (!existsSync(phaseDir)) continue;

    const files = readDirFiles(phaseDir, [".md", ".yaml"], ["_"]);
    if (files.length === 0) continue;

    const fileParts = files.map((f) => f.content).join("\n\n");
    parts.push(`### Phase ${phaseNum(key)} - ${phaseName(key)}\n\n${fileParts}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : "(No previous phase outputs.)";
}

// ---------------------------------------------------------------------------
// Prompt Construction
// ---------------------------------------------------------------------------

function buildPrompt(
  agent: AgentDef,
  taskYaml: TaskYaml,
  phaseKey: string,
  phase: PhaseEntry,
  taskDir: string,
  phaseKeys: string[],
  phaseIndex: number,
  retryFeedback?: string,
): string {
  const rules = gatherRulesContext();
  const wiki = gatherWikiContext();
  const memory = gatherMemoryContext();
  const config = gatherProjectConfig();
  const previousOutputs = gatherPreviousPhaseOutputs(taskDir, phaseKeys, phaseIndex);

  let prompt = `You are ${agent.name} (${agent.id}), an agent in the Becky OS multi-agent pipeline.\n\n`;

  prompt += `## Your Role\n\n${agent.body}\n\n`;

  prompt += `## Task\n\n${taskYaml.task}\n\n`;

  prompt += `## Current Phase\n\nPhase ${phaseNum(phaseKey)}: ${phaseName(phaseKey)}\nGate: ${phase.gate}\n\n`;

  prompt += `## Rules You Must Follow\n\n${rules}\n\n`;

  prompt += `## Project Context\n\n${config}\n\n`;

  prompt += `## Memory\n\n${memory}\n\n`;

  prompt += `## Wiki Context\n\n${wiki}\n\n`;

  prompt += `## Previous Phase Outputs\n\n${previousOutputs}\n\n`;

  if (retryFeedback) {
    prompt += `## Retry Feedback\n\n${retryFeedback}\n\n`;
  }

  prompt += `## Instructions\n\n`;
  prompt += `Complete this phase fully. Write your output as markdown.\n\n`;
  prompt += `If you discover a pattern that should become a permanent rule, write it in a section called "## Proposed Rule" at the end of your output.\n\n`;
  prompt += `When done, output ONLY the content for this phase — no preamble, no "here's what I did" summary.\n`;

  return prompt;
}

// ---------------------------------------------------------------------------
// Claude CLI Execution
// ---------------------------------------------------------------------------

function executeClaude(prompt: string, phaseDir: string, claudeCmd: string): { output: string; durationMs: number } {
  const start = Date.now();

  // Write prompt to a temp file to avoid shell escaping issues with long prompts
  const promptPath = join(phaseDir, "_prompt.md");
  writeFileSync(promptPath, prompt, "utf-8");

  let output: string;

  if (claudeCmd === "npx claude") {
    // Use npx — need shell
    const result = spawnSync("sh", ["-c", `cat "${promptPath}" | npx claude -p --output-format text`], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 600000,
    });
    output = (result.stdout ?? "") + (result.stderr ?? "");
    if (result.error) {
      throw new Error(`Claude CLI execution failed: ${result.error.message}`);
    }
    if (result.status !== 0 && !result.stdout) {
      throw new Error(`Claude CLI exited with code ${result.status}: ${result.stderr ?? "(no stderr)"}`);
    }
    output = result.stdout ?? "";
  } else {
    // Direct command (claude or custom BECKY_RUNTIME)
    const parts = claudeCmd.split(" ");
    const cmd = parts[0];
    const baseArgs = parts.slice(1);
    const result = spawnSync(cmd, [...baseArgs, "-p", "--output-format", "text"], {
      input: prompt,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 600000,
    });
    if (result.error) {
      throw new Error(`Claude CLI execution failed: ${result.error.message}`);
    }
    if (result.status !== 0 && !result.stdout) {
      throw new Error(`Claude CLI exited with code ${result.status}: ${result.stderr ?? "(no stderr)"}`);
    }
    output = result.stdout ?? "";
  }

  const durationMs = Date.now() - start;
  return { output: output.trim(), durationMs };
}

// ---------------------------------------------------------------------------
// Gate Checks
// ---------------------------------------------------------------------------

function checkGate(
  output: string,
  agentId: string,
  _phase: PhaseEntry,
): GateResult {
  // Basic: output must exist and be substantive
  if (!output || output.length < 100) {
    return { passed: false, reason: "Output is too short (< 100 characters). The phase needs more substantive content." };
  }

  // For build phases (agent is "stark"): check for test results mention
  const primaryAgent = agentId.split("+")[0].trim();
  if (primaryAgent === "stark") {
    const testKeywords = ["test", "pass", "fail", "error", "build", "compile", "lint", "tsc"];
    const hasTestMention = testKeywords.some((kw) => output.toLowerCase().includes(kw));
    if (!hasTestMention) {
      return { passed: false, reason: "Build phase output does not mention test results. Please include test/build status." };
    }
  }

  // For verify phases (agent is "heimdall"): check for verdict
  if (primaryAgent === "heimdall") {
    const verdictKeywords = ["verdict:", "verdict", "DONE", "VERIFIED", "AUDITED"];
    const hasVerdict = verdictKeywords.some((kw) => output.includes(kw));
    if (!hasVerdict) {
      return { passed: false, reason: "Verification phase output does not contain a verdict (DONE/VERIFIED/AUDITED). Please provide a structured verdict." };
    }
  }

  return { passed: true, reason: "Gate passed." };
}

// ---------------------------------------------------------------------------
// Proposed Rule Extraction
// ---------------------------------------------------------------------------

function extractProposedRule(output: string): string | null {
  const match = output.match(/## Proposed Rule\s*\n([\s\S]*?)(?=\n## |\n---|\s*$)/);
  if (!match) return null;
  return match[1].trim();
}

// ---------------------------------------------------------------------------
// Morning Brief Generation
// ---------------------------------------------------------------------------

function generateMorningBrief(
  taskDir: string,
  taskYaml: TaskYaml,
  phaseKeys: string[],
  totalDurationMs: number,
): string {
  const timestamp = isoNow();
  const totalMinutes = Math.round(totalDurationMs / 60000);

  let brief = `# Morning Brief: ${taskYaml.task}\n`;
  brief += `Completed: ${timestamp} | Duration: ${totalMinutes}m | Mode: ${taskYaml.mode}\n\n`;

  // What Was Built
  brief += `## What Was Built\n\n`;
  for (const key of phaseKeys) {
    const folder = phaseFolderName(key);
    const outputPath = join(taskDir, folder, "output.md");
    if (!existsSync(outputPath)) continue;
    const content = safeReadFile(outputPath);
    // Extract headers from the output as key deliverables
    const headers = content.match(/^##? .+$/gm);
    if (headers && headers.length > 0) {
      brief += `**Phase ${phaseNum(key)} (${phaseName(key)}):** ${headers.slice(0, 3).map((h) => h.replace(/^#+ /, "")).join(", ")}\n\n`;
    } else {
      brief += `**Phase ${phaseNum(key)} (${phaseName(key)}):** Output produced (${content.length} chars)\n\n`;
    }
  }

  // Heimdall's Verdict
  brief += `## Heimdall's Verdict\n\n`;
  const verifyKey = phaseKeys.find((k) => phaseName(k) === "verify");
  if (verifyKey) {
    const verifyOutput = join(taskDir, phaseFolderName(verifyKey), "output.md");
    if (existsSync(verifyOutput)) {
      const content = safeReadFile(verifyOutput);
      // Count verdict tiers
      const doneCount = (content.match(/\bDONE\b/g) ?? []).length;
      const verifiedCount = (content.match(/\bVERIFIED\b/g) ?? []).length;
      const auditedCount = (content.match(/\bAUDITED\b/g) ?? []).length;
      brief += `- DONE: ${doneCount} | VERIFIED: ${verifiedCount} | AUDITED: ${auditedCount}\n`;

      // Extract any flags/violations
      const violationMatch = content.match(/violation[s]?:?\s*\n([\s\S]*?)(?=\n## |\n---|\s*$)/i);
      if (violationMatch) {
        brief += `- Violations found — see phase-7-verify/output.md for details\n`;
      }
    } else {
      brief += `(No verification output found.)\n`;
    }
  } else {
    brief += `(No verification phase in this pipeline.)\n`;
  }
  brief += `\n`;

  // Proposed Rules
  brief += `## Proposed Rules\n\n`;
  let foundRules = false;
  for (const key of phaseKeys) {
    const rulePath = join(taskDir, phaseFolderName(key), "_proposed-rule.md");
    if (existsSync(rulePath)) {
      const content = safeReadFile(rulePath);
      const firstLine = content.split("\n")[0] ?? "(untitled)";
      brief += `- Phase ${phaseNum(key)}: ${firstLine}\n`;
      foundRules = true;
    }
  }
  if (!foundRules) {
    brief += `(No proposed rules from this run.)\n`;
  }
  brief += `Status: draft — awaiting your approval\n\n`;

  // Wiki Updates
  brief += `## Wiki Updates\n\n`;
  const knowledgeKey = phaseKeys.find((k) => phaseName(k) === "knowledge");
  if (knowledgeKey) {
    const knowledgeOutput = join(taskDir, phaseFolderName(knowledgeKey), "output.md");
    if (existsSync(knowledgeOutput)) {
      brief += `Watcher produced output in phase-${knowledgeKey}/output.md\n`;
    } else {
      brief += `(No wiki output produced.)\n`;
    }
  } else {
    brief += `(No knowledge phase in this pipeline.)\n`;
  }
  brief += `\n`;

  // Flags for Review
  brief += `## Flags for Your Review\n\n`;
  let foundFlags = false;
  for (const key of phaseKeys) {
    const phase = taskYaml.phases[key];
    if (phase.status === "blocked") {
      const blockedPath = join(taskDir, phaseFolderName(key), "_blocked.md");
      const reason = existsSync(blockedPath) ? safeReadFile(blockedPath) : "(no reason recorded)";
      brief += `- Phase ${phaseNum(key)} (${phaseName(key)}): BLOCKED — ${reason.split("\n")[0]}\n`;
      foundFlags = true;
    }
  }
  if (!foundFlags) {
    brief += `(No flags — all phases passed.)\n`;
  }
  brief += `\n`;

  // What to Do Now
  brief += `## What to Do Now\n\n`;
  const hasBlocked = phaseKeys.some((k) => taskYaml.phases[k].status === "blocked");
  const hasRules = foundRules;
  let step = 1;

  if (hasBlocked) {
    brief += `${step}. Review blocked phases above and resolve issues\n`;
    step++;
  }
  if (hasRules) {
    brief += `${step}. Approve proposed rules: \`becky rules add "title"\`\n`;
    step++;
  }
  brief += `${step}. Review outputs in tasks/${taskYaml.slug}/\n`;
  step++;
  brief += `${step}. Promote to production if satisfied\n`;

  return brief;
}

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

export async function orchestrate(taskDir: string, options?: OrchestrateOptions): Promise<void> {
  const startTime = Date.now();

  // Validate claude CLI availability
  const claudeCmd = findClaudeCli();
  if (!claudeCmd) {
    const msg = "Claude CLI not found. Install Claude Code or set the BECKY_RUNTIME env var.";
    console.error(chalk.red(msg));
    appendStatusLog(taskDir, `## Error\n\n${msg}\nTimestamp: ${isoNow()}`);
    throw new Error(msg);
  }
  console.log(chalk.dim(`  Using CLI: ${claudeCmd}`));

  // Read task yaml
  const taskYamlPath = join(taskDir, "_task.yaml");
  if (!existsSync(taskYamlPath)) {
    throw new Error(`No _task.yaml found at ${taskDir}`);
  }

  let taskYaml = parseYaml(readFileSync(taskYamlPath, "utf-8")) as TaskYaml;
  const phaseKeys = sortPhaseKeys(taskYaml.phases);

  // Find the first pending/ready phase
  let startIdx = phaseKeys.findIndex((k) => {
    const status = taskYaml.phases[k].status;
    return status === "pending" || status === "ready";
  });

  if (startIdx === -1) {
    console.log(chalk.green("  All phases are already complete or blocked."));
    return;
  }

  console.log(chalk.dim(`  Task: ${taskYaml.task}`));
  console.log(chalk.dim(`  Phases remaining: ${phaseKeys.length - startIdx}`));
  console.log("");

  // Iterate through phases
  for (let i = startIdx; i < phaseKeys.length; i++) {
    const phaseKey = phaseKeys[i];
    const phase = taskYaml.phases[phaseKey];

    // Skip already completed/blocked phases
    if (phase.status === "passed" || phase.status === "blocked") continue;

    const num = phaseNum(phaseKey);
    const name = phaseName(phaseKey);
    const folder = phaseFolderName(phaseKey);
    const phaseDir = join(taskDir, folder);

    // Ensure phase directory exists
    if (!existsSync(phaseDir)) {
      mkdirSync(phaseDir, { recursive: true });
    }

    // Load agent
    const agent = loadAgent(phase.agent);
    if (!agent) {
      const msg = `Agent "${phase.agent}" not found in agents/ directory.`;
      console.error(chalk.red(`  Phase ${num} — ${msg}`));
      phase.status = "blocked";
      phase.outputs = [];
      writeFileSync(join(phaseDir, "_blocked.md"), msg, "utf-8");
      writeTaskYaml(taskDir, taskYaml);
      appendStatusLog(taskDir, `## Phase ${num} — ${name} (${phase.agent})\nBlocked: ${isoNow()}\nReason: ${msg}`);
      continue;
    }

    console.log(
      chalk.bold(`  Phase ${num}`) +
      ` — ${chalk.cyan(name)} (${chalk.yellow(agent.name)})`
    );

    // Retry loop
    let retryCount = 0;
    const maxRetries = 3;
    let retryFeedback: string | undefined;
    let phasePassed = false;

    while (retryCount < maxRetries && !phasePassed) {
      if (retryCount > 0) {
        console.log(chalk.dim(`    Retry ${retryCount}/${maxRetries}...`));
      }

      // Build prompt
      const prompt = buildPrompt(agent, taskYaml, phaseKey, phase, taskDir, phaseKeys, i, retryFeedback);

      // Execute
      let output: string;
      let durationMs: number;

      try {
        const result = executeClaude(prompt, phaseDir, claudeCmd);
        output = result.output;
        durationMs = result.durationMs;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`    Execution failed: ${errorMsg}`));

        // Mark as blocked after execution failure
        phase.status = "blocked";
        phase.outputs = [];
        writeFileSync(join(phaseDir, "_blocked.md"), `Execution failed: ${errorMsg}`, "utf-8");
        writeTaskYaml(taskDir, taskYaml);
        appendStatusLog(taskDir, [
          `## Phase ${num} — ${name} (${phase.agent})`,
          `Blocked: ${isoNow()}`,
          `Reason: Claude CLI execution failed`,
          `Error: ${errorMsg}`,
        ].join("\n"));
        break;
      }

      const durationSec = Math.round(durationMs / 1000);
      console.log(chalk.dim(`    Output: ${output.length} chars in ${durationSec}s`));

      // Write output
      const outputPath = join(phaseDir, "output.md");
      writeFileSync(outputPath, output, "utf-8");

      // Extract proposed rule if present
      const proposedRule = extractProposedRule(output);
      if (proposedRule) {
        const rulePath = join(phaseDir, "_proposed-rule.md");
        writeFileSync(rulePath, proposedRule, "utf-8");
        console.log(chalk.dim(`    Proposed rule extracted.`));
      }

      // Gate check
      const gateResult = checkGate(output, phase.agent, phase);

      if (gateResult.passed) {
        phasePassed = true;

        // Update phase
        phase.status = "passed";
        phase.outputs = ["output.md"];
        if (proposedRule) phase.outputs.push("_proposed-rule.md");

        // Update task status and current agent
        const nextIdx = i + 1;
        if (nextIdx < phaseKeys.length) {
          const nextKey = phaseKeys[nextIdx];
          taskYaml.status = `phase-${nextKey}`;
          taskYaml.current_agent = taskYaml.phases[nextKey].agent;
        } else {
          taskYaml.status = "complete";
          taskYaml.current_agent = "";
        }

        writeTaskYaml(taskDir, taskYaml);

        // Status log
        const logParts = [
          `## Phase ${num} — ${name} (${phase.agent})`,
          `Completed: ${isoNow()}`,
          `Duration: ${durationSec}s`,
          `Gate: passed`,
          `Outputs: ${phase.outputs.join(", ")}`,
        ];
        if (proposedRule) {
          logParts.push(`Proposed rule: (see _proposed-rule.md)`);
        }
        appendStatusLog(taskDir, logParts.join("\n"));

        console.log(chalk.green(`    Gate passed.`));
      } else {
        retryCount++;
        retryFeedback = `Your previous output did not pass the gate: ${phase.gate}. The issue: ${gateResult.reason}. Please try again.`;
        console.log(chalk.yellow(`    Gate failed: ${gateResult.reason}`));

        if (retryCount >= maxRetries) {
          // Exhausted retries — mark as blocked
          phase.status = "blocked";
          phase.outputs = ["output.md"];
          const blockedReason = `Gate failed after ${maxRetries} retries. Last failure: ${gateResult.reason}`;
          writeFileSync(join(phaseDir, "_blocked.md"), blockedReason, "utf-8");
          writeTaskYaml(taskDir, taskYaml);

          appendStatusLog(taskDir, [
            `## Phase ${num} — ${name} (${phase.agent})`,
            `Blocked: ${isoNow()}`,
            `Duration: ${durationSec}s`,
            `Gate: blocked (${maxRetries} retries exhausted)`,
            `Reason: ${blockedReason}`,
          ].join("\n"));

          console.log(chalk.red(`    Blocked after ${maxRetries} retries.`));
        }
      }
    }

    // If phase was blocked (either by execution failure or gate failure), stop the pipeline
    if (phase.status === "blocked") {
      console.log(chalk.yellow(`\n  Pipeline halted at phase ${num}. See _blocked.md for details.`));
      break;
    }
  }

  // Re-read task yaml in case it was updated during the loop
  taskYaml = parseYaml(readFileSync(taskYamlPath, "utf-8")) as TaskYaml;

  const totalDurationMs = Date.now() - startTime;
  const totalMinutes = Math.round(totalDurationMs / 60000);

  // Generate morning brief if all phases complete (or pipeline is done)
  const allDone = phaseKeys.every((k) => {
    const s = taskYaml.phases[k].status;
    return s === "passed" || s === "blocked";
  });

  if (allDone) {
    console.log("");
    console.log(chalk.bold.green("  All phases complete."));

    const brief = generateMorningBrief(taskDir, taskYaml, phaseKeys, totalDurationMs);
    const briefPath = join(taskDir, "_morning-brief.md");
    writeFileSync(briefPath, brief, "utf-8");
    console.log(chalk.dim(`  Morning brief written to _morning-brief.md`));

    if (options?.deployStaging) {
      console.log("");
      console.log(chalk.bold("  Deploy to staging:"));
      console.log(chalk.dim("    Review the outputs, then deploy manually."));
      console.log(chalk.dim("    Automated staging deploy is planned for a future version."));
    }
  }

  console.log("");
  console.log(chalk.dim(`  Total time: ${totalMinutes}m`));
}

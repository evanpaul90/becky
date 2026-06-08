/**
 * Workspace resolution — the user's project, distinct from the installed OS.
 *
 * Two different roots:
 *   • BECKY_ROOT (each module computes its own) = where the OS *content* lives —
 *     agents, rules, templates, .claude/commands. Read-only source. When Becky is
 *     installed globally (`npm i -g beckyos`), this is inside node_modules.
 *   • WORKSPACE (this file) = the user's project — where task/wiki/memory *state*
 *     is written. The `.becky/` directory `becky init` scaffolds.
 *
 * Task state must NEVER be written under BECKY_ROOT: on a global install that would
 * dump tasks into node_modules. It belongs in the user's project.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The user's project root: the nearest ancestor of the current working directory
 * that contains a `.becky/` directory, or the cwd itself if none is found.
 */
export function getWorkspaceRoot(): string {
  let dir = process.cwd();
  // walk up looking for an existing .becky/ workspace
  // (so `becky <cmd>` works from any subdirectory of a project, like git)
  for (;;) {
    if (existsSync(join(dir, ".becky"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/** `<workspace>/.becky` — the workspace's Becky state directory. */
export function getBeckyDir(): string {
  return join(getWorkspaceRoot(), ".becky");
}

/** `<workspace>/.becky/tasks` — where task pipelines are created and read. */
export function getTasksDir(): string {
  return join(getBeckyDir(), "tasks");
}

/** `<workspace>/.becky/wiki` — the workspace's compiled/raw knowledge base. */
export function getWikiDir(): string {
  return join(getBeckyDir(), "wiki");
}

/** `<workspace>/.becky/memory` — the workspace's memory tiers. */
export function getMemoryDir(): string {
  return join(getBeckyDir(), "memory");
}

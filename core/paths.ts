/**
 * Install-root resolution — where the OS *content* lives (agents, rules,
 * templates, .claude/commands, becky.config.yaml).
 *
 * This must work both when running from TypeScript source (`core/cli.ts`, dev)
 * and when running compiled (`dist/core/cli.js`, after `npm i -g beckyos`).
 * In both cases the content files sit at the package root, so we find the root
 * by walking up from this module until we hit the directory holding package.json.
 *
 * (Distinct from the workspace — see core/workspace.ts — which is the *user's*
 * project where task/wiki/memory state is written.)
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cached: string | null = null;

/** The package root that contains the OS content (and package.json). */
export function getInstallRoot(): string {
  if (cached) return cached;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, "package.json"))) {
      cached = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  // Fallback: two levels up from this module (core/ -> root, dist/core/ would miss,
  // but package.json is always present in a real install so we won't reach here).
  cached = dirname(dirname(fileURLToPath(import.meta.url)));
  return cached;
}

/** Join segments onto the install root (the OS content location). */
export function installPath(...segments: string[]): string {
  return join(getInstallRoot(), ...segments);
}

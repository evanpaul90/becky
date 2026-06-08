#!/usr/bin/env node
/**
 * beckyOS global CLI launcher.
 *
 * Becky runs from TypeScript source (it dynamically loads agent/command modules
 * by path at runtime). This shim registers the tsx ESM loader, then hands off to
 * core/cli.ts with argv intact — so `becky <command> [args]` works from anywhere
 * after `npm i -g beckyos`.
 */
import { register } from "tsx/esm/api";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
register();
await import(pathToFileURL(join(here, "..", "core", "cli.ts")).href);

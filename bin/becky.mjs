#!/usr/bin/env node
/**
 * beckyOS global CLI entry point.
 *
 * Runs the compiled CLI — plain Node, no TypeScript runtime, no native build.
 * `dist/` is produced by `tsc` (the package's `prepare` / `prepublishOnly` step),
 * so a global install needs nothing but Node + three pure-JS dependencies.
 */
import "../dist/core/cli.js";

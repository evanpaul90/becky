# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-03

### Added

- **Full 13-agent council** — the roster grew from 7 to a complete lifecycle council: Vision (Research), Fury (Discovery), Coulson (Requirements), Xavier (Domain Expert), Shuri (Experience), Strange (Architecture), Stark (Build), Loki (Adversarial Review), Widow (Test), Deadpool (Chaos), Friday (Impact Analyst), Heimdall (Verify), and Watcher (Memory). Each is a distinct lens, obligated to disagree.
- **Two new wordsmiths** — **Parker (Docs & Guides)** turns features into clear, friendly docs; **Quill (DevRel & Announcements)** writes changelogs, release notes, and launch copy anchored to a real, verified change. Total roster: 15.
- **The five design pillars** documented — the Living Wiki, One Program Per Agent, Generate-then-Verify, the Council, and Forkable-by-design — now explained in the README.
- **Dedicated website** — the marketing/docs site moved into its own repository ([beckyos.com](https://beckyos.com)); this repo is now the OS only.
- **Privacy guard** — a `privacy-scan` script (`npm run privacy`) plus a project `SECURITY.md`, so the repo can be checked for personal data, secrets, and brand-specific leaks before anything is committed.

### Changed

- README refreshed for v2 — Quick start, Commands, Agents (all 15), the pillars, Structure, and Principles all updated.
- War room now convenes all 15 agents instead of 7.
- Brand and personal references neutralized throughout the docs for a clean, public open-source release.

## [0.2.0]

### Added

- Memory compiler and the agent-maintained wiki — compiled knowledge from completed work, surfaced for humans and written by agents.
- Closed learning loops — retrospectives and incidents feed new rules back into the system.

## [0.1.0]

### Added

- Initial multi-agent coding OS — role-based pipelines, a single source of truth in `core/rules/`, compiled runtime instructions (`CLAUDE.md`, `AGENTS.md`), and dual-runtime coordination (Claude + Codex).
- The first 7-agent roster, greenfield and brownfield modes, and an independent verification gate.

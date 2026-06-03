Stand up an always-on watcher — monitor → triage → fix → verify, on a schedule. The ambient tier.

The watch scope is: $ARGUMENTS  (e.g. "new Sentry errors", "failing CI on staging", "new tracker issues labelled bug")

If none given, ask: "Usage: `/becky-sentinel <what to watch>`"

`sentinel` is Becky's **ambient** mode: a standing, scheduled loop that watches a signal and acts on it —
but **money, deploys, and destructive actions are always human-gated.** It does not run continuously in
one session; it is a scheduled agent.
Read `core/done-oracle.md` + `core/lessons-ledger.md` first.

## Setup (do this once, with the user)
1. Confirm: the signal source, the cadence, and the **autonomy boundary** — what sentinel may do
   unattended (triage, label, draft a fix PR) vs what it must STOP and ask for (merge, deploy, refund,
   migration, any money/auth change). Default boundary: fix + open a PR to `staging`, never merge/promote.
2. Schedule it with the `/schedule` (CronCreate) skill — a recurring remote agent at the chosen cadence.
   Respect the deployment pipeline: PRs target staging, never main; no auto-merge.

## Each scheduled run (the loop body)
1. **Poll** the signal (error tracker / CI / issues / etc.). If nothing new → log "clear" and stop the run.
2. For each new item: **Fury** triages severity; **Strange/Friday** trace cause + blast radius.
3. Within the autonomy boundary: **Stark** fixes on a branch → **Loki** reviews → **Widow** verifies live →
   open a PR to staging. Beyond the boundary (money/deploy/destructive): STOP, summarise, and notify — never act.
4. A run "delivers" an item only when the Done Oracle is green for that item; otherwise it stays open with evidence.
5. **Watcher** appends any new failure class to `core/lessons-ledger.md`.

## Report (every run)
What it saw, what it did (within boundary), what it escalated (and why), what it could not close.
Never take a gated action autonomously; never report "handled" on something it only triaged.

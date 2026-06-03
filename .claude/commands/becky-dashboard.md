Open the Becky live dashboard — a local web view of every run on this device, updating in real time.

## Start it
Run the server in the background and print the link:
```
BECKY_DASH_PORT=7777 nohup python3 dashboard/server.py >/tmp/becky-dash.log 2>&1 &
```
Then read `/tmp/becky-dash.log` for the line `Becky dashboard live: http://localhost:<port>/` and show it to the user.
If 7777 is taken the server auto-picks the next free port — read the log for the actual URL.

## What the user sees
- **`http://localhost:<port>/`** — the index: every session on this device, each with its own link.
- **`http://localhost:<port>/s/<session-id>`** — the live dashboard for one run: the 13 agents
  (the active one glows), the 12-phase pipeline, the **6 Done-Oracle lights**, iteration + elapsed,
  a red blockers banner, and a scrolling live feed. A green "DELIVERED" banner appears only when
  all six oracle lights are green and status is `delivered`.

## Unique link per session
Every Becky run is a session (its task slug is the id), so **each run has its own URL** — more runs on
this device just means more links, all served by the one server. The index lists them all.

## How runs report into it
Any mode reports by calling the emit pipe (see `dashboard/README.md`):
```
python3 dashboard/emit.py set   <session> --task "..." --mode deliver --status running ...
python3 dashboard/emit.py event <session> "what just happened" --agent stark --phase 9-build --level info
```
`deliver`, `hunt`, `harden`, `migrate`, `sentinel`, and `warroom` all emit at phase/agent/oracle/blocker
points, so launching any of them lights up a fresh session here.

Tip: start the dashboard once at the beginning of a work session; leave it open in a browser tab.

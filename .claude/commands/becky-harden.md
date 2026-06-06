Harden a surface against attack — a security & invariant campaign, looped until no new weakness appears.

The target is: $ARGUMENTS  (a feature, route, or "the whole platform")

If none given, ask: "Usage: `/becky-harden <target>`"

`harden` is the security-focused loop: Deadpool attacks the *trust and integrity* boundaries (auth,
RBAC, injection, money/inventory invariants, concurrency, data isolation), Stark fixes, repeat — until
no new weakness for K rounds. Termination per `core/done-oracle.md` (condition 3). Read it +
`core/lessons-ledger.md` first.

## Loop
1. **Xavier** names the compliance/trust surface that applies (auth, data isolation, money, regulated data).
2. **Deadpool** runs the auth/permission, injection, financial-logic, concurrency, and data-isolation
   categories hardest — every hypothesis tied to an invariant that must hold.
3. **CONFIRMED** weakness → severity-tagged issue → **Stark** fixes → **Loki** reviews (security + L24) →
   **Deadpool** re-attacks. Money/auth/isolation findings are CRITICAL and block the campaign closing.
4. Round is "dry" if no new CONFIRMED weakness. **Stop after K dry rounds** (default K=2).
5. Secondary stop: `max_rounds` (default 8)/budget — if hit first, STOP and report open weaknesses by
   severity; never report "hardened" on a budget-stop.

## Report
Weaknesses found/fixed/verified by severity; dry-streak; residual risk stated plainly.
Hand to **Watcher** → new weakness classes become `core/lessons-ledger.md` rows (owner: Strange or Loki).

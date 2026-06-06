# Becky demo — renders docs/demo.gif
# Reproduce with: vhs docs/demo.tape   (brew install vhs)
#
# Shows the hook: one command spins up a whole 14-phase engineering org,
# every phase with a named owner and an independent verifier.

Output docs/demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1240
Set Height 860
Set Padding 26
Set Theme "Catppuccin Mocha"
Set TypingSpeed 42ms
Set PlaybackSpeed 1.0

# --- hidden setup: make `becky` runnable, silence npm + node noise ---
Hide
Type "export NODE_NO_WARNINGS=1" Enter
Type "alias becky='npm run --silent becky --'" Enter
Type "clear" Enter
Show
Sleep 500ms

# --- the team, on a page ---
Type "becky status"
Sleep 600ms
Enter
Sleep 3s

# --- a whole engineering org in one command ---
Type "becky greenfield ""add CSV export to the reports page"""
Sleep 600ms
Enter
Sleep 4.5s

# --- the differentiator: the builder never grades its own build ---
Type "# 14 phases. each one a named owner — and a *different* agent verifies it."
Sleep 500ms
Enter
Sleep 1.8s
Type "# loops stop on runtime proof, never on an agent saying ""done."""
Sleep 500ms
Enter
Sleep 3.5s

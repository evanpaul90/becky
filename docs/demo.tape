# Becky demo — renders docs/demo.gif
# Reproduce with: vhs docs/demo.tape   (brew install vhs)
#
# Shows the hook: one command spins up a whole 14-phase engineering org,
# every phase with a named owner and an independent verifier.

Output docs/demo.gif

Set Shell "bash"
Set FontSize 18
Set Width 1280
Set Height 760
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms
Set PlaybackSpeed 1.0

# --- the team, on a page ---
Type "becky status"
Sleep 600ms
Enter
Sleep 3s

# --- a whole engineering org in one command ---
Type "becky greenfield ""add CSV export to the reports page"""
Sleep 600ms
Enter
Sleep 4s

# --- the differentiator: the builder never grades its own build ---
Type "# 14 phases. each one a named owner — and a *different* agent verifies it."
Sleep 600ms
Enter
Sleep 2s
Type "# loops stop on runtime proof, never on an agent saying ""done.\"""
Sleep 600ms
Enter
Sleep 3.5s

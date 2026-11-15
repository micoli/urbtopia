---
status: accepted
---

# Guided demonstrations replay semantic scripts in an isolated interior

Interior explanations use versioned semantic game actions and detailed steps
played by the game engine in an isolated demonstration state, rather than
recorded screen clicks or pre-rendered videos. This permits deterministic
previous-step restoration and replay against current game rules across screen
sizes; the player's City stays frozen and receives no Catch-up for viewing time.
Scenario checks must identify obsolete expected outcomes and block publication
until corrected, because rerunning a script alone cannot guarantee that its
explanation is still correct.

The user approved the complete scope in `.scratch/interior-demonstrations/spec.md`
and authorized implementation. This adds a teaching mode alongside the existing Tutorial,
Venue tutorials and layout examples; it does not redefine them.

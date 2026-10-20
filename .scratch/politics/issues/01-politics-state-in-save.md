# Politics state in the save

Status: resolved

Add the politics block to the game state and the save (absent = no politics, ADR 0003), with its own stream of the game's Seed (ADR 0010). Gate it on a built Town hall and a Difficulty of Easy or above. Carry it through Cloud save and conflict comparison.

Acceptance: an old save loads without politics and plays identically; the block round-trips; a Cozy city has none; tests for load, save, gate and Cloud comparison.

Spec: `../spec.md`

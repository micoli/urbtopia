---
status: accepted
---

# The Daily puzzle is a deterministic grid simulation built from its solution

A Daily puzzle must be random, the same for every Player, always solvable, and cheap to publish. Two choices shape everything else: how the Contraption is simulated, and how a puzzle is proved solvable.

## Decision

- **The simulation is a deterministic grid stepped by ticks**, with no floating-point physics. Each Part follows a simple rule (ramp, conveyor, trampoline, spring, seesaw, fan). Two browsers always give the same result for the same Contraption.
- **A puzzle is generated from its solution.** A winning Contraption is built first, its movable Parts are moved to the player's inventory, and decoy Parts are added. The simulation replays the witness solution before the puzzle is accepted. No search for a solution is needed.
- **The server stores only a seed and a difficulty per day.** The pure generator in the core builds the board from them, the same code for everybody, so the database stays tiny and holds no puzzle content.
- **The win is declared by the client and the server locks one win per Player account per day**, as for the Daily challenge in [ADR 0031](0031-challenges-dispatched-by-server-completion-trusts-client.md). It pays a fixed amount of Urbs by difficulty and counts towards cumulative Medals.
- **A fixed batch of seeds is solved in CI** for every difficulty, so a generator change that yields an unsolvable puzzle fails the build. A local `tools/puzzle-lab` shows a seed, steps its simulation and runs the batch.

## Consequences

- A physics engine would feel richer and give more variety, but results could differ between devices and solvability could not be proved without playing. The grid trades variety for certainty.
- Searching for a solution after a random draw would give more varied puzzles, but its cost grows quickly with the size of a hard board and many draws would be rejected.
- Because the client is trusted, a determined player can claim a win without playing. The gain is a fixed, small amount of Urbs, once a day.

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

## Amendment: a continuous simulation instead of a grid

The grid stepped the ball from cell to cell, and it showed: a fan moved the ball one cell and let go, a bounce rose and then fell back straight down. The simulation is now continuous, still deterministic.

- **Fixed time step.** The ball has a position and a velocity, moved 60 times a second with gravity, a light air drag and, when the ball is going fast, sub-steps so that it cannot cross a surface. A run ends when the target has caught the ball and it has come to rest in the cup, when the ball falls out of the bottom of the board, when it has barely moved for a second anywhere else, or after 20 seconds.
- **Reproducible on every device.** Only `+ - * /` and `Math.sqrt` are used, and no `sin`, `cos` or random: an engine computes them all the same way, so the same Contraption gives the same trajectory everywhere. The objection to a physics engine that the grid answered, results that differ between devices, does not apply to code of this kind.
- **Parts are surfaces and a force.** A ramp, a conveyor, a trampoline, a spring and a seesaw are segments in their cell with their own bounce, grip or launch; a fan is a zone three cells long with a wind that weakens with the distance. The momentum of the ball is kept from one Part to the next, and the side walls send the ball back.
- **Placement and generation stay on cells.** The player still puts a Part on a cell, and the puzzle is still built from its solution: the Parts are put on the cells the simulated trajectory goes through, the witness is replayed, and a Part the witness does not touch is refused. The batch in CI is 300 seeds per difficulty, a hard puzzle taking about 100 ms to build, ten times more than on the grid.
- **The screen plays the trajectory.** The simulation gives the samples of the ball and the events (a bounce, the jet of a fan, the ball going into a candle), and the screen plays them back in real time, each Part playing its clip on its event.
- **Constants.** They are in `PHYSICS` and the puzzle lab changes them live, with the path of the ball drawn over the board to judge a trajectory at a glance.

A cost remains: a run that goes round without ever settling, such as a ball between two conveyors, lasts the 20 seconds, where the grid noticed a loop at once. The player can stop a run at any time.

## Amendment: side walls, no floor, and the target is the cup that catches the ball

- **Side walls.** The ball bounces on the two sides of the board (half of its speed is kept), and the screen draws them: a column of wall segments on each side, which gives a little when the ball hits it.
- **No floor.** The bottom of the board is a void: a ball that goes under it is lost at once, and the run ends. Only a target can stop it: the cup of a Deliver, or the exit of a Collect, catches a ball that reaches its rim within 0.35 cell of its middle, and the ball then rolls to rest in it.
- **Every puzzle has a target**, since without one no ball could ever be caught. A puzzle always carries a Deliver or a Collect, and the other Aims come on top of it. The generator puts the target where the witness ball reaches the bottom, and keeps a puzzle only if the ball comes down close enough to the middle of the cup.
- **Cost.** A hard puzzle takes about 170 ms to build, so the batch of CI is 300 seeds for easy and medium and 100 for hard.

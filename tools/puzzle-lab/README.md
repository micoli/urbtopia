# Puzzle lab

Local tool to look at the Daily puzzles the game generates. Never deployed: the root build only bundles the game. See ADR 0096.

```
npm run puzzle-lab      # http://localhost:5184 (fixed port)
```

It imports the pure module `src/core/dailyPuzzle`, so what it shows is what the game plays.

- Seed and difficulty: the board, its Aims, the inventory and the witness solution (hide it to see the board bare).
- Playback: reset, step, play or drag the slider to follow the ball tick by tick along its path.
- Batch: generates a fixed batch of seeds for each difficulty, checks that the witness solves each puzzle and that none is solved with no Part, and gives the time per puzzle and the average run length. The same check runs in CI (`src/core/dailyPuzzle/solvability.test.ts`).

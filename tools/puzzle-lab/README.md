# Puzzle lab

Local tool to look at the Daily puzzles the game generates. Never deployed: the root build only bundles the game. See ADR 0096.

```
npm run puzzle-lab      # http://localhost:5184 (fixed port)
```

It imports the pure module `src/core/dailyPuzzle`, so what it shows is what the game plays.

- Seed and difficulty: the board, its Aims, the inventory and the witness solution (hide it to see the board bare). The board is drawn with the real models of `assets/managed-models/puzzle`, served from their folders, and lit like the glb-viewer. Drag to turn the camera, scroll to zoom, double-click to frame the board again.
- Playback: reset, step, play or drag the slider to follow the ball tick by tick along its path. The ball rolls from cell to cell and each Part it reaches plays its clip (bounce, launch, flip, blow, run, hit); candles light, switches flip, stars are taken and the target pops when the ball is delivered. The slider shows the state of the board at any tick without motion.
- Batch: generates a fixed batch of seeds for each difficulty, checks that the witness solves each puzzle and that none is solved with no Part, and gives the time per puzzle and the average run length. The same check runs in CI (`src/core/dailyPuzzle/solvability.test.ts`).
- Lighting: `vivid` (the lighting of the puzzle, `src/scene/puzzleLighting.ts`) or `city` (the lighting of the game, to compare). **Measure colours** paints flat swatches of the palette in front of the board and reads back what the screen draws, as a percentage of the brightness it was painted in. The `window.puzzleLab` object lets you change a value of `PUZZLE_LIGHTINGS` in the browser console, call `board.setLighting(name)` and measure again, to tune a lighting live.

import type { PuzzleBoardScene } from '../scene/puzzle/PuzzleBoardScene';

// The scene of the Daily puzzle screen, for the drag layer to ask which cell is under the pointer.
export const puzzleSceneHandle: { current: PuzzleBoardScene | null } = { current: null };

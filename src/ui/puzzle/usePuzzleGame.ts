import { useMemo } from 'react';
import { useStore } from 'zustand';
import { remainingInventory } from '../../core/dailyPuzzle/contraption';
import { isMet, runBall } from '../../core/dailyPuzzle/simulate';
import type { Cell, Puzzle, Trajectory } from '../../core/dailyPuzzle/types';
import { freeCellsFor, puzzleStore, type PuzzlePhase } from '../../store/puzzleStore';

export interface PuzzleView {
  puzzle: Puzzle;
  phase: PuzzlePhase;
  solved: boolean;
  parts: ReturnType<typeof puzzleStore.getState>['editor']['parts'];
  // The tray: the Parts not on the board yet, grouped by kind.
  tray: { kind: string; count: number }[];
  held: ReturnType<typeof puzzleStore.getState>['held'];
  free: Cell[];
  canUndo: boolean;
  // What a run of the Parts on the board does, worked out once the player presses Run.
  trajectory: Trajectory | undefined;
  willSolve: boolean;
}

export function usePuzzleGame(puzzle: Puzzle): PuzzleView {
  const editor = useStore(puzzleStore, (store) => store.editor);
  const held = useStore(puzzleStore, (store) => store.held);
  const phase = useStore(puzzleStore, (store) => store.phase);
  const solved = useStore(puzzleStore, (store) => store.solved);
  const tray = useMemo(() => {
    const counts = new Map<string, number>();
    for (const kind of remainingInventory(puzzle, editor)) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    return [...counts].map(([kind, count]) => ({ kind, count })).sort((a, b) => a.kind.localeCompare(b.kind));
  }, [puzzle, editor]);
  const drag = useStore(puzzleStore, (store) => store.drag);
  const carried = held ?? (drag?.active ? drag.source : null);
  const free = useMemo(() => freeCellsFor(puzzle, editor, carried), [puzzle, editor, carried]);
  const run = useMemo(() => {
    if (phase === 'edit') return { trajectory: undefined, willSolve: false };
    const trajectory = runBall(puzzle.board, editor.parts);
    return { trajectory, willSolve: trajectory.landed && puzzle.board.aims.every((aim) => isMet(aim, trajectory)) };
  }, [phase, puzzle, editor.parts]);
  return { puzzle, phase, solved, parts: editor.parts, tray, held, free, canUndo: editor.past.length > 0, trajectory: run.trajectory, willSolve: run.willSolve };
}

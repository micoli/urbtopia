import { createStore } from 'zustand/vanilla';
import { clearParts, isFreeCell, movePart, newEditor, placePart, remainingInventory, removePart, undo as undoEdit, type Editor } from '../core/dailyPuzzle/contraption';
import { generatePuzzle } from '../core/dailyPuzzle/generate';
import type { Cell, Difficulty, Puzzle } from '../core/dailyPuzzle/types';

// What the player holds: a Part of the tray, or a Part already on the board that is about to be moved or taken back.
export type Held = { kind: string } | { cell: Cell } | null;

// `edit` while the Parts can change, `run` while the ball rolls, `done` once it has stopped: the grid stays locked until the player goes back to the start.
export type PuzzlePhase = 'edit' | 'run' | 'done';

// A press on a Part arms a drag; it becomes one once the pointer has moved, so that a plain tap still picks or lifts the Part.
export interface Drag {
  source: { kind: string } | { cell: Cell };
  active: boolean;
  over: Cell | undefined;
  // Where the press happened, on the screen: a drag starts once the pointer is some distance from it.
  start: { x: number; y: number } | undefined;
}

export type DropTarget = { cell: Cell } | 'tray' | null;

export interface PuzzleStore {
  puzzle: Puzzle | null;
  drag: Drag | null;
  editor: Editor;
  held: Held;
  phase: PuzzlePhase;
  solved: boolean;
  open: (seed: string, difficulty: Difficulty) => void;
  close: () => void;
  pickKind: (kind: string) => void;
  tapCell: (cell: Cell | undefined) => void;
  takeBack: () => void;
  undo: () => void;
  clear: () => void;
  run: () => void;
  finishRun: (solved: boolean) => void;
  reset: () => void;
  // For the dev tools: puts the witness of the puzzle on the board, as one edit that can be undone.
  solveForDev: () => void;
  armDrag: (source: Drag['source'], start?: { x: number; y: number }) => void;
  activateDrag: () => void;
  dragOver: (cell: Cell | undefined) => void;
  dropDrag: (target: DropTarget) => void;
  cancelDrag: () => void;
}

let dragEndedAt = Number.NEGATIVE_INFINITY;
const CLICK_AFTER_DRAG_MS = 250;

// A drag that ends on the button it started from is also a click: the tray lets that click go by.
export const dragJustEnded = (): boolean => performance.now() - dragEndedAt < CLICK_AFTER_DRAG_MS;

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const EMPTY = { editor: newEditor(), held: null, phase: 'edit', solved: false, drag: null } as const;

// The Contraption in progress lives here and is never saved: leaving the screen drops it.
export const puzzleStore = createStore<PuzzleStore>((set, get) => ({
  puzzle: null,
  ...EMPTY,
  open: (seed, difficulty) => set({ puzzle: generatePuzzle(seed, difficulty), ...EMPTY }),
  close: () => set({ puzzle: null, ...EMPTY }),
  pickKind: (kind) => {
    const { held, phase } = get();
    if (phase !== 'edit') return;
    set({ held: held && 'kind' in held && held.kind === kind ? null : { kind } });
  },
  tapCell: (cell) => {
    const { puzzle, editor, held, phase } = get();
    if (!puzzle || phase !== 'edit') return;
    if (!cell) return set({ held: null });
    const partHere = editor.parts.some((part) => sameCell(part.at, cell));
    if (held && 'kind' in held) {
      const next = placePart(puzzle, editor, held.kind, cell);
      if (next) return set({ editor: next, held: remainingInventory(puzzle, next).includes(held.kind) ? held : null });
      if (partHere) set({ held: { cell } });
      return;
    }
    if (held) {
      if (partHere) return set({ held: sameCell(held.cell, cell) ? null : { cell } });
      const moved = movePart(puzzle, editor, held.cell, cell);
      if (moved) set({ editor: moved, held: null });
      return;
    }
    if (partHere) set({ held: { cell } });
  },
  takeBack: () => {
    const { editor, held, phase } = get();
    if (phase !== 'edit' || !held || 'kind' in held) return;
    const next = removePart(editor, held.cell);
    if (next) set({ editor: next, held: null });
  },
  undo: () => {
    const next = undoEdit(get().editor);
    if (get().phase === 'edit' && next) set({ editor: next, held: null });
  },
  clear: () => {
    const next = clearParts(get().editor);
    if (get().phase === 'edit' && next) set({ editor: next, held: null });
  },
  run: () => {
    if (get().phase === 'edit') set({ phase: 'run', held: null });
  },
  finishRun: (solved) => set({ phase: 'done', solved }),
  reset: () => set({ phase: 'edit', solved: false }),
  solveForDev: () => {
    const { puzzle, editor, phase } = get();
    if (!puzzle || phase !== 'edit') return;
    set({ editor: { parts: puzzle.witness, past: [...editor.past, editor.parts] }, held: null });
  },
  armDrag: (source, start) => {
    if (get().phase === 'edit') set({ drag: { source, active: false, over: undefined, start } });
  },
  activateDrag: () => {
    const { drag } = get();
    if (drag) set({ drag: { ...drag, active: true }, held: null });
  },
  dragOver: (cell) => {
    const { drag } = get();
    if (drag) set({ drag: { ...drag, over: cell } });
  },
  dropDrag: (target) => {
    const { puzzle, editor, drag } = get();
    if (drag?.active) dragEndedAt = performance.now();
    set({ drag: null });
    if (!puzzle || !drag || !target) return;
    if ('kind' in drag.source) {
      const next = target !== 'tray' ? placePart(puzzle, editor, drag.source.kind, target.cell) : undefined;
      if (next) set({ editor: next });
      return;
    }
    const next = target === 'tray' ? removePart(editor, drag.source.cell) : movePart(puzzle, editor, drag.source.cell, target.cell);
    if (next) set({ editor: next });
  },
  cancelDrag: () => {
    if (get().drag?.active) dragEndedAt = performance.now();
    set({ drag: null });
  },
}));

// The cells the held Part may go on: every free cell for a Part of the tray, every free cell for a Part of the board once it is lifted.
export function freeCellsFor(puzzle: Puzzle, editor: Editor, held: Held): Cell[] {
  if (!held) return [];
  const others = 'cell' in held ? editor.parts.filter((part) => !sameCell(part.at, held.cell)) : editor.parts;
  const cells: Cell[] = [];
  for (let y = 0; y < puzzle.board.height; y += 1) {
    for (let x = 0; x < puzzle.board.width; x += 1) if (isFreeCell(puzzle, others, { x, y })) cells.push({ x, y });
  }
  return cells;
}

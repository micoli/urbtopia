import type { Aim, Cell, PlacedPart, Puzzle } from './types';

export interface Editor {
  parts: PlacedPart[];
  past: PlacedPart[][];
}

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

export const newEditor = (): Editor => ({ parts: [], past: [] });

function aimCells(aim: Aim): Cell[] {
  if (aim.kind === 'deliver') return [aim.target];
  if (aim.kind === 'light') return aim.candles;
  if (aim.kind === 'flip') return aim.switches;
  return [...aim.stars, aim.exit];
}

/** A cell a Part may stand on: on the board but above the bottom row, where the ball stops and a Part would never act, and clear of the ball start, the aim elements and the other Parts. */
export function isFreeCell(puzzle: Puzzle, parts: PlacedPart[], cell: Cell): boolean {
  const { width, height, ballStart, aims } = puzzle.board;
  if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height - 1) return false;
  if (sameCell(cell, ballStart)) return false;
  if (aims.some((aim) => aimCells(aim).some((element) => sameCell(element, cell)))) return false;
  return !parts.some((part) => sameCell(part.at, cell));
}

/** The Parts of the inventory that are not on the board yet, one entry per copy. */
export function remainingInventory(puzzle: Puzzle, editor: Editor): string[] {
  const remaining = [...puzzle.inventory];
  for (const { kind } of editor.parts) remaining.splice(remaining.indexOf(kind), 1);
  return remaining;
}

function edited(editor: Editor, parts: PlacedPart[]): Editor {
  return { parts, past: [...editor.past, editor.parts] };
}

export function placePart(puzzle: Puzzle, editor: Editor, kind: string, cell: Cell): Editor | undefined {
  if (!remainingInventory(puzzle, editor).includes(kind)) return undefined;
  if (!isFreeCell(puzzle, editor.parts, cell)) return undefined;
  return edited(editor, [...editor.parts, { kind, at: cell }]);
}

export function movePart(puzzle: Puzzle, editor: Editor, from: Cell, to: Cell): Editor | undefined {
  const part = editor.parts.find((candidate) => sameCell(candidate.at, from));
  if (!part) return undefined;
  const others = editor.parts.filter((candidate) => candidate !== part);
  if (!isFreeCell(puzzle, others, to)) return undefined;
  return edited(editor, [...others, { kind: part.kind, at: to }]);
}

export function removePart(editor: Editor, cell: Cell): Editor | undefined {
  if (!editor.parts.some((part) => sameCell(part.at, cell))) return undefined;
  return edited(editor, editor.parts.filter((part) => !sameCell(part.at, cell)));
}

export function clearParts(editor: Editor): Editor | undefined {
  if (editor.parts.length === 0) return undefined;
  return edited(editor, []);
}

export function undo(editor: Editor): Editor | undefined {
  const previous = editor.past[editor.past.length - 1];
  if (!previous) return undefined;
  return { parts: previous, past: editor.past.slice(0, -1) };
}

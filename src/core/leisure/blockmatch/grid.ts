import type { Grid, Pos } from './types';

type Dimensions = { rows: number; cols: number };

export const NEIGHBORS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export const createGrid = <T>(rows: number, cols: number, value: T): Grid<T> =>
  Array.from({ length: rows }, () => Array<T>(cols).fill(value));

export const cellKey = (r: number, c: number) => `${r},${c}`;

export const inBounds = (board: Dimensions, r: number, c: number) => r >= 0 && r < board.rows && c >= 0 && c < board.cols;

export const rowCells = (board: Dimensions, r: number): Pos[] => Array.from({ length: board.cols }, (_, c) => ({ r, c }));

export const colCells = (board: Dimensions, c: number): Pos[] => Array.from({ length: board.rows }, (_, r) => ({ r, c }));

export const allCells = (board: Dimensions): Pos[] =>
  Array.from({ length: board.rows }, (_, r) => rowCells(board, r)).flat();

export const squareCells = (r: number, c: number, radius: number) => {
  const cells: Pos[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) cells.push({ r: r + dr, c: c + dc });
  }
  return cells;
};

export const setMirrored = <T>(grid: Grid<T>, r: number, c: number, value: T) => {
  grid[r]![c] = value;
  grid[r]![grid[r]!.length - 1 - c] = value;
};

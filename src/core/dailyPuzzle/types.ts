export interface Cell {
  x: number;
  y: number;
}

export type Aim =
  | { kind: 'deliver'; target: Cell }
  | { kind: 'light'; candles: Cell[] }
  | { kind: 'flip'; switches: Cell[] }
  | { kind: 'collect'; stars: Cell[]; exit: Cell };

export interface Board {
  width: number;
  height: number;
  ballStart: Cell;
  aims: Aim[];
}

export interface PlacedPart {
  kind: string;
  at: Cell;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  board: Board;
  inventory: string[];
  witness: PlacedPart[];
}

// What the ball goes through, at a moment of the run. `hit`: it touches a Part (a bounce, a launch, a slide starts); `belt`/`belt-end`: it rides a conveyor; `jet`/`jet-end`: it is in the jet
// of a fan; `flip`: a seesaw has turned over once the ball has left it; `enter`: it goes into the cell of an Aim element (a candle, a switch, a star); `wall`: it hits a side wall, the cell
// being the one beyond the board on that side, in the row of the ball.
export type BallEventKind = 'hit' | 'belt' | 'belt-end' | 'jet' | 'jet-end' | 'flip' | 'enter' | 'wall';

export interface BallEvent {
  t: number;
  kind: BallEventKind;
  cell: Cell;
}

// The whole run: the ball at every `step` seconds (xs and ys are the centre of the ball, in cells, y down), what happened and how it ended.
export interface Trajectory {
  step: number;
  xs: number[];
  ys: number[];
  events: BallEvent[];
  // The ball was caught by the target and came to rest in it, in the cell `landing`. The board has no floor: a ball that is not caught falls out of the bottom and is lost.
  landed: boolean;
  landing: Cell | undefined;
  // Where, and when, the ball first reached the rim of the cups at the bottom of the board, caught or not: where a target has to stand to catch it.
  crossing: { x: number; t: number } | undefined;
}

export interface SimulationResult {
  solved: boolean;
  seconds: number;
}

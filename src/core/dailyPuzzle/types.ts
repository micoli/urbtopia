export interface Cell {
  x: number;
  y: number;
}

export type Aim = { kind: 'deliver'; target: Cell } | { kind: 'light'; candles: Cell[] } | { kind: 'flip'; switches: Cell[] } | { kind: 'collect'; stars: Cell[]; exit: Cell };

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

export interface SimulationResult {
  solved: boolean;
  ticks: number;
}

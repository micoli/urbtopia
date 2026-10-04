export type Pos = { r: number; c: number };

export type Special = 'rocketH' | 'rocketV' | 'bomb' | 'lightball';

export type SolutionStep = { move: Move; board: Board };

export type ActivationType = Special | 'bigBomb' | 'cross' | 'bigCross' | 'color' | 'all';

export type Tile = {
  id: number;
  color: number | null;
  special: Special | null;
  drop: number;
  pop?: boolean;
  clearing?: boolean;
};

export type Grid<T> = T[][];

export type Board = {
  rows: number;
  cols: number;
  colors: number;
  holes: Grid<boolean>;
  boxes: Grid<number>;
  ice: Grid<number>;
  tiles: Grid<Tile | null>;
};

export type Goal =
  | { type: 'color'; color: number; target: number }
  | { type: 'box'; target: number }
  | { type: 'ice'; target: number };

export type GoalProgress = Goal & { remaining: number };

export type Level = {
  seed: string;
  number: number;
  difficulty: number;
  rows: number;
  cols: number;
  colors: number;
  holes: Grid<boolean>;
  boxes: Grid<number>;
  ice: Grid<number>;
  goals: Goal[];
  moves: number;
  tileSeed: number;
};

export type Rng = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  chance: (probability: number) => boolean;
  shuffle: <T>(items: T[]) => T[];
  getState: () => number;
  setState: (value: number) => void;
};

export type Activation = Pos & { type: ActivationType; color?: number | null };

export type Blast = Activation & { cells: Pos[] };

export type MatchGroup = {
  color: number | null;
  cells: Pos[];
  special: Special | null;
  origin: Pos;
};

export type Plan = {
  cleared: Pos[];
  boxHits: Pos[];
  created: (Pos & { special: Special })[];
  blasts: Blast[];
  converted?: boolean;
};

export type ClearStats = {
  colors: Record<number, number>;
  boxes: number;
  ice: number;
};

export type Move = { from: Pos; to: Pos | null };

export type Progress = {
  unlocked: number;
  stars: Record<number, number>;
  score: number;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type Effect =
  | { id: number; kind: 'burst'; r: number; c: number; color: number | 'special' }
  | { id: number; kind: 'shatter'; r: number; c: number; material: 'ice' | 'wood'; broken: boolean }
  | { id: number; kind: 'beam'; dir: 'h' | 'v'; r: number; c: number; originR: number; originC: number }
  | { id: number; kind: 'shockwave'; r: number; c: number; radius: number }
  | { id: number; kind: 'lightning'; r: number; c: number; targets: Pos[] };

export type EffectOf<K extends Effect['kind']> = Extract<Effect, { kind: K }>;

import {
  NEIGHBORS,
  allCells,
  cellKey,
  colCells,
  createGrid,
  inBounds,
  rowCells,
  squareCells,
} from './grid';
import { createRng } from './rng';
import type {
  Activation,
  ActivationType,
  Board,
  ClearStats,
  Level,
  MatchGroup,
  Move,
  Plan,
  Pos,
  Rng,
  Special,
  Tile,
} from './types';

type Run = { dir: 'h' | 'v'; color: number; cells: Pos[] };

const ROCKETS: Special[] = ['rocketH', 'rocketV'];
const BOMB_RADIUS = 2;
const BIG_BOMB_RADIUS = 3;
const MAX_FILL_ATTEMPTS = 100;

let nextTileId = 1;

export const createTile = (color: number | null, special: Special | null = null, extra: Partial<Tile> = {}): Tile => ({
  id: nextTileId++,
  color,
  special,
  drop: 0,
  ...extra,
});

const isRocket = (special: Special | null) => (ROCKETS as (Special | null)[]).includes(special);

export const isFillable = (board: Board, r: number, c: number) =>
  inBounds(board, r, c) && !board.holes[r]![c] && board.boxes[r]![c] === 0;

const colorAt = (board: Board, r: number, c: number) => {
  const tile = inBounds(board, r, c) ? board.tiles[r]![c] : null;
  if (!tile || tile.special) return null;
  return tile.color;
};

export const cloneBoard = (board: Board): Board => ({
  ...board,
  tiles: board.tiles.map((row) => [...row]),
  boxes: board.boxes.map((row) => [...row]),
  ice: board.ice.map((row) => [...row]),
});

export const areAdjacent = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export const swapTiles = (board: Board, a: Pos, b: Pos) => {
  const tile = board.tiles[a.r]![a.c];
  board.tiles[a.r]![a.c] = board.tiles[b.r]![b.c]!;
  board.tiles[b.r]![b.c] = tile!;
};

const scanLine = (board: Board, cells: Pos[], dir: 'h' | 'v', runs: Run[]) => {
  let start = 0;
  while (start < cells.length) {
    const color = colorAt(board, cells[start]!.r, cells[start]!.c);
    let end = start;
    while (
      color !== null &&
      end + 1 < cells.length &&
      colorAt(board, cells[end + 1]!.r, cells[end + 1]!.c) === color
    ) {
      end++;
    }
    if (color !== null && end - start >= 2) runs.push({ dir, color, cells: cells.slice(start, end + 1) });
    start = end + 1;
  }
};

const specialForGroup = (longest: Run, hasH: boolean, hasV: boolean): Special | null => {
  if (longest.cells.length >= 5) return 'lightball';
  if (hasH && hasV) return 'bomb';
  if (longest.cells.length === 4) return longest.dir === 'h' ? 'rocketH' : 'rocketV';
  return null;
};

const buildGroup = (runs: Run[]): MatchGroup => {
  const cells = new Map<string, Pos>();
  const hits = new Map<string, number>();
  runs.forEach((run) =>
    run.cells.forEach((cell) => {
      const key = cellKey(cell.r, cell.c);
      cells.set(key, cell);
      hits.set(key, (hits.get(key) ?? 0) + 1);
    }),
  );
  const longest = runs.reduce((best, run) => (run.cells.length > best.cells.length ? run : best));
  const hasH = runs.some((run) => run.dir === 'h');
  const hasV = runs.some((run) => run.dir === 'v');
  const crossKey = [...hits].find(([, count]) => count > 1)?.[0];
  return {
    color: runs[0]!.color,
    cells: [...cells.values()],
    special: specialForGroup(longest, hasH, hasV),
    origin: crossKey ? cells.get(crossKey)! : longest.cells[Math.floor(longest.cells.length / 2)]!,
  };
};

export const findMatches = (board: Board) => {
  const runs: Run[] = [];
  for (let r = 0; r < board.rows; r++) scanLine(board, rowCells(board, r), 'h', runs);
  for (let c = 0; c < board.cols; c++) scanLine(board, colCells(board, c), 'v', runs);

  const parent = runs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const owner = new Map<string, number>();
  runs.forEach((run, i) =>
    run.cells.forEach(({ r, c }) => {
      const key = cellKey(r, c);
      const existing = owner.get(key);
      if (existing !== undefined) parent[find(i)] = find(existing);
      else owner.set(key, i);
    }),
  );

  const byRoot = new Map<number, Run[]>();
  runs.forEach((run, i) => {
    const root = find(i);
    byRoot.set(root, [...(byRoot.get(root) ?? []), run]);
  });
  return [...byRoot.values()].map(buildGroup);
};

const mostCommonColor = (board: Board) => {
  const counts = new Map<number, number>();
  board.tiles.flat().forEach((tile) => {
    if (tile && !tile.special && tile.color !== null) counts.set(tile.color, (counts.get(tile.color) ?? 0) + 1);
  });
  let best: number | null = null;
  let bestCount = 0;
  counts.forEach((count, color) => {
    if (count <= bestCount) return;
    best = color;
    bestCount = count;
  });
  return best;
};

const colorCells = (board: Board, color: number | null | undefined) => {
  if (color === null || color === undefined) return [];
  return allCells(board).filter(({ r, c }) => colorAt(board, r, c) === color);
};

const blastCells = (board: Board, { r, c, type, color }: Activation): Pos[] => {
  switch (type) {
    case 'rocketH':
      return rowCells(board, r);
    case 'rocketV':
      return colCells(board, c);
    case 'bomb':
      return squareCells(r, c, BOMB_RADIUS);
    case 'bigBomb':
      return squareCells(r, c, BIG_BOMB_RADIUS);
    case 'cross':
      return [...rowCells(board, r), ...colCells(board, c)];
    case 'bigCross':
      return [-1, 0, 1].flatMap((d) => [...rowCells(board, r + d), ...colCells(board, c + d)]);
    case 'lightball':
      return colorCells(board, mostCommonColor(board));
    case 'color':
      return colorCells(board, color);
    case 'all':
      return allCells(board);
    default:
      return [];
  }
};

const LIGHTNING_TYPES: ActivationType[] = ['color', 'lightball'];

type ClearInput = {
  groups?: MatchGroup[];
  activations?: Activation[];
  consumed?: Pos[];
  swapCells?: Pos[];
};

export const planClear = (
  board: Board,
  { groups = [], activations = [], consumed = [], swapCells = [] }: ClearInput = {},
): Plan => {
  const cleared = new Map<string, Pos>();
  const boxHits = new Map<string, Pos>();
  const activated = new Set<string>();
  const created: Plan['created'] = [];
  const queue = [...activations];

  const clearCell = (r: number, c: number) => cleared.set(cellKey(r, c), { r, c });
  const hitBox = (r: number, c: number) => boxHits.set(cellKey(r, c), { r, c });
  const hitAdjacentBoxes = (r: number, c: number) =>
    NEIGHBORS.forEach(([dr, dc]) => {
      if (inBounds(board, r + dr, c + dc) && board.boxes[r + dr]![c + dc]! > 0) hitBox(r + dr, c + dc);
    });
  const hit = (r: number, c: number) => {
    if (!inBounds(board, r, c) || board.holes[r]![c]) return;
    if (board.boxes[r]![c]! > 0) {
      hitBox(r, c);
      return;
    }
    const tile = board.tiles[r]![c];
    if (!tile) return;
    clearCell(r, c);
    const key = cellKey(r, c);
    if (!tile.special || activated.has(key)) return;
    activated.add(key);
    queue.push({ r, c, type: tile.special });
  };

  [...consumed, ...activations].forEach(({ r, c }) => {
    activated.add(cellKey(r, c));
    clearCell(r, c);
  });

  groups.forEach((group) => {
    group.cells.forEach(({ r, c }) => {
      clearCell(r, c);
      hitAdjacentBoxes(r, c);
    });
    if (!group.special) return;
    const origin =
      group.cells.find((cell) => swapCells.some((s) => s.r === cell.r && s.c === cell.c)) ?? group.origin;
    created.push({ ...origin, special: group.special });
  });

  const blasts: Plan['blasts'] = [];
  while (queue.length) {
    const activation = queue.shift()!;
    const cells = blastCells(board, activation);
    blasts.push({ ...activation, cells });
    cells.forEach(({ r, c }) => hit(r, c));
    if (!LIGHTNING_TYPES.includes(activation.type)) continue;
    cells.forEach(({ r, c }) => {
      if (inBounds(board, r, c) && board.boxes[r]![c] === 0) hitAdjacentBoxes(r, c);
    });
  }

  return { cleared: [...cleared.values()], boxHits: [...boxHits.values()], created, blasts };
};

const planSpecialCombo = (board: Board, from: Pos, to: Pos, rng: Rng): Plan => {
  const types = [board.tiles[from.r]![from.c]!.special, board.tiles[to.r]![to.c]!.special];
  const consumed = [from, to];
  const lightballs = types.filter((type) => type === 'lightball').length;

  if (lightballs === 2) return planClear(board, { consumed, activations: [{ ...to, type: 'all' }] });

  if (lightballs === 1) {
    const partner = types.find((type) => type !== 'lightball')!;
    const partnerPos = types[0] === 'lightball' ? to : from;
    const converted = colorCells(board, mostCommonColor(board)).map(({ r, c }) => {
      const special = isRocket(partner) ? rng.pick(ROCKETS) : partner;
      board.tiles[r]![c] = createTile(null, special, { pop: true });
      return { r, c, type: special as ActivationType };
    });
    const plan = planClear(board, { consumed, activations: [...converted, { ...partnerPos, type: partner }] });
    return { ...plan, converted: true };
  }

  if (types.every(isRocket)) return planClear(board, { consumed, activations: [{ ...to, type: 'cross' }] });
  if (types.every((type) => type === 'bomb')) {
    return planClear(board, { consumed, activations: [{ ...to, type: 'bigBomb' }] });
  }
  return planClear(board, { consumed, activations: [{ ...to, type: 'bigCross' }] });
};

// Expects the swap to be already applied on the board.
export const resolveSwap = (board: Board, from: Pos, to: Pos, rng: Rng): Plan | null => {
  const moved = board.tiles[to.r]![to.c]!;
  const other = board.tiles[from.r]![from.c]!;

  if (!moved.special && !other.special) {
    const groups = findMatches(board);
    return groups.length ? planClear(board, { groups, swapCells: [from, to] }) : null;
  }
  if (moved.special && other.special) return planSpecialCombo(board, from, to, rng);

  const [specialPos, specialTile, normalTile, normalPos]: [Pos, Tile, Tile, Pos] = moved.special
    ? [to, moved, other, from]
    : [from, other, moved, to];
  if (specialTile.special === 'lightball') {
    return planClear(board, { activations: [{ ...specialPos, type: 'color', color: normalTile.color }] });
  }
  return planClear(board, {
    groups: findMatches(board),
    swapCells: [normalPos],
    activations: [{ ...specialPos, type: specialTile.special! }],
  });
};

export const planTap = (board: Board, pos: Pos) => {
  const tile = board.tiles[pos.r]![pos.c];
  if (!tile?.special) return null;
  return planClear(board, { activations: [{ ...pos, type: tile.special }] });
};

export const markClearing = (board: Board, plan: Plan) =>
  plan.cleared.forEach(({ r, c }) => {
    const tile = board.tiles[r]![c];
    if (tile) board.tiles[r]![c] = { ...tile, clearing: true };
  });

export const applyClear = (board: Board, plan: Plan) => {
  const stats: ClearStats = { colors: {}, boxes: 0, ice: 0 };
  plan.cleared.forEach(({ r, c }) => {
    const tile = board.tiles[r]![c];
    if (!tile) return;
    board.tiles[r]![c] = null;
    if (!tile.special && tile.color !== null) stats.colors[tile.color] = (stats.colors[tile.color] ?? 0) + 1;
    if (board.ice[r]![c] === 0) return;
    board.ice[r]![c]! -= 1;
    if (board.ice[r]![c] === 0) stats.ice += 1;
  });
  plan.boxHits.forEach(({ r, c }) => {
    if (board.boxes[r]![c] === 0) return;
    board.boxes[r]![c]! -= 1;
    if (board.boxes[r]![c] === 0) stats.boxes += 1;
  });
  plan.created.forEach(({ r, c, special }) => {
    board.tiles[r]![c] = createTile(null, special, { pop: true });
  });
  return stats;
};

type Source = { type: 'blocked' } | { type: 'spawn' } | { type: 'tile'; row: number };

const findSource = (board: Board, r: number, c: number): Source => {
  for (let rr = r - 1; rr >= 0; rr--) {
    if (board.holes[rr]![c]) continue;
    if (board.boxes[rr]![c]! > 0) return { type: 'blocked' };
    if (board.tiles[rr]![c]) return { type: 'tile', row: rr };
  }
  return { type: 'spawn' };
};

export const applyGravity = (board: Board, rng: Rng) => {
  const spawnCounts: number[] = Array(board.cols).fill(0);
  const spawned = new Map<number, number>();

  const fallStraight = () => {
    let moved = false;
    for (let c = 0; c < board.cols; c++) {
      for (let r = board.rows - 1; r >= 0; r--) {
        if (!isFillable(board, r, c) || board.tiles[r]![c]) continue;
        const source = findSource(board, r, c);
        if (source.type === 'blocked') continue;
        moved = true;
        if (source.type === 'tile') {
          board.tiles[r]![c] = board.tiles[source.row]![c]!;
          board.tiles[source.row]![c] = null;
          continue;
        }
        const tile = createTile(rng.int(0, board.colors - 1));
        spawned.set(tile.id, spawnCounts[c]!++);
        board.tiles[r]![c] = tile;
      }
    }
    return moved;
  };

  // Fills cells sheltered under a box by sliding a tile from an upper diagonal.
  const slideDiagonal = () => {
    for (let r = board.rows - 1; r > 0; r--) {
      for (let c = 0; c < board.cols; c++) {
        if (!isFillable(board, r, c) || board.tiles[r]![c]) continue;
        for (const dc of [-1, 1]) {
          const sc = c + dc;
          if (!inBounds(board, r - 1, sc) || !board.tiles[r - 1]![sc]) continue;
          board.tiles[r]![c] = board.tiles[r - 1]![sc]!;
          board.tiles[r - 1]![sc] = null;
          return true;
        }
      }
    }
    return false;
  };

  while (fallStraight() || slideDiagonal());

  board.tiles.forEach((row, r) =>
    row.forEach((tile, c) => {
      if (tile && spawned.has(tile.id)) board.tiles[r]![c] = { ...tile, drop: r + spawned.get(tile.id)! + 1 };
    }),
  );
};

const createsMatchAt = (board: Board, r: number, c: number) => {
  const color = colorAt(board, r, c);
  if (color === null) return false;
  const count = (dr: number, dc: number) => {
    let n = 0;
    while (colorAt(board, r + dr * (n + 1), c + dc * (n + 1)) === color) n++;
    return n;
  };
  return count(0, -1) + count(0, 1) >= 2 || count(-1, 0) + count(1, 0) >= 2;
};

export const findPossibleMove = (board: Board): Move | null => {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const tile = board.tiles[r]![c];
      if (!tile) continue;
      if (tile.special) return { from: { r, c }, to: null };
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ] as const) {
        const to = { r: r + dr, c: c + dc };
        const other = inBounds(board, to.r, to.c) ? board.tiles[to.r]![to.c] : null;
        if (!other) continue;
        if (other.special) return { from: to, to: null };
        swapTiles(board, { r, c }, to);
        const matches = createsMatchAt(board, r, c) || createsMatchAt(board, to.r, to.c);
        swapTiles(board, { r, c }, to);
        if (matches) return { from: { r, c }, to };
      }
    }
  }
  return null;
};

export const hasPossibleMove = (board: Board) => findPossibleMove(board) !== null;

const pickSafeColor = (board: Board, r: number, c: number, rng: Rng) => {
  const forbidden = new Set<number>();
  const left = colorAt(board, r, c - 1);
  if (left !== null && left === colorAt(board, r, c - 2)) forbidden.add(left);
  const up = colorAt(board, r - 1, c);
  if (up !== null && up === colorAt(board, r - 2, c)) forbidden.add(up);
  const options = Array.from({ length: board.colors }, (_, i) => i).filter((color) => !forbidden.has(color));
  return rng.pick(options);
};

const fillWithoutMatches = (board: Board, rng: Rng, extra: Partial<Tile>) => {
  for (let attempt = 0; attempt < MAX_FILL_ATTEMPTS; attempt++) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        board.tiles[r]![c] = isFillable(board, r, c) ? createTile(pickSafeColor(board, r, c, rng), null, extra) : null;
      }
    }
    if (hasPossibleMove(board)) return;
  }
};

export const shuffleBoard = (board: Board, rng: Rng) => {
  const positions = allCells(board).filter(({ r, c }) => board.tiles[r]![c] && !board.tiles[r]![c].special);
  const tiles = positions.map(({ r, c }) => board.tiles[r]![c]!);
  for (let attempt = 0; attempt < MAX_FILL_ATTEMPTS; attempt++) {
    rng.shuffle(tiles);
    positions.forEach(({ r, c }, i) => {
      board.tiles[r]![c] = tiles[i]!;
    });
    if (findMatches(board).length === 0 && hasPossibleMove(board)) return;
  }
  positions.forEach(({ r, c }) => {
    board.tiles[r]![c] = null;
  });
  positions.forEach(({ r, c }) => {
    board.tiles[r]![c] = createTile(pickSafeColor(board, r, c, rng));
  });
};

export const createBoard = (level: Level) => {
  const rng = createRng(level.tileSeed);
  const board: Board = {
    rows: level.rows,
    cols: level.cols,
    colors: level.colors,
    holes: level.holes,
    boxes: level.boxes.map((row) => [...row]),
    ice: level.ice.map((row) => [...row]),
    tiles: createGrid(level.rows, level.cols, null),
  };
  fillWithoutMatches(board, rng, { drop: level.rows });
  return { board, rng };
};

// House plan model. Each floor has its own footprint (cell mask on a fixed grid);
// bricks sit on the exterior edges of the cells.

export type Brick = 'wall' | 'window' | 'bay' | 'door' | 'balcony' | 'balconyDoor';
export type Roof = 'flat' | 'gable' | 'saltbox' | 'hip' | 'mansard' | 'pyramid' | 'shed' | 'pyramid2' | 'hip2' | 'mansard2';
export type Dir = 0 | 1 | 2 | 3; // N E S W

export const GRID = 6;
export const MAX_FLOORS = 4;
export const DIR_DELTA: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const BRICKS: Brick[] = ['wall', 'window', 'bay', 'door', 'balcony', 'balconyDoor'];
export const ROOFS: Roof[] = ['flat', 'shed', 'gable', 'saltbox', 'hip', 'mansard', 'pyramid', 'pyramid2', 'hip2', 'mansard2'];

export const BRICK_PRICE: Record<Brick, number> = { wall: 40, window: 90, bay: 160, door: 120, balcony: 200, balconyDoor: 240 };
export const ROOF_PRICE: Record<Roof, number> = { flat: 40, gable: 70, saltbox: 75, hip: 85, mansard: 110, pyramid: 80, pyramid2: 90, hip2: 95, mansard2: 115, shed: 50 };
export const CELL_PRICE = 100;

export type Axis = 'auto' | 'x' | 'z';
export type Pitch = 'low' | 'normal' | 'steep';
export type Split = 'rows' | 'cols';
export const AXES: Axis[] = ['auto', 'x', 'z'];
export const PITCHES: Pitch[] = ['low', 'normal', 'steep'];
export const PITCH_FACTOR: Record<Pitch, number> = { low: 0.25, normal: 0.42, steep: 0.7 };

export interface RoofStyle {
  type: Roof;
  axis: Axis; // ridge direction (gable) or slope direction perpendicular to it (shed)
  pitch: Pitch;
  high: Dir; // shed: the face where the roof is highest; saltbox: the face the ridge is nearest to
}

export interface Plan {
  floors: boolean[][][]; // [floor][row][col]
  roofSplit: Split;
  roofStyles: Record<string, RoofStyle>; // by roof section key, see roofRects
  wallColor: string;
  roofColor: string;
  bricks: Record<string, Brick>;
  dormers: Record<string, true>; // keyed like bricks, on a top-floor edge under a mansard roof
  chimneys: Record<string, true>; // keyed `col:row`, on a roof column
}

export interface Edge {
  floor: number;
  c: number;
  r: number;
  dir: Dir;
}

const key = (f: number, c: number, r: number, dir: number) => `${f}:${c}:${r}:${dir}`;

function emptyFloor(): boolean[][] {
  return Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => false));
}

export type Shape = 'rect' | 'L' | 'U' | 'T';
export const SHAPES: Shape[] = ['rect', 'L', 'U', 'T'];

const SHAPE_ROWS: Record<Shape, string[]> = {
  rect: ['......', '.####.', '.####.', '.####.', '......', '......'],
  L: ['......', '.###..', '.###..', '.#####', '.#####', '......'],
  U: ['......', '.#..#.', '.#..#.', '.####.', '.####.', '......'],
  T: ['......', '.####.', '.####.', '..##..', '..##..', '......'],
};

export function shapeMask(shape: Shape): boolean[][] {
  return SHAPE_ROWS[shape].map((row) => [...row].map((ch) => ch === '#'));
}

export function applyShape(plan: Plan, shape: Shape): void {
  const mask = shapeMask(shape);
  plan.floors[0] = mask;
  for (let f = 1; f < plan.floors.length; f++) {
    plan.floors[f] = plan.floors[f]!.map((row, r) => row.map((on, c) => on && mask[r]![c]!));
  }
  trimEmptyFloors(plan);
}

export function emptyPlan(): Plan {
  const plan: Plan = { floors: [emptyFloor()], roofSplit: 'rows', roofStyles: {}, dormers: {}, chimneys: {}, wallColor: '#e8d9b5', roofColor: '#b5533c', bricks: {} };
  applyShape(plan, 'rect');
  addFloor(plan);
  const door = exteriorEdges(plan).find((e) => e.floor === 0 && e.dir === 2);
  if (door) setBrick(plan, door, 'door');
  return plan;
}

// A new plan starts from one of the shapes, with a door on the south side; the shape is not changed afterwards.
export function newPlan(shape: Shape): Plan {
  const plan = emptyPlan();
  applyShape(plan, shape);
  const door = exteriorEdges(plan).find((e) => e.floor === 0 && e.dir === 2);
  if (door) setBrick(plan, door, 'door');
  return plan;
}

export function isOccupied(plan: Plan, f: number, c: number, r: number): boolean {
  return plan.floors[f]?.[r]?.[c] ?? false;
}

export function canToggle(plan: Plan, f: number, c: number, r: number): boolean {
  if (isOccupied(plan, f, c, r)) return !(f === 0 && cellCount(plan, 0) === 1);
  return f === 0 || isOccupied(plan, f - 1, c, r);
}

export function toggleCell(plan: Plan, f: number, c: number, r: number): void {
  if (!canToggle(plan, f, c, r)) return;
  if (isOccupied(plan, f, c, r)) {
    for (let g = f; g < plan.floors.length; g++) plan.floors[g]![r]![c] = false;
    trimEmptyFloors(plan);
    return;
  }
  plan.floors[f]![r]![c] = true;
}

function trimEmptyFloors(plan: Plan): void {
  while (plan.floors.length > 1 && cellCount(plan, plan.floors.length - 1) === 0) plan.floors.pop();
}

export function addFloor(plan: Plan): void {
  if (plan.floors.length >= MAX_FLOORS) return;
  plan.floors.push(plan.floors[plan.floors.length - 1]!.map((row) => [...row]));
}

export function removeFloor(plan: Plan): void {
  if (plan.floors.length > 1) plan.floors.pop();
}

export function cellCount(plan: Plan, f: number): number {
  return (plan.floors[f] ?? []).flat().filter(Boolean).length;
}

export function exteriorEdges(plan: Plan): Edge[] {
  const edges: Edge[] = [];
  plan.floors.forEach((floor, f) => {
    floor.forEach((row, r) =>
      row.forEach((on, c) => {
        if (!on) return;
        DIR_DELTA.forEach(([dc, dr], dir) => {
          if (!isOccupied(plan, f, c + dc!, r + dr!)) edges.push({ floor: f, c, r, dir: dir as Dir });
        });
      }),
    );
  });
  return edges;
}

export function getBrick(plan: Plan, e: Edge): Brick {
  return plan.bricks[key(e.floor, e.c, e.r, e.dir)] ?? 'wall';
}

export const DORMER_PRICE = 150;

export function dormerAllowed(plan: Plan, e: Edge): boolean {
  const rect = rectAt(plan, e.c, e.r);
  const type = rect ? roofStyle(plan, rect).type : undefined;
  return !!rect && rect.floor === e.floor && (type === 'mansard' || type === 'mansard2');
}

export function hasDormer(plan: Plan, e: Edge): boolean {
  return !!plan.dormers?.[key(e.floor, e.c, e.r, e.dir)];
}

export function toggleDormer(plan: Plan, e: Edge): void {
  if (!dormerAllowed(plan, e)) return;
  plan.dormers ??= {};
  const k = key(e.floor, e.c, e.r, e.dir);
  if (plan.dormers[k]) delete plan.dormers[k];
  else plan.dormers[k] = true;
}

export function activeDormers(plan: Plan): Edge[] {
  return exteriorEdges(plan).filter((e) => hasDormer(plan, e) && dormerAllowed(plan, e));
}

export const CHIMNEY_PRICE = 120;

export function hasChimney(plan: Plan, c: number, r: number): boolean {
  return !!plan.chimneys?.[`${c}:${r}`];
}

export function toggleChimney(plan: Plan, c: number, r: number): void {
  if (!rectAt(plan, c, r)) return;
  plan.chimneys ??= {};
  const k = `${c}:${r}`;
  if (plan.chimneys[k]) delete plan.chimneys[k];
  else plan.chimneys[k] = true;
}

export function activeChimneys(plan: Plan): [number, number][] {
  const result: [number, number][] = [];
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (hasChimney(plan, c, r) && rectAt(plan, c, r)) result.push([c, r]);
  return result;
}

export function setBrick(plan: Plan, e: Edge, brick: Brick): void {
  if (brick === 'door' && e.floor > 0) return;
  plan.bricks[key(e.floor, e.c, e.r, e.dir)] = brick;
}

function isConnected(plan: Plan, f: number): boolean {
  const cells: [number, number][] = [];
  plan.floors[f]!.forEach((row, r) => row.forEach((on, c) => on && cells.push([c, r])));
  if (cells.length === 0) return true;
  const seen = new Set<string>([`${cells[0]![0]},${cells[0]![1]}`]);
  const queue = [cells[0]!];
  while (queue.length) {
    const [c, r] = queue.pop()!;
    for (const [dc, dr] of DIR_DELTA) {
      const k = `${c + dc!},${r + dr!}`;
      if (isOccupied(plan, f, c + dc!, r + dr!) && !seen.has(k)) {
        seen.add(k);
        queue.push([c + dc!, r + dr!]);
      }
    }
  }
  return seen.size === cells.length;
}

export type IssueCode = 'door' | 'opening' | 'connected';

export interface Stats {
  cost: number;
  citizens: number;
  openings: number;
  cells: number;
  issues: IssueCode[];
}

const OPENINGS: Brick[] = ['window', 'bay', 'balcony', 'balconyDoor'];

export function stats(plan: Plan): Stats {
  const edges = exteriorEdges(plan);
  const bricks = edges.map((e) => getBrick(plan, e));
  const cells = plan.floors.reduce((sum, _, f) => sum + cellCount(plan, f), 0);
    const cost = bricks.reduce((sum, b) => sum + BRICK_PRICE[b], 0) + cells * CELL_PRICE + roofCost(plan) + activeDormers(plan).length * DORMER_PRICE + activeChimneys(plan).length * CHIMNEY_PRICE;
  const openings = bricks.filter((b) => OPENINGS.includes(b)).length;
  const issues: IssueCode[] = [];
  if (!bricks.includes('door')) issues.push('door');
  if (plan.floors.some((_, f) => !edges.some((e, i) => e.floor === f && OPENINGS.includes(bricks[i]!)))) issues.push('opening');
  if (plan.floors.some((_, f) => !isConnected(plan, f))) issues.push('connected');
  return { cost, citizens: Math.max(1, Math.round(cells / 3)), openings, cells, issues };
}

export interface Rect {
  key: string;
  floor: number;
  c0: number;
  c1: number;
  r0: number;
  r1: number;
}

export const DEFAULT_ROOF: RoofStyle = { type: 'gable', axis: 'auto', pitch: 'normal', high: 0 };

export function roofStyle(plan: Plan, rect: Rect): RoofStyle {
  return plan.roofStyles[rect.key] ?? DEFAULT_ROOF;
}

export function roofCost(plan: Plan): number {
  return roofRects(plan).reduce(
    (sum, rect) => sum + (rect.c1 - rect.c0 + 1) * (rect.r1 - rect.r0 + 1) * ROOF_PRICE[roofStyle(plan, rect).type],
    0,
  );
}

export function setAllRoofs(plan: Plan, type: Roof): void {
  for (const rect of roofRects(plan)) plan.roofStyles[rect.key] = { ...roofStyle(plan, rect), type };
}

const isRoofCell = (plan: Plan, f: number, c: number, r: number) => isOccupied(plan, f, c, r) && !isOccupied(plan, f + 1, c, r);

// Roof cells (top of each column) merged into rectangles, one roof section each. The split direction
// decides how an L or T is cut into wings.
export function roofRects(plan: Plan): Rect[] {
  const rects: Rect[] = [];
  const transposed = plan.roofSplit === 'cols';
  const cell = (f: number, a: number, b: number) => (transposed ? isRoofCell(plan, f, b, a) : isRoofCell(plan, f, a, b));
  plan.floors.forEach((_, f) => {
    let active = new Map<string, { a0: number; a1: number; b0: number; b1: number }>();
    const done: { a0: number; a1: number; b0: number; b1: number }[] = [];
    for (let b = 0; b < GRID; b++) {
      const next = new Map<string, { a0: number; a1: number; b0: number; b1: number }>();
      let a = 0;
      while (a < GRID) {
        if (!cell(f, a, b)) {
          a++;
          continue;
        }
        const start = a;
        while (a < GRID && cell(f, a, b)) a++;
        const k = `${start}-${a - 1}`;
        const existing = active.get(k);
        const run = existing ?? { a0: start, a1: a - 1, b0: b, b1: b };
        run.b1 = b;
        if (!existing) done.push(run);
        next.set(k, run);
      }
      active = next;
    }
    for (const run of done) {
      const rect = transposed
        ? { floor: f, c0: run.b0, c1: run.b1, r0: run.a0, r1: run.a1 }
        : { floor: f, c0: run.a0, c1: run.a1, r0: run.b0, r1: run.b1 };
      rects.push({ ...rect, key: `${f}:${rect.c0}:${rect.r0}` });
    }
  });
  return rects;
}

const rectsTouch = (a: Rect, b: Rect) =>
  ((a.c1 + 1 === b.c0 || b.c1 + 1 === a.c0) && a.r0 <= b.r1 && b.r0 <= a.r1) ||
  ((a.r1 + 1 === b.r0 || b.r1 + 1 === a.r0) && a.c0 <= b.c1 && b.c0 <= a.c1);

export const isContourRoof = (type: Roof) => type === 'pyramid2' || type === 'hip2' || type === 'mansard2';

// Touching mansard (or contour) wings share one roof that follows the whole footprint, stepped where their floors differ.
export function mansardCluster(plan: Plan, rect: Rect): Rect[] {
  const type = roofStyle(plan, rect).type;
  if (type !== 'mansard' && !isContourRoof(type)) return [rect];
  const pool = roofRects(plan).filter((r) => roofStyle(plan, r).type === type);
  const members = new Set([rect.key]);
  const queue = [rect];
  while (queue.length) {
    const current = queue.pop()!;
    for (const other of pool) {
      if (members.has(other.key) || !rectsTouch(current, other)) continue;
      members.add(other.key);
      queue.push(other);
    }
  }
  return pool.filter((r) => members.has(r.key));
}

export function rectAt(plan: Plan, c: number, r: number): Rect | undefined {
  return roofRects(plan).find((rect) => c >= rect.c0 && c <= rect.c1 && r >= rect.r0 && r <= rect.r1);
}


export type ParseError = 'json' | 'plan' | 'floors' | 'ground';

// Validates the data of a plan: a bare plan, or the `plan` of an exported file.
export function planFrom(candidate: unknown): Plan | { error: Exclude<ParseError, 'json'> } {
  if (!candidate || typeof candidate !== 'object') return { error: 'plan' };
  const data = candidate as Partial<Plan>;
  const { floors } = data;
  const validFloors =
    Array.isArray(floors) &&
    floors.length >= 1 &&
    floors.length <= MAX_FLOORS &&
    floors.every((f) => Array.isArray(f) && f.length === GRID && f.every((row) => Array.isArray(row) && row.length === GRID && row.every((v) => typeof v === 'boolean')));
  if (!validFloors) return { error: 'floors' };

  const plan: Plan = {
    floors: floors as boolean[][][],
    roofSplit: data.roofSplit === 'cols' ? 'cols' : 'rows',
    roofStyles: data.roofStyles && typeof data.roofStyles === 'object' ? data.roofStyles : {},
    wallColor: typeof data.wallColor === 'string' ? data.wallColor : '#e8d9b5',
    roofColor: typeof data.roofColor === 'string' ? data.roofColor : '#b5533c',
    bricks: data.bricks && typeof data.bricks === 'object' ? data.bricks : {},
    dormers: data.dormers && typeof data.dormers === 'object' ? data.dormers : {},
    chimneys: data.chimneys && typeof data.chimneys === 'object' ? data.chimneys : {},
  };
  if (cellCount(plan, 0) === 0) return { error: 'ground' };
  return plan;
}

// Validates an imported plan (bare plan or { version, name, plan } envelope).
export function parsePlan(text: string): { plan: Plan; name?: string } | { error: ParseError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'json' };
  }
  const envelope = raw as { plan?: unknown; name?: unknown };
  const plan = planFrom(envelope && typeof envelope === 'object' && 'plan' in envelope ? envelope.plan : raw);
  if ('error' in plan) return plan;
  return { plan, name: typeof envelope.name === 'string' ? envelope.name : undefined };
}

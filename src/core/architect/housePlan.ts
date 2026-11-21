// House plan model. Each floor has its own footprint (cell mask on a fixed grid);
// bricks sit on the exterior edges of the cells.

import bricksFile from '../../../assets/defs/architect/bricks.json' with { type: 'json' };
import decorsFile from '../../../assets/defs/architect/decors.json' with { type: 'json' };
import partsFile from '../../../assets/defs/architect/parts.json' with { type: 'json' };
import roofsFile from '../../../assets/defs/architect/roofs.json' with { type: 'json' };
import shapesFile from '../../../assets/defs/architect/shapes.json' with { type: 'json' };

import { citizensOfCells } from './housingCapacity';

// The bricks, decors, roofs and shapes are defined in assets/defs/architect: a window or a door of another style is a brick of its own,
// and prices and Tiers follow the brick.
export type Brick = keyof typeof bricksFile.bricks;
export type Roof = keyof typeof roofsFile.roofs;
export type Decor = keyof typeof decorsFile.decors;
export type Shape = keyof typeof shapesFile.shapes;
export type Dir = 0 | 1 | 2 | 3; // N E S W

export const GRID = 6;
export const MAX_FLOORS = 4;
export const DIR_DELTA: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export interface ShapeDefinition {
  rows: string[];
  floors: number;
  wallColor: string;
  roofColor: string;
  roof: { type: string; pitch: Pitch };
  facade: 'sparse' | 'dense';
  decors: { decor: Decor; on: 'door' | 'windows' | 'walls' }[];
  chimney: boolean;
}

export interface BrickDefinition {
  kind: 'wall' | 'window' | 'door' | 'extension';
  price: number;
  tier: number;
  file?: string;
}

export interface DecorDefinition {
  price: number;
  tier: number;
  file: string;
  placement: 'door' | 'shelter' | 'any';
  ground: boolean;
}

export interface RoofDefinition {
  price: number;
  tier: number;
  contour: boolean;
}

export const BRICK_DEFINITIONS: Record<Brick, BrickDefinition> = bricksFile.bricks as Record<Brick, BrickDefinition>;
export const DECOR_DEFINITIONS: Record<Decor, DecorDefinition> = decorsFile.decors as Record<Decor, DecorDefinition>;
export const ROOF_DEFINITIONS: Record<Roof, RoofDefinition> = roofsFile.roofs as Record<Roof, RoofDefinition>;

export const BRICKS = Object.keys(BRICK_DEFINITIONS) as Brick[];
export const WINDOW_BRICKS = BRICKS.filter((brick) => BRICK_DEFINITIONS[brick].kind === 'window');
export const DOOR_BRICKS = BRICKS.filter((brick) => BRICK_DEFINITIONS[brick].kind === 'door');
export const ROOFS = Object.keys(ROOF_DEFINITIONS) as Roof[];
export const DECORS = Object.keys(DECOR_DEFINITIONS) as Decor[];
export const SHAPES = Object.keys(shapesFile.shapes) as Shape[];

export const isWindowBrick = (brick: Brick): boolean => BRICK_DEFINITIONS[brick].kind === 'window';
export const isDoorBrick = (brick: Brick): boolean => BRICK_DEFINITIONS[brick].kind === 'door';
const isOpeningBrick = (brick: Brick): boolean => ['window', 'extension'].includes(BRICK_DEFINITIONS[brick].kind);

export const DECOR_PRICE: Record<Decor, number> = Object.fromEntries(DECORS.map((decor) => [decor, DECOR_DEFINITIONS[decor].price])) as Record<Decor, number>;
export const BRICK_PRICE: Record<Brick, number> = Object.fromEntries(BRICKS.map((brick) => [brick, BRICK_DEFINITIONS[brick].price])) as Record<Brick, number>;
export const ROOF_PRICE: Record<Roof, number> = Object.fromEntries(ROOFS.map((roof) => [roof, ROOF_DEFINITIONS[roof].price])) as Record<Roof, number>;
export const CELL_PRICE = partsFile.cellPrice;
export const CITIZEN_PRICE = partsFile.citizenPrice;

// A decor stands on an edge over its brick: an awning over a window, pilasters on a wall, a pergola in front of the facade.

export const hasPlinth = (plan: Plan): boolean => plan.plinth !== false;

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
  plinth?: boolean; // the band at the foot of the walls; plans saved before the option have it
  bricks: Record<string, Brick>;
  decors?: Record<string, Decor>; // keyed like bricks
  dormers: Record<string, true | 'round'>; // keyed like bricks, on a top-floor edge under a mansard roof
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


export function shapeMask(shape: Shape): boolean[][] {
  return shapesFile.shapes[shape].rows.map((row) => [...row].map((ch) => ch === '#'));
}

export function applyShape(plan: Plan, shape: Shape): void {
  const mask = shapeMask(shape);
  plan.floors[0] = mask;
  for (let f = 1; f < plan.floors.length; f++) {
    plan.floors[f] = plan.floors[f]!.map((row, r) => row.map((on, c) => on && mask[r]![c]!));
  }
  trimEmptyFloors(plan);
}

const SHAPE_DEFINITIONS = shapesFile.shapes as Record<Shape, ShapeDefinition>;

// A new plan is one of the starting models: its footprint, floors, colours and roof, a door in the middle of the south side, windows on the other walls, decors and a chimney.
export function newPlan(shape: Shape): Plan {
  const model = SHAPE_DEFINITIONS[shape];
  const plan: Plan = { floors: [emptyFloor()], roofSplit: 'rows', roofStyles: {}, dormers: {}, chimneys: {}, wallColor: model.wallColor, roofColor: model.roofColor, plinth: true, bricks: {} };
  applyShape(plan, shape);
  while (plan.floors.length < model.floors) addFloor(plan);
  for (const rect of roofRects(plan)) plan.roofStyles[rect.key] = { ...DEFAULT_ROOF, type: model.roof.type as Roof, pitch: model.roof.pitch };
  const southDoors = exteriorEdges(plan).filter((e) => e.floor === 0 && e.dir === 2);
  const door = southDoors[Math.floor((southDoors.length - 1) / 2)];
  if (door) setBrick(plan, door, 'door');
  exteriorEdges(plan).forEach((edge) => {
    if (getBrick(plan, edge) === 'door' || (model.facade === 'sparse' && (edge.c + edge.r + edge.dir) % 2 !== 0)) return;
    setBrick(plan, edge, 'window');
  });
  const ground = exteriorEdges(plan).filter((edge) => edge.floor === 0);
  for (const { decor, on } of model.decors) {
    const targets = ground.filter((edge) => (on === 'door' ? isDoorBrick(getBrick(plan, edge)) : on === 'windows' ? isWindowBrick(getBrick(plan, edge)) : getBrick(plan, edge) === 'wall'));
    targets.forEach((edge) => toggleDecor(plan, edge, decor));
  }
  const wing = roofRects(plan)[0];
  if (model.chimney && wing) toggleChimney(plan, wing.c0 + Math.floor((wing.c1 - wing.c0) / 2), wing.r0 + Math.floor((wing.r1 - wing.r0) / 2));
  return plan;
}

export const emptyPlan = (): Plan => newPlan('rect');

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

export const DORMER_PRICE = partsFile.dormerPrice;
export const ROUND_DORMER_PRICE = partsFile.roundDormerPrice;

export function dormerAllowed(plan: Plan, e: Edge): boolean {
  const rect = rectAt(plan, e.c, e.r);
  const type = rect ? roofStyle(plan, rect).type : undefined;
  return !!rect && rect.floor === e.floor && (type === 'mansard' || type === 'mansard2');
}

export function hasDormer(plan: Plan, e: Edge): boolean {
  return !!plan.dormers?.[key(e.floor, e.c, e.r, e.dir)];
}

export const isRoundDormer = (plan: Plan, e: Edge): boolean => plan.dormers?.[key(e.floor, e.c, e.r, e.dir)] === 'round';

// The same tool twice takes the dormer away, the other one changes its shape.
export function toggleDormer(plan: Plan, e: Edge, round = false): void {
  if (!dormerAllowed(plan, e)) return;
  plan.dormers ??= {};
  const k = key(e.floor, e.c, e.r, e.dir);
  const kind = round ? 'round' : true;
  if (plan.dormers[k] === kind) delete plan.dormers[k];
  else plan.dormers[k] = kind;
}

const dormerCost = (plan: Plan): number => activeDormers(plan).reduce((sum, e) => sum + (isRoundDormer(plan, e) ? ROUND_DORMER_PRICE : DORMER_PRICE), 0);

export function activeDormers(plan: Plan): Edge[] {
  return exteriorEdges(plan).filter((e) => hasDormer(plan, e) && dormerAllowed(plan, e));
}

export const CHIMNEY_PRICE = partsFile.chimneyPrice;

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

export function getDecor(plan: Plan, e: Edge): Decor | undefined {
  return plan.decors?.[key(e.floor, e.c, e.r, e.dir)];
}

export const GROUND_DECORS = DECORS.filter((decor) => DECOR_DEFINITIONS[decor].ground);

// Hoods and porticos need a door, awnings an opening to shelter; what stands in front of the facade stays on the ground.
export function decorAllowed(plan: Plan, e: Edge, decor: Decor): boolean {
  const brick = getBrick(plan, e);
  const { placement, ground } = DECOR_DEFINITIONS[decor];
  if (ground && e.floor > 0) return false;
  if (placement === 'door') return isDoorBrick(brick);
  if (placement === 'shelter') return isDoorBrick(brick) || isWindowBrick(brick) || brick === 'bay';
  return true;
}

// The same decor twice takes it away, another one replaces it.
export function toggleDecor(plan: Plan, e: Edge, decor: Decor): void {
  if (!decorAllowed(plan, e, decor)) return;
  plan.decors ??= {};
  const k = key(e.floor, e.c, e.r, e.dir);
  if (plan.decors[k] === decor) delete plan.decors[k];
  else plan.decors[k] = decor;
}

// What is drawn and paid for: a decor whose brick has since been changed no longer counts.
export function activeDecors(plan: Plan): { edge: Edge; decor: Decor }[] {
  return exteriorEdges(plan).flatMap((edge) => {
    const decor = getDecor(plan, edge);
    return decor && decorAllowed(plan, edge, decor) ? [{ edge, decor }] : [];
  });
}

export function setBrick(plan: Plan, e: Edge, brick: Brick): void {
  if (isDoorBrick(brick) && e.floor > 0) return;
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

export function stats(plan: Plan): Stats {
  const edges = exteriorEdges(plan);
  const bricks = edges.map((e) => getBrick(plan, e));
  const cells = plan.floors.reduce((sum, _, f) => sum + cellCount(plan, f), 0);
  const citizens = citizensOfCells(cells);
  const cost = citizens * CITIZEN_PRICE + bricks.reduce((sum, b) => sum + BRICK_PRICE[b], 0) + cells * CELL_PRICE + roofCost(plan) + dormerCost(plan) + activeChimneys(plan).length * CHIMNEY_PRICE + activeDecors(plan).reduce((sum, { decor }) => sum + DECOR_PRICE[decor], 0);
  const openings = bricks.filter(isOpeningBrick).length;
  const issues: IssueCode[] = [];
  if (!bricks.some(isDoorBrick)) issues.push('door');
  if (plan.floors.some((_, f) => !edges.some((e, i) => e.floor === f && isOpeningBrick(bricks[i]!)))) issues.push('opening');
  if (plan.floors.some((_, f) => !isConnected(plan, f))) issues.push('connected');
  return { cost, citizens, openings, cells, issues };
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

export const isContourRoof = (type: Roof) => ROOF_DEFINITIONS[type].contour;

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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const everyValue = (value: unknown, accepts: (entry: unknown) => boolean): boolean => value === undefined || (isRecord(value) && Object.values(value).every(accepts));

const isRoofStyle = (value: unknown): boolean =>
  isRecord(value) && ROOFS.includes(value.type as Roof) && AXES.includes(value.axis as Axis) && PITCHES.includes(value.pitch as Pitch) && [0, 1, 2, 3].includes(value.high as number);

// The values of the maps of a plan are priced and tiered by lookup, so an unknown one would make the cost NaN.
const hasValidMaps = (data: Partial<Plan>): boolean =>
  everyValue(data.bricks, (brick) => BRICKS.includes(brick as Brick)) &&
  everyValue(data.decors, (decor) => DECORS.includes(decor as Decor)) &&
  everyValue(data.dormers, (dormer) => dormer === true || dormer === 'round') &&
  everyValue(data.chimneys, (chimney) => chimney === true) &&
  everyValue(data.roofStyles, isRoofStyle);

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
  if (!hasValidMaps(data)) return { error: 'plan' };

  const plan: Plan = {
    floors: floors as boolean[][][],
    roofSplit: data.roofSplit === 'cols' ? 'cols' : 'rows',
    roofStyles: data.roofStyles && typeof data.roofStyles === 'object' ? data.roofStyles : {},
    wallColor: typeof data.wallColor === 'string' ? data.wallColor : '#e8d9b5',
    roofColor: typeof data.roofColor === 'string' ? data.roofColor : '#b5533c',
    plinth: data.plinth !== false,
    bricks: data.bricks && typeof data.bricks === 'object' ? data.bricks : {},
    dormers: data.dormers && typeof data.dormers === 'object' ? data.dormers : {},
    ...(data.decors && typeof data.decors === 'object' ? { decors: data.decors } : {}),
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

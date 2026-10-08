export const WATER_CORNER_RADIUS = 0.4;

const HALF = 0.5;
const ARC_STEPS = 6;

type Point = readonly [number, number];
export type CornerKind = 'f' | 'v' | 'c';

export interface WaterOutline {
  outline: Point[];
  fillets: Point[][];
}

const NORTH_WEST: { sides: readonly [Point, Point]; diagonal: Point } = { sides: [[0, -1], [-1, 0]], diagonal: [-1, -1] };

const turn = ([x, y]: Point): Point => [-y, x];

function turned(point: Point, turns: number): Point {
  let result = point;
  for (let step = 0; step < turns; step++) result = turn(result);
  return result;
}

export interface Neighbourhood {
  isWater: (x: number, y: number) => boolean;
  isFree: (x: number, y: number) => boolean;
}

export function cornerCode(x: number, y: number, { isWater, isFree }: Neighbourhood): string {
  let code = '';
  for (let corner = 0; corner < 4; corner++) {
    const [first, second] = NORTH_WEST.sides.map((side) => turned(side, corner)) as [Point, Point];
    const diagonal = turned(NORTH_WEST.diagonal, corner);
    const firstWater = isWater(x + first[0], y + first[1]);
    const secondWater = isWater(x + second[0], y + second[1]);
    if (!firstWater && !secondWater) code += 'v';
    else if (firstWater && secondWater && !isWater(x + diagonal[0], y + diagonal[1]) && isFree(x + diagonal[0], y + diagonal[1])) code += 'c';
    else code += 'f';
  }
  return code;
}

const NO_SHORE = '--';

export function edgeInfo(x: number, y: number, { isWater }: Neighbourhood): string {
  let info = '';
  for (let edge = 0; edge < 4; edge++) {
    const [across, before] = [turned([0, -1], edge), turned([-1, 0], edge)];
    if (isWater(x + across[0], y + across[1])) {
      info += NO_SHORE;
      continue;
    }
    const cut = (other: Point, diagonal: Point) => (!isWater(x + other[0], y + other[1]) || isWater(x + diagonal[0], y + diagonal[1]) ? '1' : '0');
    const after = turned([1, 0], edge);
    info += cut(before, turned([-1, -1], edge)) + cut(after, turned([1, -1], edge));
  }
  return info;
}

const PROFILES = [
  { amplitude: 0.07, frequency: 1, phase: 0 },
  { amplitude: 0.05, frequency: 2, phase: 1.3 },
  { amplitude: 0.08, frequency: 1.5, phase: 2.1 },
  { amplitude: 0.04, frequency: 3, phase: 0.7 },
  { amplitude: 0.06, frequency: 1, phase: 3 },
  { amplitude: 0.075, frequency: 2.5, phase: 4 },
  { amplitude: 0.05, frequency: 1.5, phase: 5.2 },
  { amplitude: 0.065, frequency: 2, phase: 0.4 },
];

export const WATER_VARIANTS = PROFILES.length;
const SHORE_STEP = 0.125;

function ripple(variant: number, t: number, length: number): number {
  const profile = PROFILES[variant % PROFILES.length]!;
  return profile.amplitude * Math.min(1, length) * Math.sin(Math.PI * t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * profile.frequency * t + profile.phase));
}

function shoreline(info: string, edge: number, variant: number, radius: number): Point[] {
  const [start, end] = [info[edge * 2], info[edge * 2 + 1]];
  if (start === undefined || end === undefined || start === '-') return [];
  const from = -HALF + (start === '1' ? radius : 0);
  const to = HALF - (end === '1' ? radius : 0);
  const length = to - from;
  if (length <= 0) return [];
  const steps = Math.max(2, Math.ceil(length / SHORE_STEP));
  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = step / steps;
    return [from + length * t, -HALF + ripple(variant + 3 * edge, t, length)];
  });
}

function arc(center: Point, radius: number, from: number, to: number, wave?: { variant: number; direction: 1 | -1 }): Point[] {
  const length = radius * Math.abs(to - from);
  return Array.from({ length: ARC_STEPS + 1 }, (_, step) => {
    const t = step / ARC_STEPS;
    const angle = from + (to - from) * t;
    const reach = wave ? radius + wave.direction * ripple(wave.variant, t, length) : radius;
    return [center[0] + reach * Math.cos(angle), center[1] + reach * Math.sin(angle)];
  });
}

const NO_EDGES = NO_SHORE.repeat(4);

const same = (a: Point, b: Point) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

export function waterOutline(code: string, edges = NO_EDGES, variant = 0, radius = WATER_CORNER_RADIUS): WaterOutline {
  const points: Point[] = [];
  const fillets: Point[][] = [];
  [...code].forEach((kind, corner) => {
    const northWest = (list: Point[]) => list.map((point) => turned(point, corner));
    if (kind === 'v') points.push(...northWest(arc([-HALF + radius, -HALF + radius], radius, Math.PI, (3 * Math.PI) / 2, { variant: variant + 3 * corner + 1, direction: -1 })));
    else points.push(...northWest([[-HALF, -HALF]]));
    if (kind === 'c') fillets.push(northWest([[-HALF, -HALF], ...arc([-HALF - radius, -HALF - radius], radius, Math.PI / 2, 0, { variant: variant + 3 * corner + 2, direction: 1 })]));
    points.push(...shoreline(edges, corner, variant, radius).map((point) => turned(point, corner)));
  });
  const outline = points.filter((point, index) => !same(point, points[(index + points.length - 1) % points.length]!));
  return { outline, fillets };
}

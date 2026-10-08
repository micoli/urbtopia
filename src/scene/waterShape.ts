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

function arc(center: Point, radius: number, from: number, to: number): Point[] {
  return Array.from({ length: ARC_STEPS + 1 }, (_, step) => {
    const angle = from + ((to - from) * step) / ARC_STEPS;
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
  });
}

export function waterOutline(code: string, radius = WATER_CORNER_RADIUS): WaterOutline {
  const outline: Point[] = [];
  const fillets: Point[][] = [];
  [...code].forEach((kind, corner) => {
    const northWest = (points: Point[]) => points.map((point) => turned(point, corner));
    if (kind === 'v') outline.push(...northWest(arc([-HALF + radius, -HALF + radius], radius, Math.PI, (3 * Math.PI) / 2)));
    else outline.push(...northWest([[-HALF, -HALF]]));
    if (kind === 'c') fillets.push(northWest([[-HALF, -HALF], ...arc([-HALF - radius, -HALF - radius], radius, Math.PI / 2, 0)]));
  });
  return { outline, fillets };
}

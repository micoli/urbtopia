import { FIXTURES } from './fixtures';
import { tilesOf } from './layout';
import type { VenueFixture } from '../engine/state';

export type PartitionShape = 'straight' | 'elbow' | 'tee' | 'cross';

// `turns` is the number of quarter turns, as the scene rotates a piece drawn with its arms toward east and south.
export interface PartitionPiece {
  shape: PartitionShape;
  turns: number;
}

type Side = 'east' | 'south' | 'west' | 'north';

const SIDES: readonly { side: Side; x: number; y: number }[] = [
  { side: 'east', x: 1, y: 0 },
  { side: 'south', x: 0, y: 1 },
  { side: 'west', x: -1, y: 0 },
  { side: 'north', x: 0, y: -1 },
];

const ELBOW_TURNS: Record<string, number> = { 'east,south': 0, 'east,north': 1, 'north,west': 2, 'south,west': 3 };
const TEE_TURNS: Record<Side, number> = { north: 0, west: 1, south: 2, east: 3 };

const isPartition = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].partition === true;

// A wall with no `joins` (a window wall) stays a straight piece along its own rotation: it can only be joined along that line.
const reaches = (fixture: VenueFixture, side: Side): boolean => {
  if (FIXTURES[fixture.type].joins) return true;
  const alongX = fixture.rotation % 2 === 0;
  return alongX ? side === 'east' || side === 'west' : side === 'north' || side === 'south';
};

const OPPOSITE: Record<Side, Side> = { east: 'west', west: 'east', south: 'north', north: 'south' };

// The piece a wall takes from the walls around it: a lone wall keeps its rotation, joined walls make a straight run, an elbow, a T or a cross.
export function partitionPieceOf(fixture: VenueFixture, fixtures: readonly VenueFixture[]): PartitionPiece {
  const at = new Map<string, VenueFixture>();
  for (const other of fixtures) if (isPartition(other)) for (const tile of tilesOf(other)) at.set(`${tile.x},${tile.y}`, other);
  const arms = SIDES.filter(({ side, x, y }) => {
    const neighbour = at.get(`${fixture.x + x},${fixture.y + y}`);
    return neighbour !== undefined && reaches(neighbour, OPPOSITE[side]);
  }).map(({ side }) => side);
  const alongX = arms.includes('east') || arms.includes('west');
  const alongY = arms.includes('north') || arms.includes('south');
  if (arms.length === 0) return { shape: 'straight', turns: fixture.rotation % 2 };
  if (arms.length === 4) return { shape: 'cross', turns: 0 };
  if (arms.length === 3) return { shape: 'tee', turns: TEE_TURNS[SIDES.map(({ side }) => side).find(side => !arms.includes(side))!] };
  if (alongX && alongY) return { shape: 'elbow', turns: ELBOW_TURNS[SIDES.map(({ side }) => side).filter(side => arms.includes(side)).sort().join(',')]! };
  return { shape: 'straight', turns: alongX ? 0 : 1 };
}

import { CROWD_WINDOW_MS, DIRECTION_VECTORS, footprintOf, frontDirection, hashSeed, nextRandom, type Building } from '../core';
import type { GatheringData } from '../core/engine/state';

export const CROWD = {
  maxFigures: 420,
  maxFiguresTouch: 160,
  figuresPerGathering: 110,
  peoplePerFigure: 2,
  touristsPerVisitor: 3,
  maxVisitors: 10,
  margin: 0.2,
  spread: 1.8,
  walkIn: 4,
};

export interface CrowdSlot {
  x: number;
  z: number;
  // Where the figure comes from and goes back to.
  fromX: number;
  fromZ: number;
  yaw: number;
  phase: number;
  color: number;
  // A figure on Stands: sits at this height and stays put.
  seatHeight?: number;
}

// How much of the crowd is on site, from 0 to 1: it builds up in the hour before and thins out in the hour after.
export function crowdPresence(gathering: Pick<GatheringData, 'startsAt' | 'endsAt'>, now: number): number {
  if (now < gathering.startsAt - CROWD_WINDOW_MS || now >= gathering.endsAt + CROWD_WINDOW_MS) return 0;
  if (now < gathering.startsAt) return (now - (gathering.startsAt - CROWD_WINDOW_MS)) / CROWD_WINDOW_MS;
  if (now < gathering.endsAt) return 1;
  return 1 - (now - gathering.endsAt) / CROWD_WINDOW_MS;
}

export const gatheringFigures = (crowd: number): number => Math.min(CROWD.figuresPerGathering, Math.ceil(crowd / CROWD.peoplePerFigure));

export const visitorFigures = (touristsPerDay: number): number => (touristsPerDay <= 0 ? 0 : Math.min(CROWD.maxVisitors, Math.max(1, Math.round(touristsPerDay / CROWD.touristsPerVisitor))));

const SLOT_ATTEMPTS = 6;

// Places around the footprint, nearest first in the order drawn, off the tiles of other buildings. The same building always gets the same ones.
export function crowdSlots(building: Pick<Building, 'id' | 'type' | 'x' | 'y' | 'rotation' | 'tier'>, blocked: ReadonlySet<string>, count: number, colors: number): CrowdSlot[] {
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  const centerX = building.x + width / 2;
  const centerZ = building.y + depth / 2;
  let rng = hashSeed(`crowd:${building.id}`);
  const random = () => {
    const draw = nextRandom(rng);
    rng = draw.rngState;
    return draw.value;
  };
  const halfW = width / 2;
  const halfD = depth / 2;
  const slots: CrowdSlot[] = [];
  for (let index = 0; index < count; index++) {
    let x = centerX;
    let z = centerZ;
    let outwardX = 1;
    let outwardZ = 0;
    for (let attempt = 0; attempt < SLOT_ATTEMPTS; attempt++) {
      const offset = CROWD.margin + (index / Math.max(1, count)) * CROWD.spread * random();
      const along = random() * 2 - 1;
      const side = Math.floor(random() * 4);
      outwardX = side === 0 ? 1 : side === 1 ? -1 : 0;
      outwardZ = side === 2 ? 1 : side === 3 ? -1 : 0;
      x = centerX + (outwardX !== 0 ? outwardX * (halfW + offset) : along * halfW);
      z = centerZ + (outwardZ !== 0 ? outwardZ * (halfD + offset) : along * halfD);
      if (!blocked.has(`${Math.floor(x)},${Math.floor(z)}`)) break;
    }
    const walk = 3 + random() * 3;
    slots.push({ x, z, fromX: x + outwardX * walk, fromZ: z + outwardZ * walk, yaw: Math.atan2(centerX - x, centerZ - z), phase: random() * Math.PI * 2, color: Math.floor(random() * colors) });
  }
  return slots;
}

// How high the back row of Stands rises above the water side, in tiles, as modelled.
const STANDS_RISE = 0.5;
const STANDS_INSET = 0.14;

// Places on the rows of Stands, higher towards the back, facing the water. The same Stands always get the same ones.
export function standsSeats(stands: readonly Pick<Building, 'id' | 'type' | 'x' | 'y' | 'rotation' | 'tier'>[], count: number, colors: number): CrowdSlot[] {
  let rng = hashSeed(`seats:${stands.map(({ id }) => id).join(',')}`);
  const random = () => {
    const draw = nextRandom(rng);
    rng = draw.rngState;
    return draw.value;
  };
  return Array.from({ length: stands.length === 0 ? 0 : count }, (_, index) => {
    const block = stands[index % stands.length]!;
    const { width, depth } = footprintOf(block.type, block.rotation, block.tier);
    const front = DIRECTION_VECTORS[frontDirection(block.rotation)];
    const x = block.x + STANDS_INSET + random() * (width - 2 * STANDS_INSET);
    const z = block.y + STANDS_INSET + random() * (depth - 2 * STANDS_INSET);
    const frontEdge = front.x !== 0 ? (front.x > 0 ? block.x + width : block.x) : front.y > 0 ? block.y + depth : block.y;
    const fromFront = front.x !== 0 ? Math.abs(frontEdge - x) / width : Math.abs(frontEdge - z) / depth;
    const walk = 3 + random() * 3;
    return { x, z, fromX: x - front.x * walk, fromZ: z - front.y * walk, yaw: Math.atan2(front.x, front.y), phase: random() * Math.PI * 2, color: Math.floor(random() * colors), seatHeight: 0.04 + fromFront * STANDS_RISE };
  });
}

import { NATURE_ENTRIES } from '../buildings/buildingDefinitions';
import { GAME_CONFIG } from '../engine/config';
import { hashSeed, nextRandom } from '../engine/random';
import type { ParcelCoord } from '../engine/state';

export interface SceneryPiece {
  model: string;
  x: number;
  z: number;
  yaw: number;
  scale: number;
}

export const WILD_RIM_TILES = 40;

const CELL = 4;
const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;

const modelsOf = (role: string): string[] => NATURE_ENTRIES.filter(entry => entry.scenery === role).map(entry => entry.model);

const BROADLEAF = modelsOf('broadleaf');
const CONIFER = modelsOf('conifer');
const BUSH = modelsOf('bush')[0]!;
const ROCK = modelsOf('rock')[0]!;
const HILL = modelsOf('hill')[0]!;

const TREE_SIZE_FACTOR = (2 / 3) ** 2;

export const SCENERY_MODELS: readonly string[] = [...BROADLEAF, ...CONIFER, BUSH, ROCK, HILL];

function randomOf(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    const next = nextRandom(state);
    state = next.rngState;
    return next.value;
  };
}

function smoothstep(from: number, to: number, value: number): number {
  return smooth(Math.min(1, Math.max(0, (value - from) / (to - from))));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function noiseAt(seed: string, x: number, z: number): number {
  const lattice = (ix: number, iz: number) => randomOf(`${seed}:noise:${ix},${iz}`)();
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const top = lattice(ix, iz) * (1 - fx) + lattice(ix + 1, iz) * fx;
  const bottom = lattice(ix, iz + 1) * (1 - fx) + lattice(ix + 1, iz + 1) * fx;
  return top * (1 - fz) + bottom * fz;
}

export function wildNoiseAt(seed: string, x: number, z: number): number {
  return noiseAt(seed, x / 28, z / 28) * 0.7 + noiseAt(seed, x / 9, z / 9) * 0.3;
}

function depthIntoRim(x: number, z: number): number {
  const outside = Math.max(-x, x - MAP_TILES, -z, z - MAP_TILES);
  return Math.min(1, Math.max(0, outside / WILD_RIM_TILES));
}

function isOwnedAt(owned: ReadonlySet<string>, x: number, z: number): boolean {
  const size = GAME_CONFIG.parcelSizeInTiles;
  return owned.has(`${Math.floor(x / size)},${Math.floor(z / size)}`);
}

export type SceneryDetail = 'full' | 'light';

function piecesOfCell(seed: string, cellX: number, cellZ: number, detail: SceneryDetail, planted: boolean): SceneryPiece[] {
  const random = randomOf(`${seed}:cell:${cellX},${cellZ}`);
  const x0 = cellX * CELL;
  const z0 = cellZ * CELL;
  const spot = () => ({ x: x0 + random() * CELL, z: z0 + random() * CELL });
  const rim = depthIntoRim(x0 + CELL / 2, z0 + CELL / 2);
  const forest = wildNoiseAt(seed, x0, z0);
  const pieces: SceneryPiece[] = [];

  const woods = smoothstep(0.3, 0.75, forest);
  const expected = rim > 0 ? 2.2 + rim * 1.2 : 1.4 + woods * 1.5;
  const trees = Math.floor(expected) + (random() < expected - Math.floor(expected) ? 1 : 0);
  const coniferGround = wildNoiseAt(`${seed}:species`, x0 * 1.3, z0 * 1.3);
  for (let tree = 0; tree < Math.max(trees, planted ? 1 : 0); tree++) {
    const conifers = rim > 0 || coniferGround > 0.5 + (random() - 0.5) * 0.25;
    const pool = conifers ? CONIFER : BROADLEAF;
    const thinned = random() < 0.5;
    const piece = { model: pool[Math.floor(random() * pool.length)]!, ...spot(), yaw: random() * 360, scale: (0.75 + random() * 0.6) * (1 + rim * 0.5) * TREE_SIZE_FACTOR };
    if (detail === 'full' || !thinned) pieces.push(piece);
  }
  const small = random() < (rim > 0 ? 0.25 : 0.2 + woods * 0.4) ? { model: BUSH, ...spot(), yaw: random() * 360, scale: 0.7 + random() * 0.5 } : null;
  const rock = random() < (rim > 0 ? 0.08 : 0.025) ? { model: ROCK, ...spot(), yaw: random() * 360, scale: 0.6 + random() * 0.8 } : null;
  if (detail === 'full') pieces.push(...[small, rock].filter((piece): piece is SceneryPiece => piece !== null));
  if (rim > 0.3 && random() < 0.07) {
    pieces.push({ model: HILL, ...spot(), yaw: random() * 360, scale: 2.5 + random() * 2.5 * rim });
  }
  return pieces;
}

const CELLS_PER_PARCEL = GAME_CONFIG.parcelSizeInTiles / CELL;
const PLANTED_PER_PARCEL = 2;

function plantedCells(seed: string, parcelX: number, parcelZ: number): Set<string> {
  const random = randomOf(`${seed}:planted:${parcelX},${parcelZ}`);
  const cells = new Set<string>();
  while (cells.size < PLANTED_PER_PARCEL) {
    cells.add(`${parcelX * CELLS_PER_PARCEL + Math.floor(random() * CELLS_PER_PARCEL)},${parcelZ * CELLS_PER_PARCEL + Math.floor(random() * CELLS_PER_PARCEL)}`);
  }
  return cells;
}

export function wildScenery(seed: string, ownedParcels: readonly ParcelCoord[], detail: SceneryDetail = 'full'): SceneryPiece[] {
  const owned = new Set(ownedParcels.map(parcel => `${parcel.x},${parcel.y}`));
  const from = Math.floor(-WILD_RIM_TILES / CELL);
  const to = Math.ceil((MAP_TILES + WILD_RIM_TILES) / CELL);
  const pieces: SceneryPiece[] = [];
  for (let cellZ = from; cellZ < to; cellZ++) {
    for (let cellX = from; cellX < to; cellX++) {
      if (isOwnedAt(owned, cellX * CELL, cellZ * CELL)) continue;
      const parcelX = Math.floor(cellX / CELLS_PER_PARCEL);
      const parcelZ = Math.floor(cellZ / CELLS_PER_PARCEL);
      pieces.push(...piecesOfCell(seed, cellX, cellZ, detail, plantedCells(seed, parcelX, parcelZ).has(`${cellX},${cellZ}`)));
    }
  }
  return pieces;
}

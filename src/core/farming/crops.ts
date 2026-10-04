const MINUTE_MS = 60_000;

export interface CropSpec {
  growthMs: number;
  water: number;
  yield: number;
  seedShare: number;
  seedPrice: number;
  unlockCitizens: number;
  packingMs: number;
  packedValue: number;
}

type CropRow = readonly [growthMinutes: number, water: number, yieldPerTile: number, seedShare: number, seedPrice: number, unlockCitizens: number, packingMinutes: number, packedValue: number];

const CROP_TABLE = {
  grass: [3, 1, 2, 0.5, 2, 20, 1, 18],
  flower: [4, 1, 2, 0.5, 2, 20, 1, 24],
  wheat: [5, 1, 3, 0.4, 3, 20, 1, 20],
  carrot: [8, 2, 3, 0.4, 5, 60, 2, 30],
  beet: [10, 2, 3, 0.4, 6, 60, 2, 36],
  lettuce: [8, 2, 3, 0.4, 5, 60, 2, 30],
  corn: [14, 2, 4, 0.35, 9, 120, 3, 55],
  rice: [16, 4, 5, 0.35, 11, 120, 3, 65],
  tomato: [14, 3, 4, 0.35, 10, 120, 3, 60],
  pumpkin: [22, 3, 5, 0.3, 16, 250, 4, 95],
  watermelon: [26, 4, 6, 0.3, 20, 250, 4, 120],
  mushroom: [20, 2, 4, 0.3, 14, 250, 4, 85],
  bushBerries: [32, 3, 6, 0.25, 28, 450, 5, 170],
  bamboo: [30, 3, 6, 0.25, 26, 450, 5, 155],
  cactus: [36, 1, 5, 0.25, 30, 450, 5, 180],
  apple: [44, 4, 8, 0.2, 45, 800, 6, 190],
  orange: [48, 4, 8, 0.2, 50, 800, 6, 205],
  palmtree: [52, 3, 8, 0.2, 52, 800, 6, 215],
} as const satisfies Record<string, CropRow>;

export type CropId = keyof typeof CROP_TABLE;

export const CROP_IDS = Object.keys(CROP_TABLE) as CropId[];

export const CROPS = Object.fromEntries(
  CROP_IDS.map((id): [CropId, CropSpec] => {
    const [growth, water, yieldPerTile, seedShare, seedPrice, unlockCitizens, packing, packedValue] = CROP_TABLE[id];
    return [id, { growthMs: growth * MINUTE_MS, water, yield: yieldPerTile, seedShare, seedPrice, unlockCitizens, packingMs: packing * MINUTE_MS, packedValue }];
  }),
) as Record<CropId, CropSpec>;

export function isCrop(item: string): item is CropId {
  return item in CROPS;
}

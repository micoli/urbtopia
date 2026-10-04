import type { CropId, CropStage } from '../core';

export const CROP_MODEL_NAMES: Record<CropId, string> = {
  grass: 'Grass',
  flower: 'Flower',
  wheat: 'Wheat',
  carrot: 'Carrot',
  beet: 'Beet',
  lettuce: 'Lettuce',
  corn: 'Corn',
  rice: 'Rice',
  tomato: 'Tomato',
  pumpkin: 'Pumpkin',
  watermelon: 'Watermelon',
  mushroom: 'Mushroom',
  bushBerries: 'BushBerries',
  bamboo: 'Bamboo',
  cactus: 'Cactus',
  apple: 'Apple',
  orange: 'Orange',
  palmtree: 'PalmTree',
};

const PRODUCE_NAME_OVERRIDES: Partial<Record<CropId, string>> = { flower: 'Flowers' };
const WITHOUT_PRODUCE: readonly CropId[] = ['grass'];
const WITHOUT_HARVESTED: readonly CropId[] = ['bamboo', 'beet', 'carrot', 'grass', 'rice', 'wheat'];

export type GrowthStage = Exclude<CropStage, 'ready'>;

export function growthModelOf(species: CropId, stage: GrowthStage): string {
  return `crops/${CROP_MODEL_NAMES[species]}_${stage}`;
}

export function produceModelOf(species: CropId): string | null {
  if (WITHOUT_PRODUCE.includes(species)) return null;
  return `crops/${PRODUCE_NAME_OVERRIDES[species] ?? CROP_MODEL_NAMES[species]}_Crop`;
}

export function harvestedModelOf(species: CropId): string | null {
  if (WITHOUT_HARVESTED.includes(species)) return null;
  return `crops/${PRODUCE_NAME_OVERRIDES[species] ?? CROP_MODEL_NAMES[species]}_Harvested`;
}

export function cropModelsOf(species: CropId): string[] {
  const stages: GrowthStage[] = [1, 2, 3, 4];
  return [...stages.map((stage) => growthModelOf(species, stage)), produceModelOf(species), harvestedModelOf(species)].filter((model): model is string => model !== null);
}

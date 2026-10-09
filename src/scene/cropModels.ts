import type { CropId, CropStage } from '../core';
import { CROP_DEFINITIONS } from '../core/farming/crops';
import { modelFileOf } from '../core/models/modelFiles';

export type GrowthStage = Exclude<CropStage, 'ready'>;

const modelsOf = new Map(CROP_DEFINITIONS.map(({ id, models }) => [id, models]));

export function growthModelOf(species: CropId, stage: GrowthStage): string {
  return modelFileOf(modelsOf.get(species)!.growth[stage - 1]!);
}

export function produceModelOf(species: CropId): string | null {
  const produce = modelsOf.get(species)?.produce;
  return produce ? modelFileOf(produce) : null;
}

export function harvestedModelOf(species: CropId): string | null {
  const harvested = modelsOf.get(species)?.harvested;
  return harvested ? modelFileOf(harvested) : null;
}

export function cropModelsOf(species: CropId): string[] {
  const stages: GrowthStage[] = [1, 2, 3, 4];
  return [...stages.map((stage) => growthModelOf(species, stage)), produceModelOf(species), harvestedModelOf(species)].filter((model): model is string => model !== null);
}

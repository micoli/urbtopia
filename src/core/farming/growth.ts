import { CROPS } from './crops';
import type { GameState, PlantedCrop } from '../engine/state';

export const GROWTH_STAGES = 4;

export type CropStage = 1 | 2 | 3 | 4 | 'ready';

export function isCropReady(crop: PlantedCrop, now: number): boolean {
  return now - crop.plantedAt >= CROPS[crop.species].growthMs;
}

export function cropStage(crop: PlantedCrop, now: number): CropStage {
  if (isCropReady(crop, now)) return 'ready';
  const stageMs = CROPS[crop.species].growthMs / GROWTH_STAGES;
  const index = Math.floor(Math.max(0, now - crop.plantedAt) / stageMs);
  return (Math.min(GROWTH_STAGES - 1, index) + 1) as CropStage;
}

export function cropWaterDemand(state: GameState): number {
  return state.fields.reduce((total, field) => (field.crop && !isCropReady(field.crop, state.lastSeen) ? total + CROPS[field.crop.species].water : total), 0);
}

export function shiftCropTimers(state: GameState, shiftMs: number): GameState {
  if (state.fields.every((field) => !field.crop)) return state;
  return {
    ...state,
    fields: state.fields.map((field) => (field.crop && !isCropReady(field.crop, state.lastSeen) ? { ...field, crop: { ...field.crop, plantedAt: field.crop.plantedAt + shiftMs } } : field)),
  };
}

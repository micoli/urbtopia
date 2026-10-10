import { entriesOf } from '../defs/entries';
import type { CropDefinition } from './cropSchema';
import type { CropId } from './cropTypes.generated';

export type { CropId };

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

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<CropDefinition>('../../../assets/defs/crops/*.json', { eager: true, import: 'default' });

export const CROP_DEFINITIONS = entriesOf<CropDefinition, CropId>(files);

export const CROP_IDS: CropId[] = CROP_DEFINITIONS.map(({ id }) => id);

export const CROPS = Object.fromEntries(
  CROP_DEFINITIONS.map(({ id, growthMinutes, water, yield: yieldPerTile, seedShare, seedPrice, unlockCitizens, packingMinutes, packedValue }): [CropId, CropSpec] => [
    id,
    { growthMs: growthMinutes * MINUTE_MS, water, yield: yieldPerTile, seedShare, seedPrice, unlockCitizens, packingMs: packingMinutes * MINUTE_MS, packedValue },
  ]),
) as Record<CropId, CropSpec>;

export function isCrop(item: string): item is CropId {
  return item in CROPS;
}

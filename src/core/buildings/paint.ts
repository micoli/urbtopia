import type { ColorVariant } from '../engine/state';
import { BUILDING_ENTRIES, tiersOf } from './buildingDefinitions';
import type { BuildingId } from './buildingTypes.generated';
import { MODEL_ENTRIES } from '../models/modelFiles';

// How a Building is repainted: its model ships a palette texture per color tone.
export type PaintKit = 'palette';

const ALL_COLORS: readonly ColorVariant[] = ['default', 'a', 'b', 'c'];

const PALETTES: Record<PaintKit, readonly ColorVariant[]> = { palette: ALL_COLORS };

// The models that ship a palette texture per color tone: one model, repainted by swapping its palette.
const TONED_MODELS: ReadonlySet<string> = new Set(Object.entries(MODEL_ENTRIES).filter(([, entry]) => Object.keys(entry.tones ?? {}).length).flatMap(([id, entry]) => [id, entry.file]));

// Takes a Model id or the file the scene keys it by.
export function paintKitOf(model: string): PaintKit | undefined {
  return TONED_MODELS.has(model) ? 'palette' : undefined;
}

const LEGACY_COLOR_KINDS: readonly string[] = ['home', 'shop', 'production', 'storage', 'utility', 'venue', 'sport'];
const REPAINTABLE_KINDS: readonly string[] = [...LEGACY_COLOR_KINDS, 'transitStop', 'office'];

// Homes, shops, Venues, production, storage, utility buildings, Offices and the Transit hub, as long as their model has color tones.
const REPAINTABLE_TYPES: ReadonlySet<string> = new Set(
  BUILDING_ENTRIES
    .filter(({ kind, model }) => REPAINTABLE_KINDS.includes(kind ?? '') && paintKitOf(model) !== undefined)
    .map(({ id }) => id),
);

export const isRepaintableType = (type: string): boolean => REPAINTABLE_TYPES.has(type);

// A save made while these buildings still wore a kit palette may carry a color their drawn models no longer have.
const KIND_BY_TYPE: ReadonlyMap<string, string | undefined> = new Map(BUILDING_ENTRIES.map(({ id, kind }) => [id, kind]));
export const mayCarryLegacyColor = (type: string): boolean => LEGACY_COLOR_KINDS.includes(KIND_BY_TYPE.get(type) ?? '');

export const colorVariantsOfKit = (kit: PaintKit): readonly ColorVariant[] => PALETTES[kit];

const MODEL_OF_TYPE: ReadonlyMap<string, string | undefined> = new Map(BUILDING_ENTRIES.map(({ id, model }) => [id, model]));

// The model a building wears at a Tier, or its own model when it has no Tiers (the Transit hub).
function modelAt(type: BuildingId, tier: number): string | undefined {
  const tiers = tiersOf(type);
  return tiers[tier - 1]?.model ?? tiers[0]?.model ?? MODEL_OF_TYPE.get(type);
}

export function paintKitAt(type: BuildingId, tier: number): PaintKit | undefined {
  return paintKitOf(modelAt(type, tier) ?? '');
}

export function colorVariantsOf(type: BuildingId, tier: number): readonly ColorVariant[] {
  const kit = paintKitAt(type, tier);
  return kit ? PALETTES[kit] : ['default'];
}

// Every color the building can wear at some Tier, since its model may change kit as it grows.
export function colorVariantsOfType(type: BuildingId): readonly ColorVariant[] {
  const tiers = tiersOf(type);
  const kits = (tiers.length > 0 ? tiers.map(({ model }) => model) : [MODEL_OF_TYPE.get(type)]).map(model => paintKitOf(model ?? ''));
  return ALL_COLORS.filter(color => kits.some(kit => kit && PALETTES[kit].includes(color)));
}

export interface ToneLabel {
  name: string;
  color: string;
}

// The tone of the model that a Home color picks: the default color is the model's own palette (tone a).
const TONE_OF_COLOR: Record<ColorVariant, 'a' | 'b' | 'c' | 'd'> = { default: 'a', a: 'b', b: 'c', c: 'd' };

export function toneLabelOf(type: BuildingId, tier: number, colorVariant: ColorVariant): ToneLabel | undefined {
  const model = modelAt(type, tier);
  return MODEL_ENTRIES[model ?? '']?.tones?.[TONE_OF_COLOR[colorVariant]];
}

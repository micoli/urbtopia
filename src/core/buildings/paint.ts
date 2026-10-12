import type { ColorVariant } from '../engine/state';
import { BUILDING_ENTRIES, tiersOf } from './buildingDefinitions';
import type { BuildingId } from './buildingTypes.generated';

// The Kenney kits a Building can be repainted with: each kit ships its own palette variations.
export type PaintKit = 'suburban' | 'commercial' | 'industrial' | 'mansard';

const ALL_COLORS: readonly ColorVariant[] = ['default', 'a', 'b', 'c'];

// The commercial kit ships two variations, the others three.
const PALETTES: Record<PaintKit, readonly ColorVariant[]> = {
  suburban: ALL_COLORS,
  mansard: ALL_COLORS,
  commercial: ['default', 'a', 'b'],
  industrial: ALL_COLORS,
};

// Takes a Model id or the file the scene keys it by.
export function paintKitOf(model: string): PaintKit | undefined {
  if (model.includes('-mansard-')) return 'mansard';
  if (/^suburban[-/]building/.test(model)) return 'suburban';
  if (/^commercial[-/]building/.test(model)) return 'commercial';
  if (/^industrial[-/]/.test(model)) return 'industrial';
  return undefined;
}

const REPAINTABLE_KINDS: readonly string[] = ['home', 'shop', 'production', 'storage', 'utility'];

// Homes, shops, the Hotel, production, storage and utility buildings, as long as their model comes from a kit with palette variations.
const REPAINTABLE_TYPES: ReadonlySet<string> = new Set(
  BUILDING_ENTRIES
    .filter(({ kind, id, model }) => (REPAINTABLE_KINDS.includes(kind ?? '') || id === 'hotel') && paintKitOf(model) !== undefined)
    .map(({ id }) => id),
);

export const isRepaintableType = (type: string): boolean => REPAINTABLE_TYPES.has(type);

export const colorVariantsOfKit = (kit: PaintKit): readonly ColorVariant[] => PALETTES[kit];

export function paintKitAt(type: BuildingId, tier: number): PaintKit | undefined {
  const tiers = tiersOf(type);
  return paintKitOf(tiers[tier - 1]?.model ?? tiers[0]?.model ?? '');
}

export function colorVariantsOf(type: BuildingId, tier: number): readonly ColorVariant[] {
  const kit = paintKitAt(type, tier);
  return kit ? PALETTES[kit] : ['default'];
}

// Every color the building can wear at some Tier, since its model may change kit as it grows.
export function colorVariantsOfType(type: BuildingId): readonly ColorVariant[] {
  const kits = tiersOf(type).map(({ model }) => paintKitOf(model ?? ''));
  return ALL_COLORS.filter(color => kits.some(kit => kit && PALETTES[kit].includes(color)));
}

import type { ColorVariant } from '../engine/state';
import { BUILDING_ENTRIES, tiersOf } from './buildingDefinitions';
import type { BuildingId } from './buildingTypes.generated';

// The Kenney kits a Building can be repainted with: each kit ships its own palette variations.
export type PaintKit = 'suburban' | 'commercial' | 'industrial' | 'mansard';

const ALL_COLORS: readonly ColorVariant[] = ['default', 'a', 'b', 'c'];
const COMMERCIAL_COLORS: readonly ColorVariant[] = ['default', 'a', 'b'];

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
export function isRepaintableType(type: string): boolean {
  const entry = BUILDING_ENTRIES.find(({ id }) => id === type);
  if (!entry || !(REPAINTABLE_KINDS.includes(entry.kind ?? '') || entry.id === 'hotel')) return false;
  return paintKitOf(entry.model) !== undefined;
}

export function paintKitAt(type: BuildingId, tier: number): PaintKit | undefined {
  const tiers = tiersOf(type);
  return paintKitOf(tiers[tier - 1]?.model ?? tiers[0]?.model ?? '');
}

export function colorVariantsOf(type: BuildingId, tier: number): readonly ColorVariant[] {
  const kit = paintKitAt(type, tier);
  if (!kit) return ['default'];
  return kit === 'commercial' ? COMMERCIAL_COLORS : ALL_COLORS;
}

import { CROP_IDS, ORCHARD_BUILDINGS, PACK_FORMATS, SHOP_TYPES, hasCounter, isGood, isMaterial, maxTierOf, producibleItems, recipeOf, sellableGoodsOf, type BuildingType, type GoodId, type ItemId } from '../core';

export type SaleChannel =
  | { kind: 'shop'; building: BuildingType; fromTier: number }
  | { kind: 'counter'; building: BuildingType; fromTier: number }
  | { kind: 'market' }
  | { kind: 'supermarket' };

export interface ChainItem {
  item: ItemId;
  // The other pack formats of a packed Crop, folded into one row.
  alsoAs: readonly GoodId[];
  soldAt: readonly SaleChannel[];
  steps: readonly ChainStep[];
}

export interface ChainStep {
  building: BuildingType;
  outputs: readonly ChainItem[];
}

export interface ChainRoot {
  building: BuildingType;
  items: readonly ChainItem[];
}

const PROCESSORS = ['mill', 'livestockFarm', 'textileMill', 'factory', 'bakery', 'dairy', 'knitwearFactory', 'packhouse'] as const satisfies readonly BuildingType[];

const COUNTER_BUILDINGS = PROCESSORS.filter((building) => hasCounter(building));

const isPackFormat = (item: ItemId, suffix: string): boolean => isGood(item) && item.endsWith(suffix);

const firstTierSelling = (building: BuildingType, good: GoodId): number | null => {
  for (let tier = 1; tier <= maxTierOf(building); tier++) if (sellableGoodsOf({ type: building, tier }).includes(good)) return tier;
  return null;
};

function saleChannels(item: ItemId): SaleChannel[] {
  if (!isGood(item)) return [];
  const shops = SHOP_TYPES.flatMap((building): SaleChannel[] => {
    const fromTier = firstTierSelling(building, item);
    return fromTier === null ? [] : [{ kind: 'shop', building, fromTier }];
  });
  const counters = COUNTER_BUILDINGS.flatMap((building): SaleChannel[] => (sellableGoodsOf({ type: building, tier: 1 }).includes(item) ? [{ kind: 'counter', building, fromTier: 1 }] : []));
  return [...shops, ...counters, { kind: 'market' }, { kind: 'supermarket' }];
}

function chainItem(item: ItemId, path: readonly ItemId[]): ChainItem {
  const crate = PACK_FORMATS[0]!.suffix;
  const alsoAs = isPackFormat(item, crate) ? PACK_FORMATS.slice(1).map(({ suffix }) => `${item.slice(0, -crate.length)}${suffix}` as GoodId) : [];
  return { item, alsoAs, soldAt: saleChannels(item), steps: path.includes(item) ? [] : stepsFor(item, [...path, item]) };
}

function stepsFor(item: ItemId, path: readonly ItemId[]): ChainStep[] {
  return PROCESSORS.flatMap((building): ChainStep[] => {
    const outputs = producibleItems(building).filter((output) => item in recipeOf(output));
    const shown = outputs.filter((output) => !PACK_FORMATS.slice(1).some(({ suffix }) => isPackFormat(output, suffix)));
    return shown.length === 0 ? [] : [{ building, outputs: shown.map((output) => chainItem(output, path)) }];
  });
}

function rootsOf(): ChainRoot[] {
  const roots: { building: BuildingType; items: ItemId[] }[] = [
    { building: 'workshop', items: [...producibleItems('workshop')] },
    { building: 'marina', items: ['fish'] },
    { building: 'farm', items: [...CROP_IDS] },
    ...ORCHARD_BUILDINGS.map(({ building, item }) => ({ building, items: [item] })),
  ];
  return roots.map(({ building, items }) => ({ building, items: items.map((item) => chainItem(item, [])) }));
}

export const PRODUCTION_CHAINS: readonly ChainRoot[] = rootsOf();

export function flattenChain(root: ChainRoot): ChainItem[] {
  const walk = (item: ChainItem): ChainItem[] => [item, ...item.steps.flatMap((step) => step.outputs.flatMap(walk))];
  return root.items.flatMap(walk);
}

// A Material that no building turns into a Good: it can never be sold.
export const isDeadEnd = (item: ChainItem): boolean => isMaterial(item.item) && item.steps.length === 0;

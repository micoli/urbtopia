import { CROP_IDS, ORCHARD_BUILDINGS, PACK_FORMATS, isGood, isItemUnlocked, producibleItems, recipeOf, type BuildingType, type GameState, type ItemId, type MaterialId } from '../core';

export interface ChainOutput {
  item: ItemId;
  recipe: Readonly<Partial<Record<MaterialId, number>>>;
}

export interface ProductionLine {
  building: BuildingType;
  outputs: readonly ChainOutput[];
}

const PRODUCERS = ['workshop', 'mill', 'livestockFarm', 'textileMill', 'factory', 'bakery', 'dairy', 'knitwearFactory', 'packhouse'] as const satisfies readonly BuildingType[];

const isExtraPackFormat = (item: ItemId): boolean => isGood(item) && PACK_FORMATS.slice(1).some(({ suffix }) => item.endsWith(suffix));

// Every production the player can queue today, building by building. The extra pack formats are left out: they only change the quantity.
export function unlockedProductionChains(state: GameState): ProductionLine[] {
  const processed = PRODUCERS.map((building): ProductionLine => ({
    building,
    outputs: producibleItems(building).filter((item) => isItemUnlocked(state, item) && !isExtraPackFormat(item)).map((item) => ({ item, recipe: recipeOf(item) })),
  }));
  const orchards = ORCHARD_BUILDINGS.filter(({ item }) => isItemUnlocked(state, item)).map(({ building, item }): ProductionLine => ({ building, outputs: [{ item, recipe: {} }] }));
  const crops: ProductionLine = { building: 'farm', outputs: CROP_IDS.filter((crop) => isItemUnlocked(state, crop)).map((item) => ({ item, recipe: {} })) };
  return [...processed, ...orchards, crops].filter(({ outputs }) => outputs.length > 0);
}

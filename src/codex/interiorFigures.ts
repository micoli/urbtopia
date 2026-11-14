import {
  interiorBonusOfBuilding, interiorCapsOfType, interiorDeclarationOf, interiorExampleOf, interiorFamilyOf, interiorGridSizeOfType, interiorUnlockCitizensOf, isInteriorUnlocked, packhouseExitLimitOf,
  serviceFurnitureQuality, serviceGridSizeOf, serviceQualityCapOf, serviceQualityOf,
  type Building, type BuildingType, type GameState, type InteriorExample, type InteriorPart, type InteriorRole,
} from '../core';
import type { MessageKey } from '../i18n/messages';

export const PRODUCTION_INTERIOR_TYPES: readonly BuildingType[] = ['factory', 'packhouse', 'mill', 'workshop', 'bakery', 'dairy', 'storehouse'];

// The interiors with no bonus to speed, yield, sales or room: their gain is the queue that runs by itself.
const QUEUE_ONLY_TYPES: readonly BuildingType[] = ['workshop'];

export const SERVICE_INTERIOR_TYPES: readonly BuildingType[] = ['school', 'library', 'hospital'];

export const CODEX_INTERIOR_TYPES: readonly BuildingType[] = [...PRODUCTION_INTERIOR_TYPES, ...SERVICE_INTERIOR_TYPES];

const DEFAULT_TIERS = 5;

export type BenefitFormat = 'percent' | 'count' | 'power';

export interface BenefitColumn {
  label: MessageKey;
  format: BenefitFormat;
  // One value by Tier, from Tier 1.
  values: readonly number[];
}

export interface InteriorRoleFigures {
  role: InteriorRole;
  part: InteriorPart;
  // The posts that can be hired, by Tier.
  posts: readonly number[];
}

export interface InteriorFigures {
  type: BuildingType;
  unlockCitizens: number;
  unlocked: boolean;
  room: readonly number[];
  columns: readonly BenefitColumn[];
  roles: readonly InteriorRoleFigures[];
  example: InteriorExample | undefined;
}

export interface LiveBenefit {
  label: MessageKey;
  format: BenefitFormat;
  value: number;
}

// What the interior of a building of the city brings right now.
export interface LiveInterior {
  buildingId: number;
  tier: number;
  fixtures: number;
  benefits: readonly LiveBenefit[];
}

const tiersOf = (type: BuildingType): number => {
  const declaration = interiorDeclarationOf(type);
  return declaration?.service?.gridSizes.length ?? declaration?.layout?.gridSizes.length ?? DEFAULT_TIERS;
};

const byTier = (type: BuildingType, value: (tier: number) => number): number[] => Array.from({ length: tiersOf(type) }, (_, index) => value(index + 1));

const productionColumns = (type: BuildingType): BenefitColumn[] => {
  const caps = (tier: number) => interiorCapsOfType(type, tier);
  const columns: BenefitColumn[] = [];
  if (QUEUE_ONLY_TYPES.includes(type)) return columns;
  if (type !== 'storehouse') columns.push({ label: 'factory.interior.speed', format: 'percent', values: byTier(type, tier => caps(tier).speed) }, { label: 'factory.interior.yield', format: 'percent', values: byTier(type, tier => caps(tier).yield) });
  if (caps(1).sales !== undefined) columns.push({ label: 'codex.interiors.sales', format: 'percent', values: byTier(type, tier => caps(tier).sales ?? 0) });
  if (caps(1).capacity !== undefined) columns.push({ label: 'codex.interiors.capacity', format: 'percent', values: byTier(type, tier => caps(tier).capacity ?? 0) });
  if (type === 'packhouse') columns.push({ label: 'codex.interiors.exits', format: 'count', values: byTier(type, packhouseExitLimitOf) });
  return columns;
};

type TableFigures = Omit<InteriorFigures, 'unlocked'>;

// The tables come from the rules alone: worked out once for each interior.
const tables = new Map<BuildingType, TableFigures>();

function tablesOf(type: BuildingType): TableFigures {
  const known = tables.get(type);
  if (known) return known;
  const service = interiorFamilyOf(type) === 'service';
  const figures: TableFigures = {
    type,
    unlockCitizens: interiorUnlockCitizensOf(type),
    room: byTier(type, tier => (service ? serviceGridSizeOf(type, tier) : interiorGridSizeOfType(type, tier))),
    columns: service ? [{ label: 'codex.interiors.quality', format: 'percent', values: byTier(type, tier => serviceQualityCapOf(type, tier)) }] : productionColumns(type),
    roles: Object.entries(interiorDeclarationOf(type)?.roles ?? {}).map(([role, { part, posts }]) => ({ role: role as InteriorRole, part, posts })),
    example: interiorExampleOf(type),
  };
  tables.set(type, figures);
  return figures;
}

export const interiorFigures = (state: GameState, type: BuildingType): InteriorFigures => ({ ...tablesOf(type), unlocked: isInteriorUnlocked(state, type) });

const PRODUCTION_BENEFITS: readonly { label: MessageKey; format: BenefitFormat; read: (bonus: ReturnType<typeof interiorBonusOfBuilding>) => number | undefined }[] = [
  { label: 'factory.interior.speed', format: 'percent', read: bonus => bonus.speed },
  { label: 'factory.interior.yield', format: 'percent', read: bonus => bonus.yield },
  { label: 'codex.interiors.sales', format: 'percent', read: bonus => bonus.sales },
  { label: 'codex.interiors.capacity', format: 'percent', read: bonus => bonus.capacity },
  { label: 'factory.interior.power', format: 'power', read: bonus => bonus.power },
];

const liveBenefitsOf = (state: GameState, building: Building): LiveBenefit[] => {
  if (interiorFamilyOf(building.type) === 'service') {
    const parts = Object.values(interiorDeclarationOf(building.type)?.roles ?? {}).map(({ part }) => part);
    return [
      { label: 'codex.interiors.furniture', format: 'percent', value: serviceFurnitureQuality(building) },
      ...parts.map((part): LiveBenefit => ({ label: `codex.interiors.part.${part}`, format: 'percent', value: serviceQualityOf(state, building, part) })),
    ];
  }
  const bonus = interiorBonusOfBuilding(building);
  return PRODUCTION_BENEFITS.filter(({ format }) => !QUEUE_ONLY_TYPES.includes(building.type) || format === 'power').flatMap(({ label, format, read }) => {
    const value = read(bonus);
    return value === undefined ? [] : [{ label, format, value }];
  });
};

export const liveInteriorsOf = (state: GameState, type: BuildingType): LiveInterior[] =>
  state.buildings
    .filter(building => building.type === type && building.interior !== undefined)
    .map(building => ({ buildingId: building.id, tier: building.tier, fixtures: building.interior!.fixtures.length, benefits: liveBenefitsOf(state, building) }));

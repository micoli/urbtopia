import {
  CASINO_GAMES, COAL_CAPACITY, marinaCapacity, FACILITIES, HOME_TIERS, UTILITY_CAPACITY, storageTierOf, farmTier, productionTierOf,
  FIXTURES, venuePower, fixtureIdsOf, gridSizeOf, isVenueType, postsOf, staffRolesOf, takingsCapOf, type VenueType, type BuildingType,
  facilityCapacity, footprintOf, gamesOfTier, isFacilityType, maxStake, casinoRadius, casinoWellbeingBonus,
  type StorageType, type UtilityType, type ProductionType, type ShopType, type BuildingKind, isStorageType, kindOf, BUILDING_SPECS, canHaveSolarPanels, ECOLOGY, greenProfileOf, isShopType, sellableGoodsOf, shopTierOf, isProductionType, isOfficeType, officeTierOf,
} from '../core';
import { t } from '../i18n/t';
import type { MessageKey } from '../i18n/messages';
import { isHomeCodexId, solarBaseOf, type CodexId } from './catalog';

export interface LevelFact {
  label: MessageKey;
  value: string;
  change: string | null;
}

type Metric = (level: number) => number;

const signed = (delta: number, format: (value: number) => string) => `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`;

function numericFact(label: MessageKey, metric: Metric, level: number, format: (value: number) => string = String): LevelFact {
  const value = metric(level);
  const delta = level > 1 ? Math.round((value - metric(level - 1)) * 100) / 100 : 0;
  return { label, value: format(value), change: delta === 0 ? null : signed(delta, format) };
}

function textFact(label: MessageKey, textOf: (level: number) => string, level: number): LevelFact {
  const value = textOf(level);
  return { label, value, change: level > 1 && textOf(level - 1) !== value ? t('codex.fact.changed') : null };
}

const footprintText = (width: number, depth: number) => `${Math.max(width, depth)}×${Math.min(width, depth)}`;

function buildingFootprintFact(type: BuildingType, level: number): LevelFact {
  const text = (tier: number) => {
    const { width, depth } = footprintOf(type, 0, tier);
    return footprintText(width, depth);
  };
  return textFact('codex.fact.footprint', text, level);
}

const utilityOutputFact = (type: UtilityType, level: number) => numericFact('codex.fact.output', tier => UTILITY_CAPACITY[type][tier - 1] ?? 0, level);

const profileFact = (profile: MessageKey, level: number) => textFact('codex.fact.profile', () => t(profile), level);

const percent = (value: number) => `${Math.round(value * 100)}%`;
const homeTier = (level: number) => HOME_TIERS[level - 1] ?? HOME_TIERS[0]!;

function storageFacts(type: StorageType, level: number): LevelFact[] {
  const compartments = [
    ['codex.fact.materials', 'materials'],
    ['codex.fact.goods', 'goods'],
    ['codex.fact.crops', 'crops'],
  ] as const;
  return compartments
    .filter(([, compartment]) => storageTierOf(type, 1)[compartment] > 0)
    .map(([label, compartment]) => numericFact(label, tier => storageTierOf(type, tier)[compartment], level));
}

function casinoFacts(level: number): LevelFact[] {
  const gamesText = (tier: number) => CASINO_GAMES.filter(game => gamesOfTier(tier).includes(game)).map(game => t(`casino.${game}`)).join(', ');
  return [
    numericFact('codex.fact.radius', casinoRadius, level),
    numericFact('codex.fact.wellbeing', casinoWellbeingBonus, level),
    numericFact('codex.fact.maxStake', maxStake, level),
    textFact('codex.fact.games', gamesText, level),
    buildingFootprintFact('casino', level),
  ];
}

function venueFacts(type: VenueType, level: number): LevelFact[] {
  const gridText = (tier: number) => `${gridSizeOf(type, tier)}×${gridSizeOf(type, tier)}`;
  const fixturesText = (tier: number) => fixtureIdsOf(type).filter(id => FIXTURES[id].minTier <= tier).map(id => t(`venue.fixture.${id}`)).join(', ');
  const posts = (tier: number) => staffRolesOf(type).reduce((total, role) => total + postsOf(type, role, tier), 0);
  return [
    textFact('codex.fact.grid', gridText, level),
    numericFact('codex.fact.posts', posts, level),
    numericFact('codex.fact.takingsCap', tier => takingsCapOf(type, tier), level),
    numericFact('codex.fact.power', tier => venuePower({ type, tier }), level),
    textFact('codex.fact.fixtures', fixturesText, level),
  ];
}

export function levelFactsOf(id: CodexId, level: number): LevelFact[] {
  const facts = tierFactsOf(id, level);
  if (isHomeCodexId(id) || !(id in BUILDING_SPECS) || !canHaveSolarPanels(id as BuildingType)) return facts;
  return [...facts, textFact('codex.fact.solarPanels', () => t('codex.solarPanels.possible'), level)];
}

function homeFacts(id: CodexId, level: number): LevelFact[] {
  return [
    numericFact('codex.fact.citizens', tier => homeTier(tier).citizens, level),
    numericFact('codex.fact.power', tier => homeTier(tier).power, level),
    numericFact('codex.fact.water', tier => homeTier(tier).water, level),
    buildingFootprintFact(solarBaseOf(id) ?? id as BuildingType, level),
  ];
}

function productionFacts(id: ProductionType, level: number): LevelFact[] {
  return [
    numericFact('codex.fact.craftTime', tier => productionTierOf({ type: id, tier }).durationFactor, level, percent),
    numericFact('codex.fact.slots', tier => productionTierOf({ type: id, tier }).maxSlots, level),
    numericFact('codex.fact.yield', tier => productionTierOf({ type: id, tier }).yield, level),
  ];
}

function farmFacts(id: 'farm', level: number): LevelFact[] {
  return [
    numericFact('codex.fact.seedCapacity', tier => farmTier({ type: id, tier }).seedCapacity, level),
    numericFact('codex.fact.fieldCap', tier => farmTier({ type: id, tier }).fieldCap, level),
  ];
}

const UTILITY_FACTS: Partial<Record<BuildingType, (level: number) => LevelFact[]>> = {
  waterTower: level => [utilityOutputFact('waterTower', level)],
  powerPlant: level => [utilityOutputFact('powerPlant', level), profileFact('codex.profile.wind', level)],
  geothermalPlant: level => [utilityOutputFact('geothermalPlant', level), profileFact('codex.profile.constant', level)],
  hydroPlant: level => [
    utilityOutputFact('hydroPlant', level),
    profileFact('codex.profile.hydro', level),
    textFact('codex.fact.siting', () => t('codex.siting.water'), level),
    numericFact('codex.fact.flowTiles', () => ECOLOGY.hydroFullFlowTiles, level),
  ],
  coalPlant: level => [numericFact('codex.fact.output', tier => COAL_CAPACITY[tier - 1] ?? 0, level)],
};

function greenFacts(id: string, level: number): LevelFact[] {
  if (!greenProfileOf(id)) return [];
  return [
    numericFact('codex.fact.radius', tier => greenProfileOf(id, tier)!.radius, level),
    numericFact('eco.cooling', tier => greenProfileOf(id, tier)!.cooling, level),
    numericFact('eco.biodiversity', tier => greenProfileOf(id, tier)!.biodiversity, level),
    numericFact('codex.fact.wellbeing', tier => greenProfileOf(id, tier)!.wellbeing, level),
  ];
}

function shopFacts(id: ShopType, level: number): LevelFact[] {
  return [
    numericFact('codex.fact.saleSlots', tier => shopTierOf({ type: id, tier }).maxSlots, level),
    numericFact('codex.fact.saleTime', tier => shopTierOf({ type: id, tier }).saleIntervalFactor, level, percent),
    numericFact('codex.fact.goodsSold', tier => sellableGoodsOf({ type: id, tier }).length, level),
    numericFact('codex.fact.jobs', tier => shopTierOf({ type: id, tier }).jobs, level),
  ];
}

function officeFacts(id: BuildingType, level: number): LevelFact[] {
  return [numericFact('codex.fact.jobs', tier => officeTierOf({ type: id, tier }).jobs, level)];
}

function facilityFacts(id: BuildingType, level: number): LevelFact[] {
  if (!isFacilityType(id) || FACILITIES[id].capacity === null) return [];
  return [numericFact('codex.fact.capacity', tier => facilityCapacity(id, tier) ?? 0, level)];
}

// Every building kind says which facts its upgrade table shows; a kind with nothing to compare across Tiers answers none.
const FACT_RULES: Record<BuildingKind, (id: BuildingType, level: number) => LevelFact[]> = {
  home: homeFacts,
  production: (id, level) => (isProductionType(id) ? productionFacts(id, level) : []),
  farm: (id, level) => (id === 'farm' ? farmFacts(id, level) : []),
  storage: (id, level) => (isStorageType(id) ? storageFacts(id, level) : []),
  utility: (id, level) => UTILITY_FACTS[id]?.(level) ?? [],
  solar: (_id, level) => [profileFact('codex.profile.solar', level)],
  green: greenFacts,
  nature: greenFacts,
  marina: (_id, level) => [numericFact('codex.fact.boats', tier => marinaCapacity({ tier }), level)],
  shop: (id, level) => (isShopType(id) ? shopFacts(id, level) : []),
  office: (id, level) => (isOfficeType(id) ? officeFacts(id, level) : []),
  casino: (_id, level) => casinoFacts(level),
  venue: (id, level) => (isVenueType(id) ? venueFacts(id, level) : []),
  facility: facilityFacts,
  battery: () => [],
  backup: () => [],
  transitStop: () => [],
  sport: () => [],
  standard: () => [],
};

function tierFactsOf(id: CodexId, level: number): LevelFact[] {
  if (isHomeCodexId(id)) return homeFacts(id, level);
  const kind = kindOf(id);
  return kind ? FACT_RULES[kind](id as BuildingType, level) : [];
}

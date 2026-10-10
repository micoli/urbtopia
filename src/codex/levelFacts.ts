import {
  CASINO_GAMES, COAL_CAPACITY, marinaCapacity, FACILITIES, HOME_TIERS, UTILITY_CAPACITY, storageTierOf, farmTier, productionTierOf,
  FIXTURES, venuePower, fixtureIdsOf, gridSizeOf, isVenueType, postsOf, staffRolesOf, takingsCapOf, type VenueType,
  facilityCapacity, footprintOf, gamesOfTier, isFacilityType, maxStake, casinoRadius, casinoWellbeingBonus,
  type StorageType,
} from '../core';
import { t } from '../i18n/t';
import type { MessageKey } from '../i18n/messages';
import type { CodexId } from './catalog';

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

function buildingFootprintFact(type: 'home' | 'casino', level: number): LevelFact {
  const text = (tier: number) => {
    const { width, depth } = footprintOf(type, 0, tier);
    return footprintText(width, depth);
  };
  return textFact('codex.fact.footprint', text, level);
}

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
  if (id === 'home' || id === 'solarHome') return [
    numericFact('codex.fact.citizens', tier => homeTier(tier).citizens, level),
    numericFact('codex.fact.power', tier => homeTier(tier).power, level),
    numericFact('codex.fact.water', tier => homeTier(tier).water, level),
    buildingFootprintFact('home', level),
  ];
  if (id === 'workshop' || id === 'factory' || id === 'packhouse') return [
    numericFact('codex.fact.craftTime', tier => productionTierOf({ type: id, tier }).durationFactor, level, percent),
    numericFact('codex.fact.slots', tier => productionTierOf({ type: id, tier }).maxSlots, level),
    numericFact('codex.fact.yield', tier => productionTierOf({ type: id, tier }).yield, level),
  ];
  if (id === 'farm') return [
    numericFact('codex.fact.seedCapacity', tier => farmTier({ type: id, tier }).seedCapacity, level),
    numericFact('codex.fact.fieldCap', tier => farmTier({ type: id, tier }).fieldCap, level),
  ];
  if (id === 'storehouse' || id === 'silo' || id === 'vault' || id === 'grainSilo') return storageFacts(id, level);
  if (id === 'powerPlant' || id === 'waterTower') return [numericFact('codex.fact.output', tier => UTILITY_CAPACITY[id][tier - 1] ?? 0, level)];
  if (id === 'coalPlant') return [numericFact('codex.fact.output', tier => COAL_CAPACITY[tier - 1] ?? 0, level)];
  if (id === 'marina') return [numericFact('codex.fact.boats', tier => marinaCapacity({ tier }), level)];
  if (id === 'casino') return casinoFacts(level);
  if (isVenueType(id)) return venueFacts(id, level);
  if (isFacilityType(id) && FACILITIES[id].capacity !== null) {
    return [numericFact('codex.fact.capacity', tier => facilityCapacity(id, tier) ?? 0, level)];
  }
  return [];
}

import {
  COAL_CAPACITY, ECOLOGY, STAFF, WASTE_FACILITIES, isVenueType, kindOf, postsOf, staffRolesOf, wasteCapacity, wasteKindOf,
  type BuildingType,
} from '../core';
import { t } from '../i18n/t';
import type { MessageKey } from '../i18n/messages';
import type { CodexId } from './catalog';
import type { LevelFact } from './levelFacts';

type CostUnit = 'codex.cost.perUnit' | 'codex.cost.perDay' | 'codex.cost.perHour';

const round = (value: number): string => String(Math.round(value * 100) / 100);

function costFact(label: MessageKey, unit: CostUnit, metric: (level: number) => number, level: number): LevelFact {
  const text = (tier: number) => t(unit).replace('{amount}', round(metric(tier)));
  const delta = level > 1 ? Math.round((metric(level) - metric(level - 1)) * 100) / 100 : 0;
  const change = delta === 0 ? null : `${delta > 0 ? '+' : '−'}${round(Math.abs(delta))}`;
  return { label, value: text(level), change };
}

// Next to the facility a Waste unit costs the tariff, at the end of the route twice that.
function wasteRangeFact(label: MessageKey, unit: CostUnit, metric: (level: number) => number, level: number): LevelFact {
  const fact = costFact(label, unit, metric, level);
  const amount = round(metric(level));
  return { ...fact, value: t(unit).replace('{amount}', `${amount}–${round(2 * metric(level))}`) };
}

function wasteCostFacts(id: BuildingType, level: number): LevelFact[] {
  const kind = wasteKindOf(id);
  if (!kind) return [];
  const { tariff, collectionDistance } = WASTE_FACILITIES[kind];
  return [
    { label: 'facility.collectionDistance', value: String(collectionDistance), change: null },
    wasteRangeFact('codex.fact.wasteTariff', 'codex.cost.perUnit', () => tariff, level),
    wasteRangeFact('codex.fact.wasteCostDay', 'codex.cost.perDay', tier => tariff * wasteCapacity(kind, tier), level),
  ];
}

function backupCostFacts(level: number): LevelFact[] {
  return [
    costFact('codex.fact.supplyCost', 'codex.cost.perUnit', () => ECOLOGY.backupCost, level),
    costFact('codex.fact.supplyCostHour', 'codex.cost.perHour', () => ECOLOGY.backupCost * ECOLOGY.backupCapacity, level),
  ];
}

function coalCostFacts(level: number): LevelFact[] {
  return [
    costFact('codex.fact.supplyCost', 'codex.cost.perUnit', () => ECOLOGY.coalCost, level),
    costFact('codex.fact.supplyCostHour', 'codex.cost.perHour', tier => ECOLOGY.coalCost * (COAL_CAPACITY[tier - 1] ?? 0), level),
  ];
}

function venueWageFacts(id: BuildingType, level: number): LevelFact[] {
  if (!isVenueType(id)) return [];
  const wages = (tier: number) => staffRolesOf(id).reduce((total, role) => total + postsOf(id, role, tier) * STAFF.dailyWage[role], 0);
  if (wages(level) === 0) return [];
  return [costFact('codex.fact.wagesDay', 'codex.cost.perDay', wages, level)];
}

// Recurring costs a building charges while it runs, computed from the same balance data as the simulation.
export function runningCostFactsOf(id: CodexId, level: number): LevelFact[] {
  const kind = kindOf(id);
  if (kind === 'facility') return wasteCostFacts(id as BuildingType, level);
  if (kind === 'backup') return backupCostFacts(level);
  if (kind === 'venue') return venueWageFacts(id as BuildingType, level);
  if (id === 'coalPlant') return coalCostFacts(level);
  return [];
}

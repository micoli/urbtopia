import { NATURE_FAMILIES, greenProfileOf, natureModelOf } from './nature';
import { BUILDING_ENTRIES } from '../buildings/buildingDefinitions';
import { footprintOf } from '../buildings/buildingSpecs';
import { FACILITIES, isFacilityType } from '../services/facilities';
import { HOME_TIERS } from '../economy/economy';
import { casinoPower } from '../leisure/casino';
import type { Building, BuildingType, GameState } from '../engine/state';

export const ECOLOGY = {
  optimalTemperature: 26, maxTemperature: 40, temperaturePerEmission: 0.1,
  hourMs: 3_600_000, solarCost: 180, solarUnlockCitizens: 15, insulationCost: 80, sharingRadius: 6,
  batteryCapacity: 24, batteryRate: 12, batteryRadius: 8, backupCapacity: 24,
  backupCost: 0.5, busCost: 2, stopRadius: 6, lineCapacity: 120,
  coalCost: 0.05, coalEmissions: 2, coalPollutionRadius: 6, coalWellbeingPenalty: 10, coalWellbeingCap: 20,
};

export const ECOLOGY_UNLOCKS: Partial<Record<BuildingType, number>> = Object.fromEntries(
  BUILDING_ENTRIES.map(({ id, nature, unlockCitizens }) => [id, nature ? NATURE_FAMILIES[nature.family].unlock : unlockCitizens ?? 0]),
);

export function citizenCount(state: GameState): number {
  return state.buildings.reduce((sum, b) => sum + (b.type === 'home' ? HOME_TIERS[b.tier - 1]?.citizens ?? 0 : 0), 0);
}

export function centerOf(b: Building): { x: number; y: number; } {
  const f = footprintOf(b.type, b.rotation, b.tier);
  return { x: b.x + f.width / 2, y: b.y + f.depth / 2 };
}

export function distance(a: Building, b: Building): number {
  const p = centerOf(a), q = centerOf(b);
  return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
}

export function homePower(b: Building): number {
  return (HOME_TIERS[b.tier - 1]?.power ?? 0) * (b.insulated ? 0.7 : 1);
}

export function economicPower(b: Building): number {
  if (b.type === 'workshop') return b.tier;
  if (b.type === 'factory') return 2 * b.tier;
  if (b.type === 'shop') return 0.5;
  if (isFacilityType(b.type)) return FACILITIES[b.type].power;
  if (b.type === 'casino') return casinoPower(b.tier);
  if (b.type === 'arcade') return 1.5 * b.tier;
  return 0;
}

function greenSpacesTouch(a: Building, b: Building): boolean {
  const p = centerOf(a), q = centerOf(b);
  const f = footprintOf(a.type, a.rotation), g = footprintOf(b.type, b.rotation);
  const dx = Math.abs(p.x - q.x), dy = Math.abs(p.y - q.y);
  return (dx === (f.width + g.width) / 2 && dy < (f.depth + g.depth) / 2) ||
    (dy === (f.depth + g.depth) / 2 && dx < (f.width + g.width) / 2);
}

function isVegetation(type: BuildingType): boolean {
  const family = natureModelOf(type)?.[2];
  return Boolean(greenProfileOf(type)) && family !== 'habitat' && family !== 'decoration';
}

export function greenSpaceCoverage(state: GameState, space: Building): number {
  const profile = greenProfileOf(space.type);
  if (!profile) return 0;
  const habitat = natureModelOf(space.type)?.[2] === 'habitat';
  if (habitat && !state.buildings.some(b => isVegetation(b.type) && distance(space, b) <= 2)) return 0;
  return state.buildings.reduce((count, b) => {
    if (b.type !== 'home' || distance(space, b) > profile.radius) return count;
    return count + (HOME_TIERS[b.tier - 1]?.citizens ?? 0);
  }, 0);
}

export function greenBenefits(state: GameState, home: Building) {
  const spaces = state.buildings.filter(b => greenProfileOf(b.type));
  const vegetation = spaces.filter(b => isVegetation(b.type));
  const weight = { cooling: 0, biodiversity: 0, wellbeing: 0 };
  for (const b of spaces) {
    const profile = greenProfileOf(b.type)!;
    if (distance(b, home) > profile.radius) continue;
    const habitat = natureModelOf(b.type)?.[2] === 'habitat';
    if (habitat && !vegetation.some(other => distance(b, other) <= 2)) continue;
    const connected = isVegetation(b.type) && vegetation.some(other => other.id !== b.id && greenSpacesTouch(b, other));
    const bonus = connected ? 1.2 : 1;
    weight.cooling += profile.cooling * bonus;
    weight.biodiversity += profile.biodiversity * bonus;
    weight.wellbeing += profile.wellbeing * bonus;
  }
  return {
    cooling: 100 * weight.cooling / (weight.cooling + 4),
    biodiversity: 100 * weight.biodiversity / (weight.biodiversity + 6),
    wellbeing: 100 * weight.wellbeing / (weight.wellbeing + 5),
  };
}

export function cityGreenBenefits(state: GameState) {
  const total = citizenCount(state);
  const result = { cooling: 0, biodiversity: 0, wellbeing: 0, covered: 0 };
  if (!total) return result;
  for (const home of state.buildings.filter(b => b.type === 'home')) {
    const citizens = HOME_TIERS[home.tier - 1]?.citizens ?? 0, benefit = greenBenefits(state, home);
    result.cooling += benefit.cooling * citizens / total;
    result.biodiversity += benefit.biodiversity * citizens / total;
    result.wellbeing += benefit.wellbeing * citizens / total;
    if (benefit.wellbeing > 0) result.covered += citizens;
  }
  return result;
}

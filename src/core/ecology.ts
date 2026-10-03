import { footprintOf } from './buildingSpecs';
import { HOME_TIERS } from './economy';
import type { Building, BuildingType, GameState } from './state';

export const ECOLOGY = {
  optimalTemperature: 26, maxTemperature: 40, temperaturePerEmission: 0.1,
  hourMs: 3_600_000, solarCost: 180, solarUnlockCitizens: 15, insulationCost: 80, sharingRadius: 6,
  batteryCapacity: 24, batteryRate: 12, batteryRadius: 8, backupCapacity: 24,
  backupCost: 0.5, busCost: 2, stopRadius: 6, lineCapacity: 120,
  coalCost: 0.05, coalEmissions: 2, coalPollutionRadius: 6, coalWellbeingPenalty: 10, coalWellbeingCap: 20,
};

export const ECOLOGY_UNLOCKS: Partial<Record<BuildingType, number>> = {
  brtStation: 200, railStation: 600, tree: 6, park: 15, solar: 32, battery: 32, backup: 32, busStop: 32,
};

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
  return 0;
}

export function greenBenefits(state: GameState, home: Building) {
  const spaces = state.buildings.filter(b => b.type === 'tree' || b.type === 'park');
  let weight = 0;
  for (const b of spaces) {
    if (distance(b, home) > (b.type === 'tree' ? 4 : 6)) continue;
    const f = footprintOf(b.type, b.rotation), p = centerOf(b);
    const connected = spaces.some(other => {
      if (other.id === b.id) return false;
      const q = centerOf(other), g = footprintOf(other.type, other.rotation);
      const dx = Math.abs(p.x - q.x), dy = Math.abs(p.y - q.y);
      return (dx === (f.width + g.width) / 2 && dy < (f.depth + g.depth) / 2) ||
        (dy === (f.depth + g.depth) / 2 && dx < (f.width + g.width) / 2);
    });
    weight += (b.type === 'tree' ? 1 : 3) * (connected ? 1.2 : 1);
  }
  return { cooling: 100 * weight / (weight + 4), biodiversity: 100 * weight / (weight + 6), wellbeing: 100 * weight / (weight + 5) };
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

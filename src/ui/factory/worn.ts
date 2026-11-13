import { FIXTURES, WEAR, conditionOf, interiorFixturesOf, repairCost, type Building, type FixtureId } from '../../core';

export interface WornLine {
  type: FixtureId;
  count: number;
  condition: number;
  cost: number;
}

export interface Worn {
  total: number;
  // The share of what repairing every Fixture from nothing would cost that the repairs cost now, from 0 to 1.
  ratio: number;
  lines: WornLine[];
}

// What the worn Fixtures of an interior cost to repair, grouped by kind, the dearest first.
export function wornOf(building: Building): Worn {
  const lines = new Map<FixtureId, WornLine>();
  let total = 0;
  let full = 0;
  for (const fixture of interiorFixturesOf(building)) {
    full += Math.max(WEAR.minRepairCost, Math.ceil(FIXTURES[fixture.type].price * WEAR.repairRatio));
    const cost = repairCost(fixture);
    if (cost <= 0) continue;
    total += cost;
    const line = lines.get(fixture.type) ?? { type: fixture.type, count: 0, condition: 100, cost: 0 };
    lines.set(fixture.type, { ...line, count: line.count + 1, condition: Math.min(line.condition, conditionOf(fixture)), cost: line.cost + cost });
  }
  return { total, ratio: full > 0 ? total / full : 0, lines: [...lines.values()].sort((x, y) => y.cost - x.cost) };
}

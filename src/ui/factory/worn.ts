import { conditionOf, interiorFixturesOf, needsRepair, repairCost, type Building, type FixtureId } from '../../core';

export interface WornLine {
  type: FixtureId;
  count: number;
  condition: number;
  cost: number;
}

export interface Worn {
  total: number;
  lines: WornLine[];
}

// What the Fixtures of an interior that are due for a repair cost to repair, grouped by kind, the dearest first.
export function wornOf(building: Building): Worn {
  const lines = new Map<FixtureId, WornLine>();
  let total = 0;
  for (const fixture of interiorFixturesOf(building)) {
    if (!needsRepair(fixture)) continue;
    const cost = repairCost(fixture);
    total += cost;
    const line = lines.get(fixture.type) ?? { type: fixture.type, count: 0, condition: 100, cost: 0 };
    lines.set(fixture.type, { ...line, count: line.count + 1, condition: Math.min(line.condition, conditionOf(fixture)), cost: line.cost + cost });
  }
  return { total, lines: [...lines.values()].sort((x, y) => y.cost - x.cost) };
}

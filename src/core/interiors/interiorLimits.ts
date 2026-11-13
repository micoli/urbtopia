import type { Building, FixtureId } from '../engine/state';
import { stackCountOf } from '../economy/counterSlots';
import { FIXTURES } from '../venues/fixtures';
import { hasAssignments } from './interiorAssignments';
import { isProducerRole } from './interiorStaff';

export interface FixtureLimit {
  count: number;
  max: number;
}

// A Bakery has as many Ovens as it has production Slots and as many Display counters as its Counter has Slots. None for a Fixture that has no such limit.
export function fixtureLimitOf(building: Building, type: FixtureId): FixtureLimit | undefined {
  const role = FIXTURES[type].assigns;
  if (role === undefined || !hasAssignments(building)) return undefined;
  const count = (building.interior?.fixtures ?? []).filter(fixture => FIXTURES[fixture.type].assigns === role).length;
  return { count, max: isProducerRole(role) ? building.slotCount : stackCountOf(building.type, building.tier) };
}

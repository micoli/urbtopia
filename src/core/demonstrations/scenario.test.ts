import { describe, expect, it } from 'vitest';
import { advance } from '../engine/advance';
import { interiorBonusOfBuilding, interiorLinksOf } from '../factory/factoryInterior';
import { factorySimple, demoFactory } from './factorySimple';
import { compileDemonstration } from './scenario';

describe('scripted interior demonstrations', () => {
  it('replays a first functional Press using the real placement and Link rules', () => {
    const checkpoints = compileDemonstration(factorySimple);
    const empty = demoFactory(checkpoints[1]!.state);
    const unlinked = demoFactory(checkpoints[2]!.state);
    const final = demoFactory(checkpoints.at(-1)!.state);
    expect(interiorBonusOfBuilding(empty)).toEqual({ speed: 0, yield: 0, power: 0 });
    expect(interiorBonusOfBuilding(unlinked).speed).toBe(0);
    expect(final.interior!.fixtures.map(fixture => fixture.type)).toEqual(['factoryPress', 'factoryMotor', 'factoryShaft']);
    expect(interiorLinksOf(final.interior!.fixtures).linked.size).toBe(1);
    expect(interiorBonusOfBuilding(final).speed).toBeGreaterThan(0);
    expect(compileDemonstration(factorySimple)).toEqual(checkpoints);
  });

  it('keeps earlier snapshots independent from subsequent commands and elapsed simulation', () => {
    const checkpoints = compileDemonstration(factorySimple);
    const before = structuredClone(checkpoints[2]!.state);
    const later = checkpoints.at(-1)!.state;
    advance(later, later.lastSeen + 12 * 3_600_000);
    const restored = structuredClone(checkpoints[2]!.state);
    expect(restored).toEqual(before);
    restored.urbs = 0;
    demoFactory(restored).interior!.fixtures.length = 0;
    expect(checkpoints[2]!.state).toEqual(before);
  });

  it('identifies a stale scenario and step when an orientation breaks the taught outcome', () => {
    const steps = factorySimple.steps.map(step => step.id === 'press'
      ? { ...step, commands: [{ type: 'PlaceInteriorFixture' as const, buildingId: factorySimple.buildingId, fixture: 'factoryPress' as const, x: 2, y: 3, rotation: 0 as const }] }
      : step);
    expect(() => compileDemonstration({ ...factorySimple, steps })).toThrow(/factory-simple · step 5 \(shaft\).*expected linked Press/);
  });

  it('reports a rejected placement with the scenario and step instead of ignoring it', () => {
    const steps = factorySimple.steps.map(step => step.id === 'shaft'
      ? { ...step, commands: [{ type: 'PlaceInteriorFixture' as const, buildingId: factorySimple.buildingId, fixture: 'factoryShaft' as const, x: 2, y: 1 }] }
      : step);
    expect(() => compileDemonstration({ ...factorySimple, steps })).toThrow(/step 5 \(shaft\).*error.tilesOccupied/);
  });
});

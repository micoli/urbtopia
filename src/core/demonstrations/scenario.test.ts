import { describe, expect, it } from 'vitest';
import { advance } from '../engine/advance';
import { assignedFixturesOf } from '../interiors/interiorAssignments';
import { interiorBonusOfBuilding, interiorLinksOf } from '../factory/factoryInterior';
import { factoryAdvanced } from './factoryAdvanced';
import { factoryIntermediate } from './factoryIntermediate';
import { factorySimple, demoFactory } from './factorySimple';
import { bakeryAdvanced } from './bakeryAdvanced';
import { bakeryIntermediate } from './bakeryIntermediate';
import { bakerySimple } from './bakerySimple';
import { millSimple } from './millSimple';
import { millAdvanced } from './millAdvanced';
import { millIntermediate } from './millIntermediate';
import { DEMONSTRATIONS } from './catalog';
import { roomOf } from './lineInterior';
import { packhouseAdvanced } from './packhouseAdvanced';
import { packhouseIntermediate } from './packhouseIntermediate';
import { packhouseSimple } from './packhouseSimple';
import { compileDemonstration } from './scenario';
import { workshopAdvanced } from './workshopAdvanced';
import { demoWorkshop } from './workshopCity';
import { workshopIntermediate } from './workshopIntermediate';
import { workshopSimple } from './workshopSimple';

it.each(DEMONSTRATIONS.filter(scenario => ['mill'].includes(scenario.buildingType)))('$id ends without machine problems', scenario => {
  const fixtures = roomOf(compileDemonstration(scenario).at(-1)!.state).interior?.fixtures ?? [];
  expect(interiorLinksOf(fixtures).problems.size).toBe(0);
});

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

describe('Factory Intermediate and Advanced demonstrations', () => {
  it('teaches a wrong turn, then fixes it with a Gear meshed rim to rim', () => {
    const checkpoints = compileDemonstration(factoryIntermediate);
    const wrong = interiorLinksOf(demoFactory(checkpoints.find(({ step }) => step.id === 'lathe-ccw-wrong')!.state).interior!.fixtures);
    expect([...wrong.problems.values()].flat()).toContain('wrongTurn');
    const fixed = interiorLinksOf(demoFactory(checkpoints.at(-1)!.state).interior!.fixtures);
    expect(fixed.problems.size).toBe(0);
  });

  it('teaches a Flow circuit, then a Motor overload and its fix', () => {
    const checkpoints = compileDemonstration(factoryAdvanced);
    const overload = interiorLinksOf(demoFactory(checkpoints.find(({ step }) => step.id === 'presses-overload')!.state).interior!.fixtures);
    expect([...overload.problems.values()].flat()).toContain('overloaded');
    const fixed = interiorLinksOf(demoFactory(checkpoints.at(-1)!.state).interior!.fixtures);
    expect(fixed.problems.size).toBe(0);
  });
});

describe('Workshop demonstrations', () => {
  it.each([workshopSimple, workshopIntermediate, workshopAdvanced])('ends with a restocker assigned to the bin of $id', scenario => {
    const final = demoWorkshop(compileDemonstration(scenario).at(-1)!.state);
    expect(assignedFixturesOf(final.interior, 'restocker')).toHaveLength(1);
  });

  it('stores the material by itself once the queue is restocked', () => {
    const final = compileDemonstration(workshopSimple).at(-1)!.state;
    const later = advance(final, final.lastSeen + 6 * 3_600_000).state;
    expect(later.storage.materials.wood ?? 0).toBeGreaterThan(final.storage.materials.wood ?? 0);
  });
});

describe('Packhouse and Bakery demonstrations', () => {
  const lines = (scenario: Parameters<typeof compileDemonstration>[0], stepId?: string) => {
    const checkpoints = compileDemonstration(scenario);
    const checkpoint = stepId ? checkpoints.find(({ step }) => step.id === stepId)! : checkpoints.at(-1)!;
    return interiorLinksOf(roomOf(checkpoint.state).interior!.fixtures);
  };

  it.each([packhouseSimple, packhouseIntermediate, packhouseAdvanced, bakerySimple, bakeryIntermediate, bakeryAdvanced])('ends $id with every Machine linked', scenario => {
    expect(lines(scenario).problems.size).toBe(0);
  });

  it.each([['packhouse', packhouseAdvanced], ['bakery', bakeryAdvanced]] as const)('cuts the second %s Line off until the joiner takes the right side', (_, scenario) => {
    const lined = (stepId: string) => lines(scenario, stepId).lined.size;
    expect(lined('wrong-joiner')).toBe(lined('second'));
    expect(lined('right-joiner')).toBeGreaterThan(lined('wrong-joiner'));
  });

  it('feeds two Exits from one Packer through a splitting Conveyor', () => {
    expect(lines(packhouseIntermediate).lined.size).toBeGreaterThan(lines(packhouseIntermediate, 'left').lined.size);
  });
});

describe('Mill demonstrations', () => {
  it.each([millSimple, millIntermediate, millAdvanced])('ends $id with a complete millstone line', scenario => {
    const fixtures = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!.fixtures;
    expect(interiorLinksOf(fixtures).lined.has(1)).toBe(true);
  });
  it('fixes the oil tank orientation', () => {
    const checkpoints = compileDemonstration(millAdvanced);
    const isComplete = (id: string) => {
      const fixtures = roomOf(checkpoints.find(({ step }) => step.id === id)!.state).interior!.fixtures;
      return interiorLinksOf(fixtures).lined.has(1);
    };
    expect(isComplete('recipe')).toBe(false);
    expect(isComplete('fix-tank')).toBe(true);
  });

  it.each([[millSimple, 'oliveOil'], [millIntermediate, 'flour']] as const)('produces %s with an assigned miller', (scenario, material) => {
    let state = compileDemonstration(scenario).at(-1)!.state;
    const start = state.lastSeen;
    for (let minute = 1; minute <= 360; minute++) state = advance(state, start + minute * 60_000).state;
    expect(state.storage.materials[material] ?? 0).toBeGreaterThan(0);
  });
});

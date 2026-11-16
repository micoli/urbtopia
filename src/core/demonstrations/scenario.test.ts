import { describe, expect, it } from 'vitest';
import { advance } from '../engine/advance';
import { assignedFixturesOf } from '../interiors/interiorAssignments';
import { interiorBonusOfBuilding } from '../factory/interiorBonus';
import { interiorLinksOf } from '../factory/interiorLinks';
import { factoryAdvanced } from './factoryAdvanced';
import { factoryIntermediate } from './factoryIntermediate';
import { factorySimple, demoFactory } from './factorySimple';
import { bakeryAdvanced } from './bakeryAdvanced';
import { bakeryIntermediate } from './bakeryIntermediate';
import { bakerySimple } from './bakerySimple';
import { millSimple } from './millSimple';
import { millAdvanced } from './millAdvanced';
import { millIntermediate } from './millIntermediate';
import { storehouseSimple } from './storehouseSimple';
import { storehouseIntermediate } from './storehouseIntermediate';
import { storehouseAdvanced } from './storehouseAdvanced';
import { textileMillSimple } from './textileMillSimple';
import { textileMillIntermediate } from './textileMillIntermediate';
import { textileMillAdvanced } from './textileMillAdvanced';
import { recyclingPlantSimple } from './recyclingPlantSimple';
import { recyclingPlantIntermediate } from './recyclingPlantIntermediate';
import { recyclingPlantAdvanced } from './recyclingPlantAdvanced';
import { recyclingGainsOf } from '../factory/recyclingGains';
import { linePathsOf } from '../factory/interiorLine';
import { dairySimple } from './dairySimple';
import { dairyIntermediate } from './dairyIntermediate';
import { dairyAdvanced } from './dairyAdvanced';
import { lineFaultOf } from '../factory/interiorLine';
import { knitwearFactorySimple } from './knitwearFactorySimple';
import { knitwearFactoryIntermediate } from './knitwearFactoryIntermediate';
import { knitwearFactoryAdvanced } from './knitwearFactoryAdvanced';
import { livestockFarmSimple } from './livestockFarmSimple';
import { livestockFarmIntermediate } from './livestockFarmIntermediate';
import { livestockFarmAdvanced } from './livestockFarmAdvanced';
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

it.each(DEMONSTRATIONS.filter(scenario => ['mill', 'dairy', 'recyclingPlant', 'textileMill', 'knitwearFactory', 'livestockFarm', 'storehouse'].includes(scenario.buildingType)))('$id ends without machine problems', scenario => {
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

describe('Storehouse demonstrations', () => {
  it.each([storehouseSimple, storehouseIntermediate, storehouseAdvanced])('ends $id with a connected rack', scenario => {
    const fixtures = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!.fixtures;
    const rack = fixtures.find(fixture => fixture.type === 'storehouseRack')!;
    expect(interiorLinksOf(fixtures).lined.has(rack.id)).toBe(true);
  });

  it('repairs a hoist with no drive', () => {
    const checkpoints = compileDemonstration(storehouseAdvanced);
    const problems = (id: string) => interiorLinksOf(roomOf(checkpoints.find(({ step }) => step.id === id)!.state).interior!.fixtures).problems.get(4) ?? [];
    expect(problems('rack')).toContain('noDrive');
    expect(problems('fix-motor')).not.toContain('noDrive');
  });
});

describe('Textile mill demonstrations', () => {
  it.each([textileMillSimple, textileMillIntermediate, textileMillAdvanced])('ends $id with a working spinner', scenario => {
    const interior = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!;
    expect(interiorLinksOf(interior.fixtures).lined.has(1)).toBe(true);
    expect(assignedFixturesOf(interior, 'spinner')).toHaveLength(1);
  });
  it('diagnoses and repairs a motor without drive', () => {
    const checkpoints = compileDemonstration(textileMillAdvanced);
    const problems = (id: string) => interiorLinksOf(roomOf(checkpoints.find(({ step }) => step.id === id)!.state).interior!.fixtures).problems.get(1) ?? [];
    expect(problems('motor')).toContain('noDrive');
    expect(problems('fix-motor')).not.toContain('noDrive');
  });
  it('produces textile from stocked wool', () => {
    let state = compileDemonstration(textileMillSimple).at(-1)!.state;
    const start = state.lastSeen;
    for (let minute = 1; minute <= 360; minute++) state = advance(state, start + minute * 60_000).state;
    expect(state.storage.materials.textile ?? 0).toBeGreaterThan(0);
  });
});

describe('Recycling plant demonstrations', () => {
  it.each([recyclingPlantSimple, recyclingPlantIntermediate, recyclingPlantAdvanced])('ends $id with recycling capacity', scenario => {
    expect(recyclingGainsOf(roomOf(compileDemonstration(scenario).at(-1)!.state)).exits).toBeGreaterThan(0);
  });
  it('fixes the missing sorter drive', () => {
    const checkpoints = compileDemonstration(recyclingPlantAdvanced);
    const gains = (id: string) => recyclingGainsOf(roomOf(checkpoints.find(({ step }) => step.id === id)!.state)).exits;
    expect(gains('exit')).toBe(0);
    expect(gains('fix-motor')).toBe(1);
  });
});

it.each([storehouseIntermediate, dairyIntermediate, knitwearFactoryIntermediate, livestockFarmIntermediate])('reaches both branches in $id', scenario => {
  const fixtures = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!.fixtures;
  expect(linePathsOf(fixtures)).toHaveLength(2);
});

it('reaches both recycling exits after the split', () => {
  expect(recyclingGainsOf(roomOf(compileDemonstration(recyclingPlantIntermediate).at(-1)!.state)).exits).toBe(2);
});

describe('Dairy demonstrations', () => {
  it.each([dairySimple, dairyIntermediate, dairyAdvanced])('ends $id with a connected counter', scenario => {
    const fixtures = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!.fixtures;
    expect(interiorLinksOf(fixtures).lined.has(fixtures.find(fixture => fixture.type === 'dairyCounter')!.id)).toBe(true);
  });
  it('repairs missing flow and activates the cream yield bonus', () => {
    const checkpoints = compileDemonstration(dairyAdvanced);
    const fixtures = roomOf(checkpoints.find(({ step }) => step.id === 'counter')!.state).interior!.fixtures;
    expect(lineFaultOf(fixtures, fixtures.find(fixture => fixture.type === 'dairyCounter')!)?.kind).toBe('noFlow');
    expect(interiorBonusOfBuilding(roomOf(compileDemonstration(dairyIntermediate).at(-1)!.state), 'cream').yield).toBeGreaterThan(0);
  });
});

describe('Knitwear and livestock demonstrations', () => {
  it.each([knitwearFactorySimple, knitwearFactoryIntermediate, knitwearFactoryAdvanced])('ends $id with a staffed and connected knitter', scenario => {
    const interior = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!;
    expect(assignedFixturesOf(interior, 'knitter')).toHaveLength(1);
    expect(interiorLinksOf(interior.fixtures).lined.has(interior.fixtures.find(fixture => fixture.type === 'knitwearCounter')!.id)).toBe(true);
  });
  it.each([livestockFarmSimple, livestockFarmIntermediate, livestockFarmAdvanced])('ends $id with a staffed collection exit', scenario => {
    const interior = roomOf(compileDemonstration(scenario).at(-1)!.state).interior!;
    expect(assignedFixturesOf(interior, 'herder')).toHaveLength(1);
    expect(interiorLinksOf(interior.fixtures).lined.has(interior.fixtures.find(fixture => fixture.type === 'livestockCollectionExit')!.id)).toBe(true);
  });
  it.each([[knitwearFactoryAdvanced, 'finisher', 'counter'], [livestockFarmAdvanced, 'packer', 'exit']] as const)('repairs the missing drive in $id', (scenario, family, faultyStep) => {
    const checkpoints = compileDemonstration(scenario);
    const problems = (id: string) => {
      const fixtures = roomOf(checkpoints.find(({ step }) => step.id === id)!.state).interior!.fixtures;
      const machine = fixtures.find(fixture => fixture.type.toLowerCase().includes(family))!;
      return interiorLinksOf(fixtures).problems.get(machine.id) ?? [];
    };
    expect(problems(faultyStep)).toContain('noDrive');
    expect(problems('fix-motor')).not.toContain('noDrive');
  });
  it.each([[knitwearFactorySimple, 'sweater', 'goods'], [livestockFarmSimple, 'milk', 'materials']] as const)('produces the selected item in $id', (scenario, item, kind) => {
    let state = compileDemonstration(scenario).at(-1)!.state;
    const start = state.lastSeen;
    for (let minute = 1; minute <= 480; minute++) state = advance(state, start + minute * 60_000).state;
    expect((state.storage[kind] as Record<string, number>)[item] ?? 0).toBeGreaterThan(0);
  });
});

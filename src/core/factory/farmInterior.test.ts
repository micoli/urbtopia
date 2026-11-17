import { describe, expect, it } from 'vitest';
import { advance, assignedFixturesOf, createBuilding, dispatch, fieldCap, interiorBonusOfBuilding, interiorExampleOf, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { farmFieldCapOf, harvestYieldBonusOf } from '../farming/farmInterior';
import { farmTier } from '../economy/tiers';
import { CROPS } from '../farming/crops';
import { checkGameState } from '../../persistence/validate';
import { economicPower } from '../environment/ecology';
import { interiorLinksOf } from './interiorLinks';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (tier = 3): GameState => ({
  ...newGame({ seed: 'farm-interior', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [...homes, { ...createBuilding(1, 'farm', 55, 50, 0), tier }],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const farm = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const remove = (fixtureId: number): Command => ({ type: 'RemoveInteriorFixture', buildingId: 1, fixtureId });
const hire = (role: 'farmhand' | 'irrigator'): Command => ({ type: 'HireInteriorStaff', buildingId: 1, role });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: 1, fixtureId });
const unassign = (fixtureId: number): Command => ({ type: 'UnassignInteriorStaff', buildingId: 1, fixtureId });
const idOf = (state: GameState, type: FixtureId): number => farm(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const example = interiorExampleOf('farm')!.fixtures.map(({ type, x, y, rotation }) => place(type, x, y, rotation));
const fitted = apply(city(), ...example);

describe('the harvest Line of a Farm interior', () => {
  it('reaches the Harvest bin through the Washer, the Thresher and the Grader', () => {
    const { lined, linked } = interiorLinksOf(farm(fitted).interior!.fixtures);
    expect(lined.has(idOf(fitted, 'farmHarvestBin'))).toBe(true);
    expect(['farmWasher', 'farmThresher', 'farmGrader', 'farmSprinkler'].every(type => linked.has(idOf(fitted, type as FixtureId)))).toBe(true);
  });

  it('stops when the Washer has no Flow, because a Line must pass through it', () => {
    const dry = apply(fitted, remove(idOf(fitted, 'farmPumpLeft')));
    expect(interiorLinksOf(farm(dry).interior!.fixtures).lined.has(idOf(dry, 'farmHarvestBin'))).toBe(false);
  });

  it('stops when the Thresher has no Drive', () => {
    const still = apply(fitted, remove(farm(fitted).interior!.fixtures.find(fixture => fixture.type === 'farmMotor' && fixture.x === 1 && fixture.y === 2)!.id));
    expect(interiorLinksOf(farm(still).interior!.fixtures).lined.has(idOf(still, 'farmHarvestBin'))).toBe(false);
  });
});

describe('the yield of the Harvest', () => {
  it('is nothing until a farmhand stands at the Harvest bin', () => {
    expect(interiorBonusOfBuilding(farm(fitted)).yield).toBe(0);
    const hired = apply(fitted, hire('farmhand'));
    expect(interiorBonusOfBuilding(farm(hired)).yield).toBe(0);
    const assigned = apply(hired, assign(idOf(hired, 'farmHarvestBin')));
    expect(assignedFixturesOf(farm(assigned).interior, 'farmhand').map(fixture => fixture.id)).toEqual([idOf(assigned, 'farmHarvestBin')]);
    const bonus = interiorBonusOfBuilding(farm(assigned)).yield;
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(0.15);
    expect(harvestYieldBonusOf(assigned)).toBe(bonus);
  });

  it('is the best of the Farms, never their sum', () => {
    const assigned = apply(fitted, hire('farmhand'), assign(idOf(fitted, 'farmHarvestBin')));
    const twin = { ...farm(assigned), id: 2, x: 60 };
    const both = { ...assigned, buildings: [...assigned.buildings, twin] };
    expect(harvestYieldBonusOf(both)).toBe(harvestYieldBonusOf(assigned));
  });

  it('is nothing without a farmhand hired, even when the Fixture is assigned', () => {
    expect(failure(fitted, assign(idOf(fitted, 'farmHarvestBin')))).toBe('error.noFreeStaff');
  });
});

describe('the Field cap of a Farm', () => {
  const base = farmTier(farm(fitted)).fieldCap;

  it('stays what it was until an irrigator stands at a Sprinkler', () => {
    expect(farmFieldCapOf(farm(fitted))).toBe(base);
    expect(fieldCap(fitted)).toBe(base);
  });

  it('grows with a Sprinkler that an irrigator serves, within the cap of the Tier', () => {
    const watered = apply(fitted, hire('irrigator'), assign(idOf(fitted, 'farmSprinkler')));
    expect(farmFieldCapOf(farm(watered))).toBeGreaterThan(base);
    expect(farmFieldCapOf(farm(watered))).toBeLessThanOrEqual(Math.floor(base * 1.3));
    expect(fieldCap(watered)).toBe(farmFieldCapOf(farm(watered)));
    expect(farmFieldCapOf(farm(apply(watered, unassign(idOf(watered, 'farmSprinkler')))))).toBe(base);
  });

  it('does not need a complete Line', () => {
    const sprinklerOnly = apply(city(), place('farmSprinkler', 2, 3), place('farmPump', 3, 3, 1), place('farmTank', 4, 3, 1), place('farmMotor', 3, 4, 2), hire('irrigator'));
    const watered = apply(sprinklerOnly, assign(idOf(sprinklerOnly, 'farmSprinkler')));
    expect(farmFieldCapOf(farm(watered))).toBeGreaterThan(farmTier(farm(watered)).fieldCap);
  });
});

describe('the Tank of a Farm interior', () => {
  it('feeds only three Machines that take Flow, the Washer and the Sprinklers together', () => {
    const crowded = apply(city(5), place('farmTank', 4, 2, 1), place('farmPump', 3, 2, 1), place('farmMotor', 3, 3, 2), place('farmPipeCross', 2, 2), place('farmPipeTee', 1, 2, 3),
      place('farmSprinkler', 1, 1, 1), place('farmSprinkler', 1, 3, 3), place('farmSprinkler', 2, 1, 1), place('farmSprinkler', 2, 3, 3));
    const sprinklers = farm(crowded).interior!.fixtures.filter(fixture => fixture.type === 'farmSprinkler').sort((a, b) => a.id - b.id);
    const { linked } = interiorLinksOf(farm(crowded).interior!.fixtures);
    expect(sprinklers.map(fixture => linked.has(fixture.id))).toEqual([true, true, true, false]);
  });
});

describe('the Motors of a Farm interior', () => {
  it('draw electricity from the city, and an empty interior draws none', () => {
    expect(economicPower(farm(city()))).toBe(0);
    expect(economicPower(farm(fitted))).toBeGreaterThan(0);
  });
});

const HOUR = 3_600_000;
const focus = (fixtureId: number, good: string | null): Command => ({ type: 'SetInteriorFocus', buildingId: 1, fixtureId, good } as Command);
const ripeAt = (readyAt: number, species: 'wheat' | 'corn' = 'wheat') => ({ species, plantedAt: readyAt - CROPS[species].growthMs });
const fieldsOf = (state: GameState, species: string) => state.fields.filter(field => field.crop?.species === species).length;
const planted = (state: GameState, crops: ReturnType<typeof ripeAt>[]): GameState => ({ ...state, fields: crops.map((crop, index) => ({ x: 50 + index, y: 40, crop })) });
const working = (species: string | null = 'wheat'): GameState => {
  const bin = idOf(fitted, 'farmHarvestBin');
  return apply(fitted, hire('farmhand'), assign(bin), ...(species === null ? [] : [focus(bin, species)]));
};

describe('the farmhand of a Harvest bin', () => {
  const tenWheat = () => planted(working(), Array.from({ length: 10 }, () => ripeAt(0)));

  it('picks a Crop species on the bin, and only an unlocked one, without losing his assignment when it is cleared', () => {
    const bin = idOf(fitted, 'farmHarvestBin');
    expect(failure(apply(fitted, hire('farmhand'), assign(bin)), focus(bin, 'cheese'))).toBe('error.cannotProduce');
    const picked = working();
    expect(farm(picked).interior!.fixtures.find(fixture => fixture.id === bin)!.recipe).toBe('wheat');
    const cleared = apply(picked, focus(bin, null));
    expect(farm(cleared).interior!.fixtures.find(fixture => fixture.id === bin)!.assigned).toBe(true);
    expect(farm(cleared).interior!.fixtures.find(fixture => fixture.id === bin)!.recipe).toBeUndefined();
    expect(checkGameState(JSON.parse(JSON.stringify(picked)))).toBeTruthy();
  });

  it('harvests the ready Fields of his species by himself, at the rate of the Tier', () => {
    const state = tenWheat();
    const { state: later } = advance(state, HOUR);
    expect(fieldsOf(later, 'wheat')).toBe(10 - 5);
    expect(later.storage.materials.wheat ?? 0).toBeGreaterThan(0);
    expect(later.seedStock.wheat ?? 0).toBeGreaterThan(0);
  });

  it('harvests nothing of another species, nor without a species, nor unassigned', () => {
    const corn = planted(working('corn'), Array.from({ length: 4 }, () => ripeAt(0)));
    expect(fieldsOf(advance(corn, HOUR).state, 'wheat')).toBe(4);
    const wheat = planted(working(), Array.from({ length: 4 }, () => ripeAt(0, 'wheat')));
    const otherSpecies = { ...wheat, fields: wheat.fields.map((field, index) => (index < 2 ? { ...field, crop: ripeAt(0, 'corn') } : field)) };
    expect(fieldsOf(advance(otherSpecies, HOUR).state, 'corn')).toBe(2);
    expect(fieldsOf(advance(planted(working(null), [ripeAt(0), ripeAt(0)]), HOUR).state, 'wheat')).toBe(2);
    const bin = idOf(fitted, 'farmHarvestBin');
    expect(fieldsOf(advance(planted(apply(working(), unassign(bin)), [ripeAt(0), ripeAt(0)]), HOUR).state, 'wheat')).toBe(2);
  });

  it('leaves the crops that are not ripe, and the Fields he did not need', () => {
    const state = planted(working(), [ripeAt(0), ripeAt(10 * HOUR)]);
    expect(fieldsOf(advance(state, HOUR).state, 'wheat')).toBe(1);
  });

  it('stops while the Line is cut, and while the city cannot pay an hour of wages', () => {
    const cut = apply(tenWheat(), remove(idOf(fitted, 'farmThresher')));
    expect(fieldsOf(advance(cut, HOUR).state, 'wheat')).toBe(10);
    expect(fieldsOf(advance({ ...tenWheat(), urbs: 0 }, HOUR).state, 'wheat')).toBe(10);
  });

  it('does not bank the hours he had nothing to do, so that a map ripe at once is not cleared at once', () => {
    const late = planted(working(), Array.from({ length: 20 }, () => ripeAt(3 * HOUR)));
    expect(fieldsOf(advance(late, 4 * HOUR).state, 'wheat')).toBe(20 - 5);
  });
});

describe('the save of a Farm interior', () => {
  it('keeps the Fixtures, the Staff and their assignments', () => {
    const working = apply(fitted, hire('farmhand'), hire('irrigator'), assign(idOf(fitted, 'farmHarvestBin')), assign(idOf(fitted, 'farmSprinkler')));
    expect(checkGameState(JSON.parse(JSON.stringify(working)))).toBeTruthy();
  });
});

import { describe, expect, it } from 'vitest';
import { canStandOnInterior, coalCapacityOf, coalPollutionShareOf, createBuilding, engineRoomGainsOf, engineRoomReportOf, interiorBonusOfBuilding, type Building, type FixtureId, type Rotation, type VenueFixture } from '../index';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });

// A Coal circuit across the back of a room: the Coal quay, a Conveyor and the Steam boiler down column `at + 1`, a Water inlet and its pipe in column `at` that turns into the boiler, the steam going
// right to the Alternator, and a Cable that turns up to the Power outlet on the back wall.
const coalCircuit = (at = 0): VenueFixture[] => [
  put('coalPlantCoalQuay', at + 1, 0), put('coalPlantConveyor', at + 1, 1), put('coalPlantSteamBoiler', at + 1, 2),
  put('coalPlantWaterInlet', at, 0), put('coalPlantWaterPipe', at, 1), put('coalPlantWaterPipeElbow', at, 2, 3),
  put('coalPlantSteamPipe', at + 2, 2, 1), put('coalPlantAlternator', at + 3, 2),
  put('coalPlantCableElbow', at + 4, 2, 2), put('coalPlantCable', at + 4, 1), put('coalPlantPowerOutlet', at + 4, 0),
];

const plant = (fixtures: VenueFixture[], tier = 4): Building => ({ ...createBuilding(1, 'coalPlant', 0, 0, 0), tier, interior: { fixtures, nextFixtureId: 1000 } });

const without = (fixtures: VenueFixture[], type: FixtureId): VenueFixture[] => fixtures.filter(fixture => fixture.type !== type);

describe('the Circuits of an Engine room', () => {
  it('add nothing while the room is empty', () => {
    expect(engineRoomGainsOf(plant([]))).toEqual({ circuits: 0, generation: 0, cleaner: 0 });
    expect(coalCapacityOf(plant([]))).toBe(64);
    expect(coalPollutionShareOf(plant([]))).toBe(1);
  });

  it('count a Coal circuit once every link of its flowchart is laid', () => {
    const report = engineRoomReportOf(plant(coalCircuit()));
    expect(report.circuits).toHaveLength(1);
    expect(report.used.size).toBe(11);
  });

  it('raise the Capacity of the plant and lower its pollution', () => {
    const complete = plant(coalCircuit());
    expect(engineRoomGainsOf(complete)).toMatchObject({ circuits: 1, generation: 0.15, cleaner: 0.2 });
    expect(coalCapacityOf(complete)).toBeCloseTo(64 * 1.15);
    expect(coalPollutionShareOf(complete)).toBeCloseTo(0.8);
    expect(interiorBonusOfBuilding(complete)).toMatchObject({ generation: 0.15, cleaner: 0.2 });
  });

  it('count nothing when the coal does not reach the boiler', () => {
    expect(engineRoomReportOf(plant(without(coalCircuit(), 'coalPlantConveyor'))).circuits).toHaveLength(0);
  });

  it('count nothing when the water does not reach the boiler', () => {
    expect(engineRoomReportOf(plant(without(coalCircuit(), 'coalPlantWaterPipe'))).circuits).toHaveLength(0);
  });

  it('count nothing when the steam goes to the wrong Medium of pipe', () => {
    const fixtures = coalCircuit().map(fixture => (fixture.type === 'coalPlantSteamPipe' ? { ...fixture, type: 'coalPlantWaterPipe' as const } : fixture));
    expect(engineRoomReportOf(plant(fixtures)).circuits).toHaveLength(0);
  });

  it('count nothing when the Alternator is turned away from the steam', () => {
    const fixtures = coalCircuit().map(fixture => (fixture.type === 'coalPlantAlternator' ? { ...fixture, rotation: 2 as const } : fixture));
    expect(engineRoomReportOf(plant(fixtures)).circuits).toHaveLength(0);
  });

  it('count nothing when a Fixture of the Circuit is broken down', () => {
    for (const type of ['coalPlantCoalQuay', 'coalPlantConveyor', 'coalPlantSteamBoiler', 'coalPlantAlternator', 'coalPlantCable', 'coalPlantPowerOutlet'] as const) {
      const fixtures = coalCircuit().map(fixture => (fixture.type === type ? { ...fixture, broken: true as const } : fixture));
      expect(engineRoomReportOf(plant(fixtures)).circuits, type).toHaveLength(0);
    }
  });

  it('count nothing for a Power outlet that the electricity does not reach', () => {
    expect(engineRoomReportOf(plant(without(coalCircuit(), 'coalPlantCable'))).circuits).toHaveLength(0);
  });

  it('count each complete Circuit, adding less and less', () => {
    const one = engineRoomGainsOf(plant(coalCircuit()));
    const two = engineRoomGainsOf(plant([...coalCircuit(), ...coalCircuit(6)]));
    expect(two.circuits).toBe(2);
    expect(two.generation).toBeGreaterThan(one.generation);
    expect(two.generation).toBeLessThan(2 * one.generation);
    expect(two.generation).toBeLessThan(0.3);
  });

  it('give a Circuit its own ports: a second boiler on the same quay does not count', () => {
    const second = [put('coalPlantSteamBoiler', 6, 2), put('coalPlantConveyor', 6, 1)];
    expect(engineRoomReportOf(plant([...coalCircuit(), ...second])).circuits).toHaveLength(1);
  });

  it('give a lower Tier a lower cap', () => {
    expect(engineRoomGainsOf(plant(coalCircuit(), 1)).generation).toBeCloseTo(0.04);
  });
});

describe('the wall ports of an Engine room', () => {
  it('stand against the back wall, facing the room', () => {
    const host = plant([]);
    expect(canStandOnInterior(host, { type: 'coalPlantCoalQuay', x: 3, y: 0, rotation: 0 })).toBe(true);
    expect(canStandOnInterior(host, { type: 'coalPlantCoalQuay', x: 3, y: 4, rotation: 0 })).toBe(false);
    expect(canStandOnInterior(host, { type: 'coalPlantCoalQuay', x: 3, y: 0, rotation: 2 })).toBe(false);
    expect(canStandOnInterior(host, { type: 'coalPlantSteamBoiler', x: 3, y: 4, rotation: 0 })).toBe(true);
  });
});

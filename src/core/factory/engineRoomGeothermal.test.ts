import { describe, expect, it } from 'vitest';
import { createBuilding, engineRoomGainsOf, engineRoomReportOf, generatorCapacity, interiorFixtureKindOf, isInteriorUnlocked, newGame, type Building, type BuildingType, type FixtureId, type Rotation, type VenueFixture } from '../index';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });

// The steam goes down column 2 from the Underground water inlet to the Steam turbine and the Condenser, turns at the front, and climbs column 3 to the Injection well; the Cable leaves the turbine to the left and climbs column 1 to the Power outlet.
const geothermalCircuit = (): VenueFixture[] => [
  put('geothermalPlantUndergroundWaterInlet', 2, 0), put('geothermalPlantSteamPipe', 2, 1), put('geothermalPlantSteamPipe', 2, 2), put('geothermalPlantSteamTurbine', 2, 3, 1), put('geothermalPlantCondenser', 2, 4, 1),
  put('geothermalPlantSteamPipeElbow', 2, 5, 3), put('geothermalPlantSteamPipeElbow', 3, 5, 2),
  put('geothermalPlantSteamPipe', 3, 4), put('geothermalPlantSteamPipe', 3, 3), put('geothermalPlantSteamPipe', 3, 2), put('geothermalPlantSteamPipe', 3, 1), put('geothermalPlantInjectionWell', 3, 0),
  put('geothermalPlantCableElbow', 1, 3, 3), put('geothermalPlantCable', 1, 2), put('geothermalPlantCable', 1, 1), put('geothermalPlantPowerOutlet', 1, 0),
];

const plant = (fixtures: VenueFixture[], type: BuildingType = 'geothermalPlant', tier = 6): Building => ({ ...createBuilding(1, type, 0, 0, 0), tier, interior: { fixtures, nextFixtureId: 1000 } });

describe('the Engine room of a Geothermal power plant', () => {
  it('counts a circuit from the Underground water inlet to the Injection well and the Power outlet', () => {
    const report = engineRoomReportOf(plant(geothermalCircuit()));
    expect(report.circuits).toHaveLength(1);
    expect(report.used.size).toBe(16);
  });

  it('adds nothing while the room is empty', () => {
    expect(engineRoomGainsOf(plant([]))).toEqual({ circuits: 0, generation: 0, cleaner: 0 });
    expect(generatorCapacity(plant([]))).toBe(256);
  });

  it('raises the Capacity of the plant, and never lowers any pollution', () => {
    const complete = plant(geothermalCircuit());
    expect(engineRoomGainsOf(complete)).toMatchObject({ circuits: 1, generation: 0.125, cleaner: 0 });
    expect(generatorCapacity(complete)).toBeCloseTo(256 * 1.125);
  });

  it('counts nothing without the Condenser, the Injection well or the Cable', () => {
    for (const type of ['geothermalPlantCondenser', 'geothermalPlantInjectionWell', 'geothermalPlantCable'] as const) {
      expect(engineRoomReportOf(plant(geothermalCircuit().filter(fixture => fixture.type !== type))).circuits, type).toHaveLength(0);
    }
  });

  it('counts nothing when the turbine is broken down', () => {
    const fixtures = geothermalCircuit().map(fixture => (fixture.type === 'geothermalPlantSteamTurbine' ? { ...fixture, broken: true as const } : fixture));
    expect(engineRoomReportOf(plant(fixtures)).circuits).toHaveLength(0);
  });
});

describe('the Engine room of a Large geothermal power plant', () => {
  it('takes the Fixtures of the Geothermal power plant, and a larger share of its Capacity', () => {
    expect(interiorFixtureKindOf('largeGeothermalPlant')).toBe('geothermalPlant');
    const large = plant(geothermalCircuit(), 'largeGeothermalPlant', 1);
    expect(engineRoomReportOf(large).circuits).toHaveLength(1);
    expect(generatorCapacity(large)).toBeCloseTo(1024 * 1.125);
  });

  it('opens at 1500 Citizens, the Geothermal one at 600', () => {
    const state = newGame({ seed: 'unlock', now: 0 });
    expect(isInteriorUnlocked(state, 'geothermalPlant')).toBe(false);
  });
});

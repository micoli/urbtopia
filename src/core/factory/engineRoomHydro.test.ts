import { describe, expect, it } from 'vitest';
import { createBuilding, engineRoomGainsOf, engineRoomMotionOf, engineRoomReportOf, generatorCapacity, type Building, type FixtureId, type Rotation, type VenueFixture } from '../index';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });

// The water goes down column 2 from the Water inlet to the Water turbine, turns at the front and climbs column 3 to the Water outlet; the Cable leaves the turbine to the left and climbs column 1 to the Power outlet.
const hydroCircuit = (): VenueFixture[] => [
  put('hydroPlantWaterInlet', 2, 0), put('hydroPlantWaterPipe', 2, 1), put('hydroPlantWaterPipe', 2, 2), put('hydroPlantWaterTurbine', 2, 3, 1),
  put('hydroPlantWaterPipeElbow', 2, 4, 3), put('hydroPlantWaterPipeElbow', 3, 4, 2), put('hydroPlantWaterPipe', 3, 3), put('hydroPlantWaterPipe', 3, 2), put('hydroPlantWaterPipe', 3, 1), put('hydroPlantWaterOutlet', 3, 0),
  put('hydroPlantCableElbow', 1, 3, 3), put('hydroPlantCable', 1, 2), put('hydroPlantCable', 1, 1), put('hydroPlantPowerOutlet', 1, 0),
];

const plant = (fixtures: VenueFixture[], tier = 3): Building => ({ ...createBuilding(1, 'hydroPlant', 0, 0, 0), tier, interior: { fixtures, nextFixtureId: 1000 } });

describe('the Engine room of a Hydro power plant', () => {
  it('counts a circuit from the Water inlet through the turbine to the Water outlet and the Power outlet', () => {
    const report = engineRoomReportOf(plant(hydroCircuit()));
    expect(report.circuits).toHaveLength(1);
    expect(report.used.size).toBe(14);
  });

  it('raises the Capacity of the plant by the share of its Tier', () => {
    expect(generatorCapacity(plant([]))).toBe(45);
    const complete = plant(hydroCircuit());
    expect(engineRoomGainsOf(complete)).toMatchObject({ circuits: 1, generation: 0.1, cleaner: 0 });
    expect(generatorCapacity(complete)).toBeCloseTo(45 * 1.1);
  });

  it('counts nothing without the Water outlet, the Water inlet or the Cable', () => {
    for (const type of ['hydroPlantWaterOutlet', 'hydroPlantWaterInlet', 'hydroPlantCable'] as const) {
      expect(engineRoomReportOf(plant(hydroCircuit().filter(fixture => fixture.type !== type))).circuits, type).toHaveLength(0);
    }
  });

  it('counts nothing when the turbine is broken down', () => {
    const fixtures = hydroCircuit().map(fixture => (fixture.type === 'hydroPlantWaterTurbine' ? { ...fixture, broken: true as const } : fixture));
    expect(engineRoomReportOf(plant(fixtures)).circuits).toHaveLength(0);
  });

  it('runs the Fixtures of the circuit', () => {
    expect(engineRoomMotionOf(plant(hydroCircuit())).size).toBe(14);
  });
});

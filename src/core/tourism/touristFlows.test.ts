import { describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, newGame, type Building, type BuildingType, type GameState } from '../index';
import { buildingFlowsOf } from '../analytics/flowEndpoints';
import { STATION_SHARE } from './touristFlows';

const base = newGame({ seed: 'tourist-flows', now: 0 });

const withBuildings = (state: GameState, specs: { type: BuildingType; x: number; y: number; rotation?: 0 | 1 | 2 | 3 }[]): GameState => {
  let nextId = state.nextId;
  const added: Building[] = specs.map(spec => createBuilding(nextId++, spec.type, spec.x, spec.y, spec.rotation ?? 0));
  return { ...state, nextId, buildings: [...state.buildings, ...added] };
};

const museum = { type: 'masMuseum' as const, x: 58, y: 59 };
const home = { type: 'home' as const, x: 55, y: 59 };
const car = (state: GameState) => congestionStats(state).touristFlows.filter(flow => flow.mode === 'car');

describe('Tourist flows', () => {
  it('has none without an Attraction', () => {
    expect(congestionStats(withBuildings(base, [home])).touristFlows).toEqual([]);
  });

  it('brings Tourists by car from the gate of the city when no station serves the Attraction', () => {
    const state = withBuildings(base, [home, museum]);
    const flows = congestionStats(state).touristFlows;
    expect(flows.map(flow => flow.mode)).toEqual(['car']);
    expect(flows[0]!.path.length).toBeGreaterThan(0);
  });

  it('loads the Roads with the Tourists who drive', () => {
    const without = congestionStats(withBuildings(base, [home]));
    const state = withBuildings(base, [home, museum]);
    const loadOf = (stats: ReturnType<typeof congestionStats>) => [...stats.sections.values()].reduce((sum, section) => sum + section.load, 0);
    expect(loadOf(congestionStats(state))).toBeGreaterThan(loadOf(without));
  });

  it('sends the Tourists of a station within walking range on foot, and fewer by car', () => {
    const plain = withBuildings(base, [home, museum]);
    const served = withBuildings(base, [home, museum, { type: 'railStation', x: 60, y: 59 }]);
    const walkers = congestionStats(served).touristFlows.filter(flow => flow.mode === 'walk');
    expect(walkers).toHaveLength(1);
    const total = (state: GameState) => car(state).reduce((sum, flow) => sum + flow.count, 0);
    expect(total(served)).toBeCloseTo(total(plain) * (1 - STATION_SHARE));
  });

  it('lists the Tourists by mode in the Building flows of the Attraction', () => {
    const state = withBuildings(base, [home, museum]);
    const museumId = state.buildings.find(building => building.type === 'masMuseum')!.id;
    const flows = buildingFlowsOf(state, museumId)!;
    expect(flows.tourists.car).toBeGreaterThan(0);
    expect(flows.routes.car.length).toBeGreaterThan(0);
  });
});

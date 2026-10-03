import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, energyStats, extendNetwork, newGame, routeForLine, transportStats, type Command, type GameState, type TransitTile } from './index';
import { parseEnvelope, serializeEnvelope } from '../persistence/envelope';
import { validateGameState } from '../persistence/validate';
import { restoreDeletion } from './undo';
import saveV5 from '../persistence/fixtures/save-v5.json';
import saveV4 from '../persistence/fixtures/save-v4.json';

const H = 3_600_000;
const strip = (x: number, y: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));
function city(): GameState {
  return { ...newGame({ seed: 'transit', now: 0 }), ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], urbs: 100_000, nextId: 100,
    buildings: [ { ...createBuilding(1, 'home', 0, 4, 0), tier: 8 } ], roads: [], roundabouts: [], adaptationUntil: 0 };
}
function run(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, state.lastSeen);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}
function railCity(): GameState {
  return { ...city(), buildings: [createBuilding(1, 'railStation', 0, 1, 0), createBuilding(2, 'railStation', 20, 1, 0)], rails: strip(0, 0, 23),
    transitLines: [{ id: 3, mode: 'rail', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 10 }],
    transitFleet: [{ id: 4, kind: 'trainCoal', purchasePrice: 1600, lineId: 3 }], storage: { materials: { coal: 1 }, goods: {} } };
}

describe('independent infrastructure', () => {
  it('permits perpendicular Road/BRT crossings without joining networks', () => {
    const state = { ...city(), roads: Array.from({ length: 5 }, (_, i) => ({ x: 10, y: i + 8, kind: 'road' as const })) };
    const next = run(state, { type: 'BuildTransit', mode: 'brt', from: { x: 8, y: 10 }, to: { x: 12, y: 10 } });
    expect(next.brtRoads).toHaveLength(5);
    expect(next.roads).toEqual(state.roads);
    expect(next.urbs).toBe(state.urbs - 60);
    expect(extendNetwork(next, 'brt', { x: 10, y: 10 }, { x: 10, y: 12 }, true)).toEqual({ key: 'error.invalidCrossing' });
  });
  it('rejects parallel overlaps, triple crossings and crossings on bends', () => {
    const state = { ...city(), roads: Array.from({ length: 5 }, (_, i) => ({ x: i + 8, y: 10, kind: 'road' as const })) };
    expect(extendNetwork(state, 'brt', { x: 8, y: 10 }, { x: 12, y: 10 }, true)).toEqual({ key: 'error.invalidCrossing' });
    const next = run(state, { type: 'BuildTransit', mode: 'brt', from: { x: 10, y: 8 }, to: { x: 10, y: 12 } });
    expect(extendNetwork(next, 'rail', { x: 8, y: 10 }, { x: 12, y: 10 }, true)).toEqual({ key: 'error.invalidCrossing' });
    expect(dispatch(next, { type: 'BuildRoad', from: { x: 10, y: 10 }, to: { x: 10, y: 11 } }, 0).ok).toBe(false);
  });
  it('supports ordinary Roads crossing previously placed Railways', () => {
    const state = { ...city(), rails: strip(8, 10, 5) };
    const next = run(state, { type: 'BuildRoad', from: { x: 10, y: 8 }, to: { x: 10, y: 12 } });
    expect(next.roads).toHaveLength(5);
  });
  it('does not connect adjacent dedicated segments unless explicitly joined', () => {
    const state = { ...city(), brtRoads: [...strip(0, 0, 3), ...strip(3, 0, 3)], buildings: [createBuilding(1, 'brtStation', 0, 1, 0), createBuilding(2, 'brtStation', 5, 1, 0)] };
    const line = { id: 10, mode: 'brt' as const, stops: [1, 2], peakHeadway: 5, offPeakHeadway: 12 };
    expect(routeForLine(state, line)).toBeNull();
    const result = extendNetwork(state, 'brt', { x: 2, y: 0 }, { x: 3, y: 0 }, true);
    expect('tiles' in result && routeForLine({ ...state, brtRoads: result.tiles }, line)).toHaveLength(6);
  });
  it('allows dedicated station access without granting ordinary building road access', () => {
    const state = { ...city(), brtRoads: strip(8, 10, 5) };
    expect(dispatch(state, { type: 'PlaceBuilding', buildingType: 'brtStation', x: 9, y: 11 }, 0).ok).toBe(true);
    expect(dispatch(state, { type: 'PlaceBuilding', buildingType: 'shop', x: 9, y: 11 }, 0)).toMatchObject({ ok: false, error: { key: 'error.needsRoad' } });
  });
  it('rejects non-finite coordinates and locked infrastructure', () => {
    expect(extendNetwork(city(), 'brt', { x: NaN, y: 0 }, { x: 0, y: 0 }, true)).toEqual({ key: 'error.outsideOwnedParcels' });
    expect(dispatch({ ...city(), buildings: [] }, { type: 'BuildTransit', mode: 'brt', from: { x: 8, y: 8 }, to: { x: 10, y: 8 } }, 0)).toMatchObject({ ok: false, error: { key: 'error.itemLocked' } });
  });
});

describe('fleet management and service', () => {
  it('purchases, assigns, releases and resells a vehicle', () => {
    const state = { ...railCity(), buildings: [...railCity().buildings, { ...createBuilding(10, 'home', 0, 4, 0), tier: 8 }, { ...createBuilding(11, 'home', 8, 4, 0), tier: 8 }], transitFleet: [] };
    const bought = run(state, { type: 'BuyTransitVehicle', kind: 'trainElectric' });
    expect(bought.urbs).toBe(state.urbs - 2400);
    const assigned = run(bought, { type: 'AssignTransitVehicle', id: 100, lineId: 3 });
    expect(assigned.transitFleet?.[0]?.lineId).toBe(3);
    const deleted = run(assigned, { type: 'DeleteTransitLine', id: 3 });
    expect(deleted.transitFleet?.[0]?.lineId).toBeUndefined();
    const sold = run(deleted, { type: 'SellTransitVehicle', id: 100 });
    expect(sold.urbs).toBe(deleted.urbs + 1200);
    expect(sold.transitFleet).toEqual([]);
  });
  it('permits mixed propulsion on the same Railway and stops only the energy-starved vehicles', () => {
    const state = { ...railCity(), transitFleet: [...railCity().transitFleet!, { id: 5, kind: 'trainElectric' as const, purchasePrice: 2400, lineId: 3 }] };
    expect(transportStats(state).lines[0]?.operatingVehicleIds).toEqual([4]);
    expect(energyStats(state).transitDemand).toBeGreaterThan(0);
    const supplied = { ...state, buildings: [...state.buildings, createBuilding(6, 'powerPlant', 5, 5, 0)] };
    expect(transportStats(supplied).lines[0]?.operatingVehicleIds).toEqual([4, 5]);
    expect(transportStats({ ...state, storage: { materials: {}, goods: {} } }).activeLines).toBe(0);
  });
  it('reduces effective frequency when the assigned fleet is insufficient', () => {
    const state = { ...railCity(), transitLines: [{ ...railCity().transitLines![0]!, offPeakHeadway: 1 }] };
    const one = transportStats(state).lines[0]!;
    const two = transportStats({ ...state, transitFleet: [...state.transitFleet!, { ...state.transitFleet![0]!, id: 5 }] }).lines[0]!;
    expect(one.headway).toBeGreaterThan(one.targetHeadway);
    expect(two.headway).toBeLessThan(one.headway);
    expect(two.capacity).toBeGreaterThan(one.capacity);
  });
  it('selects BRT peak frequency from game time including Time skip offsets', () => {
    const state = { ...city(), buildings: [createBuilding(1, 'brtStation', 0, 1, 0), createBuilding(2, 'brtStation', 20, 1, 0), createBuilding(6, 'powerPlant', 5, 5, 0)], brtRoads: strip(0, 0, 21),
      transitLines: [{ id: 3, mode: 'brt' as const, stops: [1, 2], peakHeadway: 5, offPeakHeadway: 12 }], transitFleet: [{ id: 4, kind: 'brtElectric' as const, purchasePrice: 900, lineId: 3 }] };
    expect(transportStats(state).lines[0]?.targetHeadway).toBe(12);
    expect(transportStats({ ...state, timeOffset: 7 * H }).lines[0]?.targetHeadway).toBe(5);
    expect(transportStats({ ...state, timeOffset: 9 * H }).lines[0]?.targetHeadway).toBe(12);
  });
  it('consumes coal through its exact exhaustion boundary identically in ticks and Catch-up', () => {
    const state = railCity();
    const catchup = advance(state, 4 * H).state;
    let live = state;
    for (let i = 1; i <= 240; i++) live = advance(live, i * H / 60).state;
    expect(catchup.storage.materials.coal).toBe(0);
    expect(live.urbs).toBeCloseTo(catchup.urbs, 7);
    expect(live.storage.materials.coal).toBe(0);
    expect(transportStats(catchup).activeLines).toBe(0);
    expect(parseEnvelope(serializeEnvelope(advance(state, H / 10).state, H / 10)).ok).toBe(true);
  });
  it('retains fleet and line configuration when infrastructure is removed', () => {
    const state = railCity();
    const next = run(state, { type: 'DemolishTransit', mode: 'rail', from: { x: 10, y: 0 }, to: { x: 10, y: 0 } });
    expect(transportStats(next).activeLines).toBe(0);
    expect(next.transitFleet).toEqual(state.transitFleet);
    expect(next.transitLines).toEqual(state.transitLines);
    const result = dispatch(state, { type: 'DemolishTransit', mode: 'rail', from: { x: 10, y: 0 }, to: { x: 10, y: 0 } }, 0);
    expect(result.ok && result.undo).toBeTruthy();
    if (result.ok && result.undo) expect(transportStats(restoreDeletion(result.state, result.undo)).activeLines).toBe(1);
  });
});

function transferCity(): GameState {
  return { ...city(), buildings: [
    { ...createBuilding(1, 'home', 0, 2, 0), tier: 3 }, createBuilding(2, 'factory', 30, 2, 0),
    createBuilding(3, 'busStop', 0, 1, 0), createBuilding(4, 'busStop', 15, 1, 0),
    createBuilding(5, 'railStation', 16, 1, 0), createBuilding(6, 'railStation', 30, 1, 0),
  ], roads: Array.from({ length: 16 }, (_, x) => ({ x, y: 0, kind: 'road' as const })), rails: strip(16, 0, 17),
    busLines: [{ id: 10, stops: [3, 4] }], transitLines: [{ id: 11, mode: 'rail', stops: [5, 6], peakHeadway: 5, offPeakHeadway: 10 }],
    transitFleet: [{ id: 12, kind: 'trainCoal', purchasePrice: 1600, lineId: 11 }], storage: { materials: { coal: 10 }, goods: {} } };
}

describe('multimodal itineraries', () => {
  it('connects Homes and activities on different modes and counts shared riders once', () => {
    const stats = transportStats(transferCity());
    expect(stats.riders).toBeCloseTo(32 * .7);
    expect(stats.transferRiders).toBe(stats.riders);
    expect(stats.lines.map(l => l.riders)).toEqual([stats.riders, stats.riders]);
    expect(transportStats({ ...transferCity(), transitFleet: [] }).riders).toBe(0);
  });
  it('allows two Transfers and rejects an itinerary needing three', () => {
    const xs = [0, 12, 13, 25, 26, 38, 39, 51];
    const state = { ...city(), buildings: [{ ...createBuilding(1, 'home', 0, 2, 0), tier: 3 }, createBuilding(2, 'factory', 51, 2, 0), ...xs.map((x, i) => createBuilding(i + 3, 'busStop', x, 1, 0))], roads: Array.from({ length: 52 }, (_, x) => ({ x, y: 0, kind: 'road' as const })), busLines: Array.from({ length: 4 }, (_, i) => ({ id: 20 + i, stops: [3 + 2 * i, 4 + 2 * i] })) };
    expect(transportStats(state).riders).toBe(0);
    const two = { ...state, buildings: state.buildings.map(b => b.id === 2 ? { ...b, x: 38 } : b) };
    expect(transportStats(two).riders).toBeCloseTo(32 * .7);
    expect(transportStats(two).lines[2]!.riders).toBeGreaterThan(0);
  });
  it('requires nearby stops rather than mere infrastructure connectivity', () => {
    const state = transferCity();
    const distant = { ...state, buildings: state.buildings.map(b => b.id === 5 ? { ...b, x: 19 } : b) };
    expect(transportStats(distant).riders).toBe(0);
  });
  it('limits a transfer itinerary by every line capacity', () => {
    const state = transferCity();
    const next = { ...state, buildings: state.buildings.map(b => b.id === 1 ? { ...b, tier: 8 } : b), transitLines: [{ ...state.transitLines![0]!, offPeakHeadway: 60 }] };
    const stats = transportStats(next);
    expect(stats.riders).toBeLessThanOrEqual(Math.min(...stats.lines.map(l => l.capacity)));
    expect(stats.lines[0]!.riders).toBe(stats.lines[1]!.riders);
  });
});

describe('transit save format', () => {
  it('migrates v4 Roads and Bus lines unchanged and initializes empty transit state', () => {
    const parsed = parseEnvelope(JSON.stringify(saveV4));
    expect(parsed).toMatchObject({ ok: true, state: { roads: saveV4.state.roads, busLines: saveV4.state.busLines, brtRoads: [], rails: [], transitLines: [], transitFleet: [] } });
  });
  it('loads the frozen v5 fixture with both Train propulsion types on one line', () => {
    const parsed = parseEnvelope(JSON.stringify(saveV5));
    expect(parsed).toMatchObject({ ok: true, state: { transitFleet: [{ kind: 'trainElectric', lineId: 3 }, { kind: 'trainCoal', lineId: 3 }] } });
  });
  it('round-trips mixed fleets, networks, frequencies and fractional coal', () => {
    const state = { ...transferCity(), storage: { materials: { coal: .25 }, goods: {} } };
    expect(parseEnvelope(serializeEnvelope(state, 0))).toEqual({ ok: true, state, savedAt: 0 });
    expect(validateGameState({ ...state, transitFleet: [{ ...state.transitFleet![0], lineId: 900 }] })).toBeNull();
    expect(validateGameState({ ...state, rails: [{ x: 1, y: 0, exits: ['up'] }] })).toBeNull();
  });
});

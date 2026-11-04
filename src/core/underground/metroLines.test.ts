import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, TRANSIT, createBuilding, newGame, routeFailure, transportStats, type GameState } from '..';
import { servingReach } from '../transit/transitReach';
import { handleCommand, isError, type Command } from '../engine/commands';
import { transitServices } from '../transit/transitService';

const size = GAME_CONFIG.parcelSizeInTiles;
const origin = (() => {
  const parcel = newGame({ seed: 'metro-lines', now: 0 }).ownedParcels[0]!;
  return { x: parcel.x * size + 1, y: parcel.y * size + 1 };
})();
const at = (dx: number, dy: number) => ({ x: origin.x + dx, y: origin.y + dy });

function send(state: GameState, command: Command): GameState {
  const outcome = handleCommand(state, command, 0);
  if (isError(outcome)) throw new Error(`${command.type}: ${outcome.key}`);
  return outcome.state;
}

function failure(state: GameState, command: Command): string {
  const outcome = handleCommand(state, command, 0);
  return isError(outcome) ? outcome.key : 'ok';
}

// A street with two Metro stations on it, and a Tunnel under both.
function twoStations(tunnel = true): GameState {
  const base = newGame({ seed: 'metro-lines', now: 0 });
  const homes = Array.from({ length: 300 }, (_, index) => createBuilding(100 + index, 'home', 0, 0, 0));
  let state: GameState = { ...base, urbs: 1_000_000, nextId: 1000, roundabouts: [], buildings: homes, roads: Array.from({ length: 10 }, (_, index) => ({ ...at(index, 0), kind: 'road' as const })) };
  state = send(state, { type: 'PlaceBuilding', buildingType: 'metroStation', x: at(0, 1).x, y: at(0, 1).y });
  state = send(state, { type: 'PlaceBuilding', buildingType: 'metroStation', x: at(7, 1).x, y: at(7, 1).y });
  return tunnel ? send(state, { type: 'BuildTransit', mode: 'metro', from: at(0, 1), to: at(8, 1) }) : state;
}

const stationIds = (state: GameState) => state.buildings.filter((building) => building.type === 'metroStation').map((building) => building.id);

describe('Metro lines', () => {
  it('join two stations through the Tunnel under them', () => {
    const state = twoStations();
    const line = { type: 'SetTransitLine' as const, mode: 'metro' as const, stops: stationIds(state), peakHeadway: 4, offPeakHeadway: 8 };
    const built = send(state, line);
    expect(built.transitLines).toHaveLength(1);
    const service = transitServices(built).find((candidate) => candidate.mode === 'metro')!;
    expect(service.route!.length).toBe(8);
    expect(service.status).toBe('noVehicle');
  });

  it('are refused while a station has no Tunnel under it, or the Tunnel is cut', () => {
    const line = (state: GameState) => ({ type: 'SetTransitLine' as const, mode: 'metro' as const, stops: stationIds(state), peakHeadway: 4, offPeakHeadway: 8 });
    expect(failure(twoStations(false), line(twoStations(false)))).toBe('error.stopNotOnNetwork');
    const cut = send(twoStations(), { type: 'DemolishTransit', mode: 'metro', from: at(3, 1), to: at(4, 1) });
    expect(routeFailure(cut, { id: 1, mode: 'metro', stops: stationIds(cut), peakHeadway: 4, offPeakHeadway: 8 })).toBe('notConnected');
    expect(failure(cut, line(cut))).toBe('error.networkNotConnected');
  });

  it('take a hub and a station of another mode for no stop', () => {
    const state = twoStations();
    expect(routeFailure(state, { id: 1, mode: 'metro', stops: [stationIds(state)[0]!, 9999], peakHeadway: 4, offPeakHeadway: 8 })).toBe('invalid');
  });

  it('run with a bought Metro train, powered, never slowed by Congestion', () => {
    let state = send(twoStations(), { type: 'SetTransitLine', mode: 'metro', stops: stationIds(twoStations()), peakHeadway: 4, offPeakHeadway: 8 });
    const lineId = state.transitLines![0]!.id;
    const urbs = state.urbs;
    state = send(state, { type: 'BuyTransitVehicle', kind: 'metroTrain' });
    expect(urbs - state.urbs).toBe(TRANSIT.metroTrain.price);
    state = send(state, { type: 'AssignTransitVehicle', id: state.transitFleet![0]!.id, lineId });
    const service = transitServices(state).find((candidate) => candidate.id === lineId)!;
    expect(service.status).toBe('active');
    expect(service.speed).toBe(TRANSIT.metro.speed);
    expect(service.speedFactor).toBe(1);
    expect(failure(state, { type: 'AssignTransitVehicle', id: state.transitFleet![0]!.id, lineId: 99999 })).toBe('error.invalidBusLine');
  });

  it('take a Metro train for a Metro line only', () => {
    let state = twoStations();
    state = send(state, { type: 'BuyTransitVehicle', kind: 'metroTrain' });
    state = { ...state, transitLines: [{ id: 5000, mode: 'rail', stops: [], peakHeadway: 5, offPeakHeadway: 5 }] };
    expect(failure(state, { type: 'AssignTransitVehicle', id: state.transitFleet![0]!.id, lineId: 5000 })).toBe('error.invalidBusLine');
  });

  it('carry Riders once served, and extend reach like BRT and rail', () => {
    let state = send(twoStations(), { type: 'SetTransitLine', mode: 'metro', stops: stationIds(twoStations()), peakHeadway: 4, offPeakHeadway: 8 });
    const lineId = state.transitLines![0]!.id;
    state = send(state, { type: 'BuyTransitVehicle', kind: 'metroTrain' });
    state = send(state, { type: 'AssignTransitVehicle', id: state.transitFleet![0]!.id, lineId });
    expect(servingReach(state).lines).toBe(1);
    expect(servingReach(state).stopIds.size).toBe(2);
    expect(transportStats(state).lines.find((line) => line.id === lineId)?.mode).toBe('metro');
  });
});

import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, congestionStats, createBuilding, levelOfLayer, newGame, probeOf, type GameState } from '..';
import { handleCommand, isError, type Command } from '../engine/commands';
import { accessFlows } from '../traffic/walkFlows';
import { layerFieldsOf } from './fields';
import { passageBeaconsOf } from './flowEndpoints';
import { sidewalkField, walkwayField } from './pedestrianFields';

const size = GAME_CONFIG.parcelSizeInTiles;
const origin = (() => {
  const parcel = newGame({ seed: 'walkway-fields', now: 0 }).ownedParcels[0]!;
  return { x: parcel.x * size + 1, y: parcel.y * size + 1 };
})();
const at = (dx: number, dy: number) => ({ x: origin.x + dx, y: origin.y + dy });

function send(state: GameState, command: Command): GameState {
  const outcome = handleCommand(state, command, 0);
  if (isError(outcome)) throw new Error(`${command.type}: ${outcome.key}`);
  return outcome.state;
}

// Two streets cut by Water, a Home on one and a shop on the other: the only way across is a walkway under the Water.
function islandCity(): GameState {
  const base = newGame({ seed: 'walkway-fields', now: 0 });
  const citizens = Array.from({ length: 300 }, (_, index) => createBuilding(100 + index, 'home', 0, 0, 0));
  const road = (x: number) => ({ ...at(x, 0), kind: 'road' as const });
  let state: GameState = {
    ...base,
    urbs: 1_000_000,
    nextId: 1000,
    roundabouts: [],
    roads: [0, 1, 2, 3, 6, 7, 8, 9].map(road),
    waterTiles: [at(4, 0), at(5, 0), at(4, 1), at(5, 1)],
    buildings: [...citizens, createBuilding(500, 'home', at(1, 1).x, at(1, 1).y, 0), createBuilding(501, 'shop', at(8, 1).x, at(8, 1).y, 0)],
  };
  state = send(state, { type: 'BuildPedestrianAccess', x: at(3, 1).x, y: at(3, 1).y });
  state = send(state, { type: 'BuildPedestrianAccess', x: at(6, 1).x, y: at(6, 1).y });
  return send(state, { type: 'BuildWalkway', from: at(3, 1), to: at(6, 1) });
}

describe('walkways in the Analytics view', () => {
  it('are read on Level -1, the Metro on Level -2, the rest on the Surface', () => {
    expect(levelOfLayer('movement.walkways')).toBe(-1);
    expect(levelOfLayer('movement.metro')).toBe(-2);
    expect(levelOfLayer('movement.pedestrians')).toBe(0);
    expect(levelOfLayer('data.wellbeing')).toBe(0);
  });

  it('load the walkway tiles, never the Sidewalks of the Surface above them', () => {
    const state = islandCity();
    const loads = [...congestionStats(state).sidewalkLoads.keys()];
    expect(loads.some((node) => node.endsWith(':U'))).toBe(true);
    const walkways = walkwayField(state);
    const sidewalks = sidewalkField(state);
    const under = at(4, 1);
    expect(walkways.values[under.y * walkways.size + under.x]).toBeGreaterThan(0);
    expect(sidewalks.values[under.y * sidewalks.size + under.x]).toBe(0);
  });

  it('draw their field on the Walkways layer, with one scale', () => {
    const fields = layerFieldsOf(islandCity(), 'movement.walkways', 'education');
    expect(fields.map(({ ramp }) => ramp)).toEqual(['walkway']);
  });

  it('list the busiest stairs and mark them with beacons', () => {
    const state = islandCity();
    const flows = accessFlows(state, congestionStats(state));
    expect(flows).toHaveLength(2);
    expect(flows[0]!.pedestrians).toBeGreaterThan(0);
    const beacons = passageBeaconsOf(state, 'movement.walkways')!;
    expect(beacons.walks.length).toBeGreaterThan(0);
    expect(beacons.walks[0]).toMatchObject({ volume: Math.round(flows[0]!.pedestrians) });
  });

  it('read the flow of a stair under the probe', () => {
    const state = islandCity();
    const stair = accessFlows(state, congestionStats(state))[0]!.tile;
    const probe = probeOf(state, 'movement.walkways', 'education', stair);
    expect(probe?.lines.some((line) => line.key === 'analytics.flow.access')).toBe(true);
  });
});

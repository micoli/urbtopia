import type { GameState, Layout } from '../engine/state';

export function layoutOf(state: GameState): Layout {
  return {
    buildings: state.buildings,
    roads: state.roads,
    pedestrianWays: state.pedestrianWays,
    walkways: state.walkways,
    pedestrianAccesses: state.pedestrianAccesses,
    tunnels: state.tunnels,
    roundabouts: state.roundabouts,
    waterTiles: state.waterTiles,
    boats: state.boats,
    bridges: state.bridges,
    brtRoads: state.brtRoads,
    rails: state.rails,
    fields: state.fields,
    busLines: state.busLines,
    transitLines: state.transitLines,
    transitFleet: state.transitFleet,
  };
}

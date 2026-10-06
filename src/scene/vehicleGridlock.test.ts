import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { advanceTrafficVehicle, isSpotFree, startTrafficVehicle, type TrafficVehicle } from './vehicleTraffic';

function gridGraph(size: number, step: number) {
  const roads: { x: number; y: number; kind: 'road' }[] = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (x % step === 0 || y % step === 0) roads.push({ x, y, kind: 'road' });
  const state: GameState = { ...newGame({ now: 0, seed: 't' }), roads, roundabouts: [] };
  return { graph: buildRoadGraph(state), roads };
}

describe('traffic gridlock', () => {
  it('keeps a dense grid flowing instead of freezing in a waiting cycle', () => {
    let s = 12345;
    const random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const { graph, roads } = gridGraph(13, 3);
    const lanesAt = () => 1;
    let vehicles: TrafficVehicle[] = [];
    let id = 1;
    for (let i = 0; i < 120; i++) {
      const tile = roads[Math.floor(random() * roads.length)]!;
      const v = startTrafficVehicle(graph, tile, id, 0, 2, lanesAt, random);
      if (v && isSpotFree(v, vehicles)) { vehicles.push(v); id++; }
    }
    let movingSamples = 0;
    let samples = 0;
    for (let t = 0; t < 8000; t++) {
      const positions = vehicles.map((v) => `${v.from.x},${v.from.y}>${v.to.x},${v.to.y}@${v.progress.toFixed(3)}`);
      vehicles = vehicles.filter((v) => advanceTrafficVehicle(graph, v, 0.05, random, vehicles, lanesAt));
      const moved = vehicles.filter((v, i) => positions[i] !== `${v.from.x},${v.from.y}>${v.to.x},${v.to.y}@${v.progress.toFixed(3)}`).length;
      if (t < 4000) continue;
      movingSamples += moved / vehicles.length;
      samples++;
    }
    expect(movingSamples / samples).toBeGreaterThan(0.3);
  });
});

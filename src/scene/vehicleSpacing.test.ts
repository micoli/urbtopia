import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { advanceTrafficVehicle, gapBetween, isSpotFree, startTrafficVehicle, type TrafficVehicle } from './vehicleTraffic';

function gridGraph(size: number, step: number) {
  const roads: { x: number; y: number; kind: 'road' }[] = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (x % step === 0 || y % step === 0) roads.push({ x, y, kind: 'road' });
  const state: GameState = { ...newGame({ now: 0, seed: 't' }), roads, roundabouts: [] };
  return { graph: buildRoadGraph(state), roads };
}

const sameEdge = (a: TrafficVehicle, b: TrafficVehicle) => a.from.x === b.from.x && a.from.y === b.from.y && a.to.x === b.to.x && a.to.y === b.to.y;

describe('safety distance in traffic', () => {
  it('never lets two vehicles of one lane overlap or swap places, whatever their length and speed', () => {
    let s = 987;
    const random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const { graph, roads } = gridGraph(13, 3);
    const lanesAt = () => 1;
    let vehicles: TrafficVehicle[] = [];
    let id = 1;
    for (let i = 0; i < 70; i++) {
      const tile = roads[Math.floor(random() * roads.length)]!;
      const created = startTrafficVehicle(graph, tile, id, 0, 1 + random() * 1.5, lanesAt, random);
      if (!created) continue;
      const vehicle: TrafficVehicle = { ...created, length: 0.55 + random() * 0.3 };
      if (isSpotFree(vehicle, vehicles)) { vehicles.push(vehicle); id++; }
    }
    let worst = Infinity;
    let overtakes = 0;
    let previous = new Map<string, number>();
    for (let t = 0; t < 3000; t++) {
      vehicles = vehicles.filter((v) => advanceTrafficVehicle(graph, v, 0.05, random, vehicles, lanesAt));
      const current = new Map<string, number>();
      for (const a of vehicles) for (const b of vehicles) {
        if (a.id >= b.id || !sameEdge(a, b) || a.lane !== b.lane) continue;
        worst = Math.min(worst, Math.abs(a.progress - b.progress) - gapBetween(a, b));
        const key = `${a.id}-${b.id}-${a.from.x},${a.from.y}>${a.to.x},${a.to.y}`;
        const sign = Math.sign(a.progress - b.progress);
        const before = previous.get(key);
        if (before !== undefined && before !== 0 && sign !== 0 && before !== sign) overtakes++;
        current.set(key, sign);
      }
      previous = current;
    }
    expect(overtakes).toBe(0);
    expect(worst).toBeGreaterThan(-0.05);
  }, 30_000);
});

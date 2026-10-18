import { describe, expect, it } from 'vitest';
import { COMPONENT_GAP, compactComponents } from './compactComponents.ts';
import type { MapLine, MapNode } from './transportMapModel.ts';

const node = (id: number, x: number, y: number): MapNode => ({ id, x, y, realX: x, realY: y, label: `#${id}`, name: `#${id}`, coordinates: '(0, 0)', hub: false, carriesBikes: false, modes: ['bus'] });
const line = (id: number, stops: number[]): MapLine => ({ id, mode: 'bus', stops, loop: false, active: true, status: 'active', load: 0, level: 'free', riders: 0, cyclists: 0, capacity: 0, headway: 0 });
const byId = (nodes: readonly MapNode[]) => new Map(nodes.map(n => [n.id, n]));
const width = (nodes: readonly MapNode[]) => Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x));

describe('compacting the sub-networks of the map', () => {
  it('brings two distant sub-networks closer, a gap apart', () => {
    const nodes = [node(1, 0, 0), node(2, 10, 0), node(3, 80, 2), node(4, 90, 2)];
    const placed = byId(compactComponents(nodes, [line(1, [1, 2]), line(2, [3, 4])], []));
    expect(placed.get(3)!.x - placed.get(2)!.x).toBe(COMPONENT_GAP.x);
    expect(width([...placed.values()])).toBeLessThan(width(nodes));
  });

  it('keeps the shape of each sub-network', () => {
    const nodes = [node(1, 0, 0), node(2, 10, 4), node(3, 80, 2), node(4, 95, 9)];
    const placed = byId(compactComponents(nodes, [line(1, [1, 2]), line(2, [3, 4])], []));
    expect(placed.get(2)!.x - placed.get(1)!.x).toBe(10);
    expect(placed.get(2)!.y - placed.get(1)!.y).toBe(4);
    expect(placed.get(4)!.x - placed.get(3)!.x).toBe(15);
    expect(placed.get(4)!.y - placed.get(3)!.y).toBe(7);
  });

  it('never overlaps two sub-networks', () => {
    const nodes = [node(1, 0, 0), node(2, 30, 30), node(3, 15, 15), node(4, 16, 15)];
    const placed = compactComponents(nodes, [line(1, [1, 2]), line(2, [3, 4])], []);
    const a = placed.filter(n => n.id <= 2), b = placed.filter(n => n.id > 2);
    const clear = Math.max(...a.map(n => n.x)) + COMPONENT_GAP.x <= Math.min(...b.map(n => n.x))
      || Math.max(...b.map(n => n.x)) + COMPONENT_GAP.x <= Math.min(...a.map(n => n.x))
      || Math.max(...a.map(n => n.y)) + COMPONENT_GAP.y <= Math.min(...b.map(n => n.y))
      || Math.max(...b.map(n => n.y)) + COMPONENT_GAP.y <= Math.min(...a.map(n => n.y));
    expect(clear).toBe(true);
  });

  it('stacks sub-networks that sit in different bands closer too', () => {
    const nodes = [node(1, 0, 0), node(2, 5, 0), node(3, 0, 60), node(4, 5, 60)];
    const placed = byId(compactComponents(nodes, [line(1, [1, 2]), line(2, [3, 4])], []));
    expect(Math.abs(placed.get(3)!.y - placed.get(1)!.y)).toBeLessThan(60);
  });

  it('keeps a network in one piece when its stops are linked by a Transfer', () => {
    const nodes = [node(1, 0, 0), node(2, 1, 1), node(3, 80, 0)];
    const placed = byId(compactComponents(nodes, [line(1, [1]), line(2, [3])], [{ from: 1, to: 2 }]));
    expect(placed.get(2)!.x - placed.get(1)!.x).toBe(1);
  });

  it('leaves a single sub-network alone and handles an empty map', () => {
    const nodes = [node(1, 40, 40), node(2, 50, 44)];
    expect(compactComponents(nodes, [line(1, [1, 2])], [])).toEqual(nodes);
    expect(compactComponents([], [], [])).toEqual([]);
  });
});

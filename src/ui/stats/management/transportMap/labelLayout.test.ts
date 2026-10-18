import { describe, expect, it } from 'vitest';
import { visibleLabels } from './labelLayout.ts';
import type { MapNode } from './transportMapModel.ts';

const node = (id: number, x: number, y: number, hub = false): MapNode => ({ id, x, y, realX: x, realY: y, label: `Stop number ${id} (1, 1)`, name: `Stop number ${id}`, coordinates: '(1, 1)', hub, carriesBikes: false, modes: ['bus'] });
const view = { x: 0, y: 0, width: 100, height: 40 };
const size = { width: 1000, height: 400 };

describe('map label layout', () => {
  it('shows every label when the stops are far apart', () => {
    expect([...visibleLabels([node(1, 30, 10), node(2, 50, 10), node(3, 70, 30)], null, view, size).keys()].sort()).toEqual([1, 2, 3]);
  });

  it('hides a label that would cover another one', () => {
    expect([...visibleLabels([node(1, 10, 10), node(2, 10.5, 10.2)], null, view, size).keys()]).toEqual([1]);
  });

  it('keeps the Transit hub label over the others', () => {
    const shown = visibleLabels([node(1, 10, 10), node(2, 10.5, 10.2, true)], null, view, size);
    expect(shown.has(2)).toBe(true);
    expect(shown.has(1)).toBe(false);
  });

  it('keeps the label of the selected stop over the hub', () => {
    const shown = visibleLabels([node(1, 10, 10), node(2, 10.5, 10.2, true)], { kind: 'stop', id: 1 }, view, size);
    expect(shown.has(1)).toBe(true);
  });

  it('shows more labels when zoomed in', () => {
    const nodes = [node(1, 10, 10), node(2, 12, 10)];
    expect(visibleLabels(nodes, null, view, size).size).toBe(1);
    expect(visibleLabels(nodes, null, { x: 5, y: 5, width: 10, height: 4 }, size).size).toBe(2);
  });

  it('leans a label on its stop when it would run past an edge of the map', () => {
    const anchors = visibleLabels([node(1, 99, 10), node(2, 1, 30), node(3, 50, 20)], null, view, size);
    expect(anchors.get(1)).toBe('end');
    expect(anchors.get(2)).toBe('start');
    expect(anchors.get(3)).toBe('middle');
  });
});

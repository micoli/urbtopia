import { describe, expect, it } from 'vitest';
import { transportStats, type TransitMode } from '../../../../core';
import { transportMapCity } from './transportMapFixture.ts';
import { isLineDimmed, isNodeDimmed } from './selection.ts';
import { buildTransportMap, loadLevel, visibleLines } from './transportMapModel.ts';
import { BUTTON_ZOOM_STEP, fitViewBox, zoomViewBox } from './useMapViewport.ts';

const model = () => { const state = transportMapCity(); return buildTransportMap(state, transportStats(state)); };

describe('transport map model', () => {
  it('has one node per stop used by a line, at the centre of its building', () => {
    const { nodes } = model();
    expect(nodes.map(node => node.id).sort((a, b) => a - b)).toEqual([3, 4, 6, 7]);
    const hub = nodes.find(node => node.id === 4)!;
    expect(hub.hub).toBe(true);
    expect(hub.x).toBeGreaterThan(14);
  });

  it('splits the label into the name and the coordinates', () => {
    const hub = model().nodes.find(node => node.id === 4)!;
    expect(hub.coordinates).toBe('(14, 1)');
    expect(hub.name).not.toContain('(');
    expect(hub.label).toBe(`${hub.name} ${hub.coordinates}`);
  });

  it('marks the stops that carry bicycles', () => {
    const byId = new Map(model().nodes.map(node => [node.id, node]));
    expect(byId.get(3)!.carriesBikes).toBe(false);
    expect(byId.get(4)!.carriesBikes).toBe(true);
    expect(byId.get(6)!.carriesBikes).toBe(true);
  });

  it('lists the modes served by a node, so a hub shows both', () => {
    expect(model().nodes.find(node => node.id === 4)!.modes.sort()).toEqual(['bus', 'rail']);
  });

  it('keeps the loop flag and the status of every line', () => {
    const lines = new Map(model().lines.map(line => [line.id, line]));
    expect(lines.get(13)!.loop).toBe(true);
    expect(lines.get(10)!.loop).toBe(false);
    expect(lines.get(11)!.status).toBe('active');
  });

  it('draws a Transfer between stops two tiles apart, not between farther ones', () => {
    const pairs = model().transfers.map(transfer => [transfer.from, transfer.to].sort((a, b) => a - b).join('-'));
    expect(pairs).toContain('3-7');
    expect(pairs).not.toContain('3-6');
  });

  it('filters lines by mode', () => {
    const only = (...modes: TransitMode[]) => visibleLines(model(), new Set(modes)).map(line => line.id).sort((a, b) => a - b);
    expect(only('bus')).toEqual([10, 13]);
    expect(only('rail')).toEqual([11]);
    expect(only()).toEqual([]);
  });

  it('turns the load into a level', () => {
    expect(loadLevel(0)).toBe('free');
    expect(loadLevel(0.6)).toBe('loaded');
    expect(loadLevel(0.95)).toBe('saturated');
  });

  it('has bounds around its nodes, and unit bounds when empty', () => {
    const { bounds } = model();
    expect(bounds.minX).toBeLessThan(bounds.maxX);
    const empty = buildTransportMap(transportMapCity(), { lines: [] });
    expect(empty.nodes).toEqual([]);
    expect(empty.bounds).toEqual({ minX: 0, minY: 0, maxX: 1, maxY: 1 });
  });
});

describe('transport map selection', () => {
  it('fades the other lines and the stops outside the selected line', () => {
    const { lines, nodes } = model();
    const selection = { kind: 'line' as const, id: 11 };
    expect(lines.filter(line => isLineDimmed(selection, line)).map(line => line.id).sort()).toEqual([10, 13]);
    expect(nodes.filter(node => !isNodeDimmed(selection, node, lines)).map(node => node.id).sort((a, b) => a - b)).toEqual([4, 6]);
  });

  it('fades the lines that do not serve the selected stop', () => {
    const { lines, nodes } = model();
    const selection = { kind: 'stop' as const, id: 4 };
    expect(lines.filter(line => !isLineDimmed(selection, line)).map(line => line.id).sort((a, b) => a - b)).toEqual([10, 11, 13]);
    expect(nodes.filter(node => !isNodeDimmed(selection, node, lines))).toHaveLength(1);
  });

  it('fades nothing without selection', () => {
    const { lines, nodes } = model();
    expect(lines.some(line => isLineDimmed(null, line))).toBe(false);
    expect(nodes.some(node => isNodeDimmed(null, node, lines))).toBe(false);
  });
});

describe('transport map viewport', () => {
  it('fits the content with a margin and a minimum size', () => {
    const view = fitViewBox({ minX: 10, minY: 10, maxX: 30, maxY: 20 });
    expect(view.x).toBeLessThan(10);
    expect(view.x + view.width).toBeGreaterThan(30);
    expect(fitViewBox({ minX: 0, minY: 0, maxX: 1, maxY: 1 }).width).toBeGreaterThanOrEqual(12);
  });

  it('leaves room on the sides for the labels of the outer stops', () => {
    const view = fitViewBox({ minX: 0, minY: 0, maxX: 100, maxY: 20 });
    expect(view.x).toBeLessThanOrEqual(-12);
    expect(view.x + view.width).toBeGreaterThanOrEqual(112);
  });

  it('zooms around a focus point, which stays where it was', () => {
    const view = { x: 0, y: 0, width: 100, height: 50 };
    const zoomed = zoomViewBox(view, 0.5, { x: 40, y: 10 });
    expect(zoomed.width).toBe(50);
    expect((40 - zoomed.x) / zoomed.width).toBeCloseTo(0.4);
    expect((10 - zoomed.y) / zoomed.height).toBeCloseTo(0.2);
  });

  it('zooms in and out by buttons around the centre of the view', () => {
    const view = { x: 0, y: 0, width: 100, height: 50 };
    const zoomedIn = zoomViewBox(view, 1 / BUTTON_ZOOM_STEP, { x: 50, y: 25 });
    expect(zoomedIn.width).toBeCloseTo(100 / BUTTON_ZOOM_STEP);
    expect(zoomedIn.x + zoomedIn.width / 2).toBeCloseTo(50);
    expect(zoomedIn.y + zoomedIn.height / 2).toBeCloseTo(25);
    const back = zoomViewBox(zoomedIn, BUTTON_ZOOM_STEP, { x: 50, y: 25 });
    expect(back.width).toBeCloseTo(100);
  });

  it('limits the zoom', () => {
    expect(zoomViewBox({ x: 0, y: 0, width: 10, height: 10 }, 0.01, { x: 0, y: 0 }).width).toBe(6);
  });
});

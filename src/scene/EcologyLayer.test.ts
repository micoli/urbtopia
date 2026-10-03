import { afterEach, expect, it, vi } from 'vitest';
import { createBuilding, newGame } from '../core';
import { EcologyLayer } from './EcologyLayer';

afterEach(() => vi.unstubAllGlobals());

it('keeps a short bus route finite even when the first animation delta is negative', () => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() { }, fillText() { } }) }) });
  const layer = new EcologyLayer();
  const state = {    
...newGame({ seed: 'bus-animation', now: 0 }),
    buildings: [createBuilding(1, 'busStop', 0, 1, 0), createBuilding(2, 'busStop', 1, 1, 0)],
    roads: [{ x: 0, y: 0, kind: 'road' as const }, { x: 1, y: 0, kind: 'road' as const }], busLines: [{ id: 30, stops: [1, 2] }]  
};
  layer.sync(state, null);
  expect(() => layer.update(-0.01)).not.toThrow();
  layer.update(0.1);
  const bus = layer.root.children[0]?.children[0];
  expect(bus).toBeDefined();
  expect(bus?.position.toArray().every(Number.isFinite)).toBe(true);
  expect(bus?.position.x).toBeGreaterThanOrEqual(0.5);
  expect(bus?.position.x).toBeLessThanOrEqual(1.5);
  layer.dispose();
});

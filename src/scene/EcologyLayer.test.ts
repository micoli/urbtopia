import * as THREE from 'three';
import type { ModelLibrary } from './modelLibrary';
import { afterEach, expect, it, vi } from 'vitest';
import { createBuilding, newGame } from '../core';
import { EcologyLayer } from './EcologyLayer';

afterEach(() => vi.unstubAllGlobals());

it('keeps a short bus route finite even when the first animation delta is negative', () => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() { }, fillText() { } }) }) });
  const model = new THREE.Group();
  model.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.57, 2.6), new THREE.MeshStandardMaterial()));
  const library = { ensure: vi.fn().mockResolvedValue(undefined), has: () => true, get: () => model };
  const layer = new EcologyLayer(library as unknown as ModelLibrary);
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
  expect(library.ensure).toHaveBeenCalledWith(['trains/train-electric-subway-a']);
  const bounds = new THREE.Box3().setFromObject(bus!.children[0]!);
  expect(bounds.getSize(new THREE.Vector3()).z).toBeCloseTo(0.72);
  const disposeGeometry = vi.spyOn((model.children[0] as THREE.Mesh).geometry, 'dispose');
  layer.dispose();
  expect(disposeGeometry).not.toHaveBeenCalled();
});

it.each(['horizontal', 'vertical'])('keeps buses in the right lane in both directions on a %s road', (orientation) => {
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }) });
  const library = { ensure: vi.fn().mockResolvedValue(undefined), has: () => false };
  const layer = new EcologyLayer(library as unknown as ModelLibrary);
  const horizontal = orientation === 'horizontal';
  const state = {
    ...newGame({ seed: 'bus-lanes', now: 0 }),
    buildings: horizontal
      ? [createBuilding(1, 'busStop', 0, 1, 0), createBuilding(2, 'busStop', 1, 1, 0)]
      : [createBuilding(1, 'busStop', 1, 0, 1), createBuilding(2, 'busStop', 1, 1, 1)],
    roads: [{ x: 0, y: 0, kind: 'road' as const }, { x: horizontal ? 1 : 0, y: horizontal ? 0 : 1, kind: 'road' as const }],
    busLines: [{ id: 30, stops: [1, 2] }],
  };
  layer.sync(state, null);
  layer.update(0.25 / 1.5);
  const bus = layer.root.children[0]!.children[0]!;
  expect(horizontal ? bus.position.z : bus.position.x).toBeCloseTo(horizontal ? 0.7 : 0.3);
  layer.update(1 / 1.5);
  expect(horizontal ? bus.position.z : bus.position.x).toBeCloseTo(horizontal ? 0.3 : 0.7);
  layer.dispose();
});

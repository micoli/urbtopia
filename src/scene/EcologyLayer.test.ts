import * as THREE from 'three';
import type { ModelLibrary } from './modelLibrary';
import { afterEach, expect, it, vi } from 'vitest';
import { createBuilding, newGame } from '../core';
import { EcologyLayer } from './EcologyLayer';

afterEach(() => vi.unstubAllGlobals());

it('draws bus stop signs but leaves the buses to the traffic layer', () => {
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() { }, fillText() { } }) }) });
  const library = { ensure: vi.fn().mockResolvedValue(undefined), has: () => true, get: () => new THREE.Group() };
  const layer = new EcologyLayer(library as unknown as ModelLibrary);
  const state = {
    ...newGame({ seed: 'bus-signs', now: 0 }),
    buildings: [createBuilding(1, 'busStop', 0, 1, 0), createBuilding(2, 'busStop', 1, 1, 0)],
    roads: [{ x: 0, y: 0, kind: 'road' as const }, { x: 1, y: 0, kind: 'road' as const }], busLines: [{ id: 30, stops: [1, 2] }],
  };
  layer.sync(state, null);
  expect(() => layer.update(-0.01)).not.toThrow();
  const sprites: THREE.Object3D[] = [];
  layer.root.traverse((node) => { if (node instanceof THREE.Sprite) sprites.push(node); });
  expect(sprites).toHaveLength(2);
  expect(library.ensure).not.toHaveBeenCalledWith(['trains/train-electric-subway-a']);
  layer.dispose();
});

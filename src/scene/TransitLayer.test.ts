import * as THREE from 'three';
import { expect, it } from 'vitest';
import { createBuilding, newGame, transportStats, type GameState, type TransitTile } from '../core';
import { TransitLayer } from './TransitLayer';

it('renders dedicated infrastructure in bounded instance groups and animates a priority BRT crossing', () => {
  const layer = new TransitLayer();
  const brtRoads: TransitTile[] = Array.from({ length: 100 }, (_, x) => ({ x, y: 0, exits: x === 0 ? ['E'] : x === 99 ? ['W'] : ['E', 'W'] }));
  const state: GameState = { ...newGame({ seed: 'transit-scene', now: 0 }), buildings: [createBuilding(1, 'brtStation', 0, 1, 0), createBuilding(2, 'brtStation', 99, 1, 0), createBuilding(3, 'powerPlant', 0, 4, 0)], brtRoads,
    roads: [{ x: 1, y: 0, kind: 'road' }], rails: [], transitLines: [{ id: 4, mode: 'brt', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 12 }], transitFleet: [{ id: 5, kind: 'brtElectric', lineId: 4, purchasePrice: 900 }] };
  layer.sync(state, transportStats(state).lines);
  const groups = layer.root.children[0]!.children;
  expect(groups.filter(g => g instanceof THREE.InstancedMesh).length).toBeLessThan(20);
  const vehicle = layer.root.children[1]!.children[0]!;
  expect(vehicle).toBeDefined();
  layer.update(-1);
  expect(vehicle.position.toArray().every(Number.isFinite)).toBe(true);
  layer.update((198 - 5 + 1) / 1.5);
  expect(layer.priorityTiles.has('1,0')).toBe(true);
  const stopped = { ...state, urbs: 0 };
  layer.sync(stopped, transportStats(stopped).lines);
  expect(layer.root.children[1]!.children).toHaveLength(0);
  expect(layer.priorityTiles.size).toBe(0);
  layer.dispose();
});

it('loads Kenney electric and coal Trains without disposing the library models', async () => {
  const { TRAIN_MODELS } = await import('./renderItems');
  const { vi } = await import('vitest');
  const model = new THREE.Group();
  const geometry = new THREE.BoxGeometry(.8, 1, 3);
  model.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  const library = { ensure: vi.fn().mockResolvedValue(undefined), get: () => model };
  const layer = new TransitLayer(library as unknown as import('./modelLibrary').ModelLibrary);
  await Promise.resolve();
  const state: GameState = { ...newGame({ seed: 'train-assets', now: 0 }), buildings: [createBuilding(1, 'railStation', 0, 1, 0), createBuilding(2, 'railStation', 5, 1, 0), createBuilding(3, 'powerPlant', 2, 4, 0)],
    rails: Array.from({ length: 7 }, (_, x) => ({ x, y: 0, exits: x === 0 ? ['E'] : x === 6 ? ['W'] : ['E', 'W'] })),
    transitLines: [{ id: 4, mode: 'rail', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 10 }], storage: { materials: { coal: 10 }, goods: {} },
    transitFleet: [{ id: 5, kind: 'trainElectric', lineId: 4, purchasePrice: 2400 }, { id: 6, kind: 'trainCoal', lineId: 4, purchasePrice: 1600 }] };
  layer.sync(state, transportStats(state).lines);
  expect(library.ensure).toHaveBeenCalledWith(TRAIN_MODELS);
  expect(layer.root.children[1]!.children).toHaveLength(2);
  for (const train of layer.root.children[1]!.children) {
    expect(train.children).toHaveLength(2);
    expect(new THREE.Box3().setFromObject(train).getSize(new THREE.Vector3()).length()).toBeGreaterThan(1);
  }
  const dispose = vi.spyOn(geometry, 'dispose');
  layer.dispose();
  expect(dispose).not.toHaveBeenCalled();
});

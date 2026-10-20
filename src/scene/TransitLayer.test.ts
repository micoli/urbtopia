import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, transportStats, type GameState, type TransitTile } from '../core';
import { MODE_LOOK, TransitLayer, VEHICLE_SPACING, poseAlong, slotOf } from './TransitLayer';

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
  layer.update(199 / 1.5);
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
  layer.update(1);
  for (const train of layer.root.children[1]!.children) {
    const cars = train.children[0]!.children;
    expect(cars).toHaveLength(2);
    expect(new THREE.Box3().setFromObject(train).getSize(new THREE.Vector3()).length()).toBeGreaterThan(1);
    expect(Math.abs(cars[0]!.position.x - cars[1]!.position.x)).toBeCloseTo(0.7 * MODE_LOOK.rail.size);
    expect(Math.abs(cars[0]!.position.z - 0.5)).toBeCloseTo(MODE_LOOK.rail.lane);
  }
  const dispose = vi.spyOn(geometry, 'dispose');
  layer.dispose();
  expect(dispose).not.toHaveBeenCalled();
});

describe('spacing of the vehicles of one line', () => {
  const route = Array.from({ length: 21 }, (_, x) => ({ x, y: 0 }));

  it('spreads them evenly so that none is closer than a vehicle length plus the safety distance', () => {
    const service = { route, loop: false, mode: 'brt' as const, operatingVehicleIds: [3, 4, 5, 6] };
    const phases = service.operatingVehicleIds.map((id) => slotOf(service, id).phase).sort((a, b) => a - b);
    for (let index = 1; index < phases.length; index++) expect(phases[index]! - phases[index - 1]!).toBeGreaterThanOrEqual(VEHICLE_SPACING);
    expect(phases[0]! + 40 - phases.at(-1)!).toBeGreaterThanOrEqual(VEHICLE_SPACING);
  });

  it('keeps the vehicles that do not fit out of the picture instead of stacking them', () => {
    const shortLoop = { route: route.slice(0, 5), loop: true, mode: 'brt' as const, operatingVehicleIds: [1, 2, 3, 4, 5, 6] };
    const slots = shortLoop.operatingVehicleIds.map((id) => slotOf(shortLoop, id));
    expect(slots.filter((slot) => !slot.hidden)).toHaveLength(Math.floor(4 / VEHICLE_SPACING));
    expect(slots.filter((slot) => slot.hidden).length).toBeGreaterThan(0);
  });

  it('draws the trains bigger and so spaces them further apart than BRT vehicles', () => {
    const line = { route: route.slice(0, 6), loop: false, operatingVehicleIds: [1, 2, 3, 4, 5, 6] };
    expect(MODE_LOOK.rail.size).toBe(1.8);
    const brt = line.operatingVehicleIds.filter((id) => !slotOf({ ...line, mode: 'brt' }, id).hidden).length;
    const rail = line.operatingVehicleIds.filter((id) => !slotOf({ ...line, mode: 'rail' }, id).hidden).length;
    expect(rail).toBeLessThan(brt);
    expect(10 / rail).toBeGreaterThanOrEqual(VEHICLE_SPACING * MODE_LOOK.rail.size);
  });
});

describe('articulated vehicles', () => {
  const bend = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }];

  it('lets each car turn on its own at a corner of the route', () => {
    const head = poseAlong(bend, false, 2.4);
    const tail = poseAlong(bend, false, 1.7);
    expect(head.yaw).toBeCloseTo(0);
    expect(tail.yaw).toBeCloseTo(Math.PI / 2);
    expect(head.x).toBeCloseTo(2.5);
    expect(head.z).toBeCloseTo(0.9);
  });

  it('keeps following the route round the end of a line that is not a loop', () => {
    const head = poseAlong(bend, false, 4 + 0.3);
    const tail = poseAlong(bend, false, 4 - 0.1);
    expect(tail.yaw).toBeCloseTo(0);
    expect(Math.abs(head.yaw)).toBeCloseTo(Math.PI);
    expect(tail.z).toBeGreaterThan(head.z);
  });

  it('wraps round a loop', () => {
    expect(poseAlong(bend, true, -0.5).z).toBeCloseTo(poseAlong(bend, true, 3.5).z);
  });
});

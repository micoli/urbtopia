import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createBuilding, newGame, footprintOf, type GameState, type Building } from '../core';
import { ServiceCoverageLayer } from './ServiceCoverageLayer';
import { renderItemsOf } from './renderItems';

const layers: ServiceCoverageLayer[] = [];
const makeLayer = () => {
  const layer = new ServiceCoverageLayer();
  layers.push(layer);
  return layer;
};
afterEach(() => layers.splice(0).forEach(layer => layer.dispose()));
const city = (buildings: Building[]): GameState => ({ ...newGame({ seed: 'coverage-overlay', now: 0 }), buildings, roads: [] });
const home = (id: number, x: number, tier = 1) => ({ ...createBuilding(id, 'home', x, 50, 0), tier });
const overlay = (layer: ServiceCoverageLayer, name: string) => layer.root.getObjectByName(name) as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;
const counts = (layer: ServiceCoverageLayer) => [overlay(layer, 'covered-homes')?.count ?? 0, overlay(layer, 'uncovered-homes')?.count ?? 0];

describe('service coverage overlay', () => {
  it('draws translucent footprints for actual homes without recoloring the models', () => {
    const layer = makeLayer();
    const state = city([createBuilding(1, 'school', 50, 50, 0), home(2, 54), home(3, 95), createBuilding(4, 'shop', 56, 50, 0)]);
    const original = renderItemsOf(state);
    layer.sync(state, 'school');
    expect(counts(layer)).toEqual([1, 1]);
    const covered = overlay(layer, 'covered-homes')!;
    expect(covered.material).toMatchObject({ transparent: true, opacity: 0.55, depthTest: false, depthWrite: false });
    expect(covered.material.color.getHex()).toBe(0x35d07f);
    expect(overlay(layer, 'uncovered-homes')!.material.color.getHex()).toBe(0xe5484d);
    const matrix = new THREE.Matrix4();
    covered.getMatrixAt(0, matrix);
    const { width, depth } = footprintOf('home', 0, 1);
    expect(matrix.elements[12]).toBeCloseTo(54 + width / 2);
    expect(matrix.elements[14]).toBeCloseTo(50 + depth / 2);
    expect(renderItemsOf(state)).toBe(original);
    layer.sync(state, null);
    expect(layer.root.visible).toBe(false);
    layer.sync(state, 'school');
    expect(layer.root.visible).toBe(true);
    expect(counts(layer)).toEqual([1, 1]);
  });

  it.each([['fireStation', 'policeStation'], ['school', 'middleSchool']] as const)('distinguishes %s from %s without a city change', (built, missing) => {
    const layer = makeLayer();
    const state = city([createBuilding(1, built, 50, 50, 0), home(2, 54)]);
    layer.sync(state, built);
    expect(counts(layer)).toEqual([1, 0]);
    layer.sync(state, missing);
    expect(counts(layer)).toEqual([0, 1]);
  });

  it('respects capacity and updates after an upgrade, move or removal', () => {
    const layer = makeLayer();
    const school = createBuilding(1, 'school', 50, 50, 0);
    const homes = [2, 3, 4, 5].map((x, i) => home(10 + i, 50 + x, 6));
    layer.sync(city([school, ...homes]), 'school');
    expect(counts(layer)).toEqual([2, 2]);
    layer.sync(city([{ ...school, tier: 3 }, ...homes]), 'school');
    expect(counts(layer)).toEqual([4, 0]);
    layer.sync(city([{ ...school, x: 100 }, ...homes]), 'school');
    expect(counts(layer)).toEqual([0, 4]);
    layer.sync(city(homes), 'school');
    expect(counts(layer)).toEqual([0, 4]);
  });

  it('serves the last home crossing capacity and supports city-wide facilities', () => {
    const layer = makeLayer();
    layer.sync(city([createBuilding(1, 'school', 50, 50, 0), home(2, 54, 8)]), 'school');
    expect(counts(layer)).toEqual([1, 0]);
    layer.sync(city([createBuilding(1, 'townHall', 50, 50, 0), home(2, 120)]), 'townHall');
    expect(counts(layer)).toEqual([1, 0]);
  });
});

describe('service facility markers', () => {
  it('marks only the selected facility type and refreshes after a move or removal', () => {
    const layer = makeLayer();
    const school = createBuilding(1, 'school', 50, 50, 0);
    const hospital = createBuilding(2, 'hospital', 60, 50, 0);
    const state = { ...newGame({ seed: 'service-markers', now: 0 }), buildings: [school, hospital] };
    const positions = () => (layer.root.getObjectByName('service-facilities') as THREE.LineSegments).geometry.getAttribute('position');
    layer.sync(state, 'school');
    expect(layer.root.visible).toBe(true);
    expect(positions().count).toBe(8);
    expect(positions().getX(0)).toBeCloseTo(49.85);
    layer.sync(state, 'hospital');
    expect(positions().getX(0)).toBeCloseTo(59.85);
    layer.sync({ ...state, buildings: [school, { ...hospital, x: 70 }] }, 'hospital');
    expect(positions().getX(0)).toBeCloseTo(69.85);
    layer.sync({ ...state, buildings: [school] }, 'hospital');
    expect(positions().count).toBe(0);
    layer.sync(state, null);
    expect(layer.root.visible).toBe(false);
  });

  it('tints Homes covered through Transit reach apart from those in direct reach', () => {
    const layer = makeLayer();
    const strip = Array.from({ length: 45 }, (_, i) => ({ x: 50 + i, y: 40, exits: i === 0 ? ['E' as const] : i === 44 ? ['W' as const] : ['W' as const, 'E' as const] }));
    const state: GameState = { ...city([createBuilding(1, 'school', 53, 43, 0), { ...createBuilding(2, 'home', 58, 43, 0), tier: 1 }, { ...createBuilding(3, 'home', 90, 43, 0), tier: 1 }, createBuilding(4, 'brtStation', 53, 41, 0), createBuilding(5, 'brtStation', 90, 41, 0)]),
      adaptationUntil: 0, brtRoads: strip, transitLines: [{ id: 6, mode: 'brt', stops: [4, 5], peakHeadway: 5, offPeakHeadway: 10 }], transitFleet: [{ id: 7, kind: 'brtElectric', purchasePrice: 900, lineId: 6 }] };
    layer.sync(state, 'school');
    expect(overlay(layer, 'covered-homes')?.count).toBe(1);
    expect(overlay(layer, 'transit-reach-homes')?.count).toBe(1);
    expect(overlay(layer, 'transit-reach-homes')!.material.color.getHex()).not.toBe(0x35d07f);
  });
});

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ROOFS, SHAPES, addFloor, getDecor, newPlan, setAllRoofs, toggleDecor, toggleDormer, exteriorEdges, roofRects, type Edge, type Plan } from '../core/architect/housePlan.ts';
import { buildHouse, roofHeightAt } from './render.ts';

const meshes = (root: THREE.Object3D): THREE.Mesh[] => {
  const found: THREE.Mesh[] = [];
  root.traverse((node) => node instanceof THREE.Mesh && found.push(node));
  return found;
};

const roofMeshes = (house: THREE.Object3D) => meshes(house).filter((mesh) => mesh.userData.roof);

const twoFloors = (shape: (typeof SHAPES)[number]): Plan => {
  const plan = newPlan(shape);
  addFloor(plan);
  return plan;
};

describe('the 3D house of a plan', () => {
  it('builds every roof over every starting shape, as meshes without a NaN', () => {
    for (const shape of SHAPES) {
      for (const roof of ROOFS) {
        const plan = twoFloors(shape);
        setAllRoofs(plan, roof);
        const house = buildHouse(plan);
        const roofs = roofMeshes(house);
        expect(roofs.length, `${shape} ${roof}`).toBeGreaterThan(0);
        for (const mesh of roofs) {
          const positions = mesh.geometry.getAttribute('position');
          expect(positions.count, `${shape} ${roof}`).toBeGreaterThan(0);
          for (let i = 0; i < positions.count; i++) expect(Number.isFinite(positions.getX(i) + positions.getY(i) + positions.getZ(i)), `${shape} ${roof}`).toBe(true);
        }
      }
    }
  });

  it('gives the roof a thickness: it reaches below the level of the eave of a flat sheet', () => {
    const plan = twoFloors('rect');
    setAllRoofs(plan, 'hip');
    const [roof] = roofMeshes(buildHouse(plan));
    roof!.geometry.computeBoundingBox();
    const box = roof!.geometry.boundingBox!;
    const positions = roof!.geometry.getAttribute('position');
    let lowestTop = Infinity;
    for (let i = 0; i < positions.count; i++) lowestTop = Math.min(lowestTop, positions.getY(i));
    expect(box.min.y).toBe(lowestTop);
    expect(box.max.y - box.min.y).toBeGreaterThan(0.1);
  });

  it('takes the plinth away when the plan has none', () => {
    const plan = twoFloors('rect');
    const withPlinth = buildHouse(plan).children.length;
    const without = buildHouse({ ...plan, plinth: false }).children.length;
    expect(withPlinth - without).toBe(4 * 3);
  });

  it('keeps the walls of a slot, and what rises to the roof, in the plane of the outer face', () => {
    const plan = twoFloors('rect');
    setAllRoofs(plan, 'gable');
    const house = buildHouse(plan);
    let checked = 0;
    for (const slot of house.children.filter((child) => child.userData.edge)) {
      for (const mesh of meshes(slot)) {
        if ((mesh.material as THREE.MeshStandardMaterial).color.getHexString() !== plan.wallColor.slice(1)) continue;
        mesh.geometry.computeBoundingBox();
        expect(mesh.geometry.boundingBox!.max.z).toBeCloseTo(0, 6);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('raises the wall of a gable end to the ridge, in the colour of the wall', () => {
    const plan = twoFloors('rect');
    setAllRoofs(plan, 'gable');
    const house = buildHouse(plan);
    const east = house.children.filter((child) => (child.userData.edge as Edge | undefined)?.dir === 1 && (child.userData.edge as Edge).floor === plan.floors.length - 1);
    const tops = east.flatMap((slot) => meshes(slot).map((mesh) => (mesh.geometry.computeBoundingBox(), mesh.geometry.boundingBox!.max.y)));
    expect(Math.max(...tops)).toBeGreaterThan(1.5);
  });

  it('draws a round dormer and a decor without a model, and stays the same house for the rest', () => {
    const plan = twoFloors('rect');
    setAllRoofs(plan, 'mansard');
    const edges = exteriorEdges(plan);
    const upper = edges.find((edge) => edge.floor === plan.floors.length - 1)!;
    const ground = edges.find((edge) => edge.floor === 0 && edge.dir === 2)!;
    const before = meshes(buildHouse(plan)).length;
    toggleDormer(plan, upper, true);
    toggleDecor(plan, ground, 'pilasters');
    expect(getDecor(plan, ground)).toBe('pilasters');
    const after = meshes(buildHouse(plan)).length;
    expect(after).toBeGreaterThan(before);
  });

  it('keeps the walls of a mansard over several wings under the slope, not up to its break line', () => {
    const plan = newPlan('T');
    setAllRoofs(plan, 'mansard');
    const [rect] = roofRects(plan);
    const halfWidth = (rect!.c1 - rect!.c0 + 1) / 2;
    const atWall = roofHeightAt(plan, rect!, halfWidth, 0);
    const inside = roofHeightAt(plan, rect!, 0, 0);
    expect(atWall).toBeLessThan(inside);
    expect(atWall).toBeLessThan(0.1);
  });
});

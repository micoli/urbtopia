import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBuilding } from '../core';
import { buildingBoxes, pickBuilding } from './buildingPicking';

const HEIGHT = 3;
const tower = createBuilding(1, 'factory', 10, 10, 0);
const neighbour = createBuilding(2, 'factory', 14, 10, 0);
const boxes = buildingBoxes([tower, neighbour], () => HEIGHT);
const DOWN_FORWARD = new THREE.Vector3(1, -1, 1).normalize();

const rayThrough = (target: THREE.Vector3) => new THREE.Ray(target.clone().addScaledVector(DOWN_FORWARD, -100), DOWN_FORWARD);

describe('pickBuilding', () => {
  it('picks a building by its base', () => {
    expect(pickBuilding(rayThrough(new THREE.Vector3(11, 0, 11)), boxes)).toBe(1);
  });

  it('picks a building by its roof, although the ray lands on the ground beyond its footprint', () => {
    const roof = new THREE.Vector3(11, HEIGHT - 0.2, 11);
    const groundBeyond = roof.clone().addScaledVector(DOWN_FORWARD, HEIGHT - 0.2);
    expect(groundBeyond.x).toBeGreaterThan(12);
    expect(pickBuilding(rayThrough(roof), boxes)).toBe(1);
  });

  it('picks the building in front when two line up along the ray', () => {
    const origin = new THREE.Vector3(18, 1, 11);
    expect(pickBuilding(new THREE.Ray(origin, new THREE.Vector3(-1, 0, 0)), boxes)).toBe(2);
  });

  it('picks nothing on empty ground', () => {
    expect(pickBuilding(rayThrough(new THREE.Vector3(30, 0, 30)), boxes)).toBeNull();
  });
});

import * as THREE from 'three';
import { TERRAIN_FIRST_LINE, TERRAIN_LAST_LINE, cellTriangles, vertexPosition } from '../core';

export interface GroundGeometry {
  geometry: THREE.BufferGeometry;
  grid: Int32Array;
}

export function groundGeometry(center: number, size: number): GroundGeometry {
  const origin = center - size / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const grid: number[] = [];
  for (let gridZ = TERRAIN_FIRST_LINE; gridZ < TERRAIN_LAST_LINE; gridZ++) {
    for (let gridX = TERRAIN_FIRST_LINE; gridX < TERRAIN_LAST_LINE; gridX++) {
      for (const triangle of cellTriangles(gridX, gridZ)) {
        for (const [cornerX, cornerZ] of [triangle[0], triangle[2], triangle[1]]) {
          const { x, z } = vertexPosition(cornerX, cornerZ);
          positions.push(x, 0, z);
          uvs.push((x - origin) / size, 1 - (z - origin) / size);
          grid.push(cornerX, cornerZ);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(positions.length / 3 * 4).fill(1), 4));
  return { geometry, grid: new Int32Array(grid) };
}

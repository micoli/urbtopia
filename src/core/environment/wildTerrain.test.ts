import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../engine/config';
import { TERRAIN_FIRST_LINE, TERRAIN_LAST_LINE, cellTriangles, vertexPosition, wildTerrain } from './wildTerrain';

const OWNED = GAME_CONFIG.startingParcels;
const SIZE = GAME_CONFIG.parcelSizeInTiles;

const areaOf = (triangle: ReturnType<typeof cellTriangles>[number]) => {
  const [p, q, r] = triangle.map(([gridX, gridZ]) => vertexPosition(gridX, gridZ)) as [{ x: number; z: number }, { x: number; z: number }, { x: number; z: number }];
  return Math.abs((q.x - p.x) * (r.z - p.z) - (r.x - p.x) * (q.z - p.z)) / 2;
};

describe('wildTerrain', () => {
  it('is flat on every owned Parcel, edges included', () => {
    const terrain = wildTerrain('amber-fox-4821', OWNED);
    for (const parcel of OWNED) {
      for (let x = parcel.x * SIZE; x <= (parcel.x + 1) * SIZE; x += 1.5) {
        for (let z = parcel.y * SIZE; z <= (parcel.y + 1) * SIZE; z += 1.5) expect(terrain.heightAt(x, z)).toBeCloseTo(0, 9);
      }
    }
  });

  it('rises on the Wild land, stays low inside the map and higher on the rim', () => {
    const terrain = wildTerrain('amber-fox-4821', OWNED);
    const heights = (from: number, to: number) => {
      const out: number[] = [];
      for (let x = from; x < to; x += 3) for (let z = from; z < to; z += 3) out.push(terrain.heightAt(x, z));
      return out;
    };
    const inside = heights(64, 128);
    const rim = heights(-40, -8);
    expect(Math.max(...inside)).toBeGreaterThan(0);
    expect(Math.max(...inside)).toBeLessThan(3.5);
    expect(Math.max(...rim)).toBeGreaterThan(Math.max(...inside) * 0.9);
  });

  it('flattens a Parcel as soon as it is bought, and only the land it touches', () => {
    const before = wildTerrain('amber-fox-4821', OWNED);
    const bought = { x: 5, y: 5 };
    const after = wildTerrain('amber-fox-4821', [...OWNED, bought]);
    expect(after.heightAt(5 * SIZE + 8, 5 * SIZE + 8)).toBeCloseTo(0, 9);
    expect(after.heightAt(0, 100)).toBe(before.heightAt(0, 100));
  });

  it('keeps the vertices where they are whoever owns what, so only the heights move', () => {
    expect(vertexPosition(7, 11)).toEqual(vertexPosition(7, 11));
    for (const [gridX, gridZ] of [[3, 7], [6, -4], [9, 12]] as const) {
      const { x, z } = vertexPosition(gridX, gridZ);
      if (gridX % 3 === 0) expect(x).toBe(Math.floor(gridX / 3) * SIZE);
      if (gridZ % 3 === 0) expect(z).toBe(Math.floor(gridZ / 3) * SIZE);
    }
  });

  it('reads back the vertex heights at the vertices, whatever the diagonal', () => {
    const terrain = wildTerrain('amber-fox-4821', OWNED);
    for (const [gridX, gridZ] of [[3, 9], [4, 9], [20, -3], [21, -3], [30, 22]] as const) {
      const { x, z } = vertexPosition(gridX, gridZ);
      expect(terrain.heightAt(x, z)).toBeCloseTo(terrain.vertexHeight(gridX, gridZ), 6);
    }
  });

  it('covers the plane with triangles of very different sizes', () => {
    const areas: number[] = [];
    for (let gridZ = TERRAIN_FIRST_LINE; gridZ < TERRAIN_LAST_LINE; gridZ++) {
      for (let gridX = TERRAIN_FIRST_LINE; gridX < TERRAIN_LAST_LINE; gridX++) areas.push(...cellTriangles(gridX, gridZ).map(areaOf));
    }
    expect(Math.min(...areas)).toBeGreaterThan(0.5);
    expect(Math.max(...areas) / Math.min(...areas)).toBeGreaterThan(4);
    expect(areas.reduce((sum, area) => sum + area, 0)).toBeCloseTo(256 * 256, 0);
  });

  it('gives the same relief for the same seed', () => {
    expect(wildTerrain('s', OWNED).heightAt(100, 20)).toBe(wildTerrain('s', OWNED).heightAt(100, 20));
  });
});

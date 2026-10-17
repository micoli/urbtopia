import { GAME_CONFIG } from '../engine/config';
import { hashSeed } from '../engine/random';
import type { ParcelCoord } from '../engine/state';
import { WILD_RIM_TILES, wildNoiseAt } from './wildScenery';

const LINES_PER_PARCEL = 3;
const VERTEX_JITTER = 1.0;

const SIZE = GAME_CONFIG.parcelSizeInTiles;
const MAP_TILES = GAME_CONFIG.mapSizeInParcels * SIZE;
const INSIDE_AMPLITUDE = 1.1;
const RIM_AMPLITUDE = 3.4;

function hash(key: string): number {
  return hashSeed(`terrain-grid:${key}`) / 4294967296;
}

export function isFlippedCell(gridX: number, gridZ: number): boolean {
  return hash(`flip:${gridX},${gridZ}`) < 0.5;
}

function lineAt(axis: 'x' | 'z', index: number): number {
  const parcel = Math.floor(index / LINES_PER_PARCEL);
  const step = index - parcel * LINES_PER_PARCEL;
  const offsets = [0, 0.2 + 0.22 * hash(`${axis}1:${index}`), 0.58 + 0.22 * hash(`${axis}2:${index}`)];
  return (parcel + offsets[step]!) * SIZE;
}

function lineIndexOf(axis: 'x' | 'z', coordinate: number): number {
  const parcel = Math.floor(coordinate / SIZE);
  const first = parcel * LINES_PER_PARCEL;
  if (coordinate >= lineAt(axis, first + 2)) return first + 2;
  return coordinate >= lineAt(axis, first + 1) ? first + 1 : first;
}

type Corner = readonly [gridX: number, gridZ: number];

export function cellTriangles(gridX: number, gridZ: number): readonly (readonly [Corner, Corner, Corner])[] {
  const a: Corner = [gridX, gridZ];
  const b: Corner = [gridX + 1, gridZ];
  const c: Corner = [gridX + 1, gridZ + 1];
  const d: Corner = [gridX, gridZ + 1];
  return isFlippedCell(gridX, gridZ) ? [[a, b, d], [b, c, d]] : [[a, b, c], [a, c, d]];
}

function interpolate(triangle: readonly [Corner, Corner, Corner], x: number, z: number, heightOf: (gridX: number, gridZ: number) => number): number | null {
  const [p, q, r] = triangle.map(([gridX, gridZ]) => ({ ...vertexPosition(gridX, gridZ), y: heightOf(gridX, gridZ) })) as [{ x: number; z: number; y: number }, { x: number; z: number; y: number }, { x: number; z: number; y: number }];
  const determinant = (q.z - r.z) * (p.x - r.x) + (r.x - q.x) * (p.z - r.z);
  const u = ((q.z - r.z) * (x - r.x) + (r.x - q.x) * (z - r.z)) / determinant;
  const v = ((r.z - p.z) * (x - r.x) + (p.x - r.x) * (z - r.z)) / determinant;
  const w = 1 - u - v;
  const epsilon = -1e-9;
  if (u < epsilon || v < epsilon || w < epsilon) return null;
  return u * p.y + v * q.y + w * r.y;
}

function jitterOf(seed: string, gridX: number, gridZ: number): number {
  return wildNoiseAt(`${seed}:facet`, gridX * 91.7, gridZ * 57.3) - 0.5;
}

function ownedKeys(ownedParcels: readonly ParcelCoord[]): Set<string> {
  return new Set(ownedParcels.map(parcel => `${parcel.x},${parcel.y}`));
}

function touchesOwned(owned: ReadonlySet<string>, x: number, z: number): boolean {
  for (const px of [Math.floor((x - 0.5) / SIZE), Math.floor((x + 0.5) / SIZE)]) {
    for (const pz of [Math.floor((z - 0.5) / SIZE), Math.floor((z + 0.5) / SIZE)]) {
      if (owned.has(`${px},${pz}`)) return true;
    }
  }
  return false;
}

function rimDepth(x: number, z: number): number {
  const outside = Math.max(-x, x - MAP_TILES, -z, z - MAP_TILES);
  return Math.min(1, Math.max(0, outside / WILD_RIM_TILES));
}

export interface WildTerrain {
  heightAt: (x: number, z: number) => number;
  vertexHeight: (gridX: number, gridZ: number) => number;
}

export const TERRAIN_FIRST_LINE = -4 * LINES_PER_PARCEL;
export const TERRAIN_LAST_LINE = (GAME_CONFIG.mapSizeInParcels + 4) * LINES_PER_PARCEL;

export function vertexPosition(gridX: number, gridZ: number): { x: number; z: number } {
  const edgeX = gridX % LINES_PER_PARCEL === 0;
  const edgeZ = gridZ % LINES_PER_PARCEL === 0;
  const x = lineAt('x', gridX);
  const z = lineAt('z', gridZ);
  if (edgeX && edgeZ) return { x, z };
  const jitterX = (hash(`jx:${gridX},${gridZ}`) - 0.5) * 2 * VERTEX_JITTER;
  const jitterZ = (hash(`jz:${gridX},${gridZ}`) - 0.5) * 2 * VERTEX_JITTER;
  return { x: x + (edgeX ? 0 : jitterX), z: z + (edgeZ ? 0 : jitterZ) };
}

export function wildTerrain(seed: string, ownedParcels: readonly ParcelCoord[]): WildTerrain {
  const owned = ownedKeys(ownedParcels);
  const cache = new Map<string, number>();
  const vertexHeight = (gridX: number, gridZ: number): number => {
    const key = `${gridX},${gridZ}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const { x, z } = vertexPosition(gridX, gridZ);
    const amplitude = INSIDE_AMPLITUDE + (RIM_AMPLITUDE - INSIDE_AMPLITUDE) * rimDepth(x, z);
    const height = touchesOwned(owned, x, z) ? 0 : Math.max(0, (Math.max(0, wildNoiseAt(seed, x * 1.7 + 311, z * 1.7 - 97) - 0.3) * 1.6 + jitterOf(seed, gridX, gridZ) * 0.35) * amplitude);
    cache.set(key, height);
    return height;
  };
  const heightAt = (x: number, z: number): number => {
    const column = lineIndexOf('x', x);
    const row = lineIndexOf('z', z);
    for (let gridZ = row - 1; gridZ <= row + 1; gridZ++) {
      for (let gridX = column - 1; gridX <= column + 1; gridX++) {
        for (const triangle of cellTriangles(gridX, gridZ)) {
          const height = interpolate(triangle, x, z, vertexHeight);
          if (height !== null) return height;
        }
      }
    }
    return 0;
  };
  return { heightAt, vertexHeight };
}

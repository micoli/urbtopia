import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../engine/config';
import { SCENERY_MODELS, WILD_RIM_TILES, wildScenery } from './wildScenery';
import { BUILDING_ENTRIES, NATURE_ENTRIES } from '../buildings/buildingDefinitions';

const TREE_MODELS = NATURE_ENTRIES.filter(entry => entry.scenery === 'broadleaf' || entry.scenery === 'conifer').map(entry => entry.model);
const OWNED = GAME_CONFIG.startingParcels;
const SIZE = GAME_CONFIG.parcelSizeInTiles;
const MAP = GAME_CONFIG.mapSizeInParcels * SIZE;

const ownedAt = (owned: readonly { x: number; y: number }[], x: number, z: number) => owned.some(parcel => parcel.x === Math.floor(x / SIZE) && parcel.y === Math.floor(z / SIZE));

describe('wildScenery', () => {
  it('gives the same scenery for the same city seed', () => {
    expect(wildScenery('amber-fox-4821', OWNED)).toEqual(wildScenery('amber-fox-4821', OWNED));
  });

  it('gives another look to another city', () => {
    expect(wildScenery('amber-fox-4821', OWNED)).not.toEqual(wildScenery('quiet-gecko-8233', OWNED));
  });

  it('keeps every piece off the owned Parcels', () => {
    for (const piece of wildScenery('amber-fox-4821', OWNED)) expect(ownedAt(OWNED, piece.x, piece.z)).toBe(false);
  });

  it('removes the scenery of a Parcel as soon as it is bought, and nothing else', () => {
    const before = wildScenery('amber-fox-4821', OWNED);
    const bought = { x: 5, y: 5 };
    const after = wildScenery('amber-fox-4821', [...OWNED, bought]);
    const kept = before.filter(piece => !ownedAt([bought], piece.x, piece.z));
    expect(after).toEqual(kept);
    expect(before.length).toBeGreaterThan(after.length);
  });

  it('closes the map with a rim and stays inside the render budget', () => {
    const pieces = wildScenery('amber-fox-4821', OWNED);
    const outside = pieces.filter(piece => piece.x < 0 || piece.z < 0 || piece.x > MAP || piece.z > MAP);
    expect(outside.length).toBeGreaterThan(300);
    expect(pieces.length).toBeLessThan(12000);
    for (const piece of pieces) {
      expect(piece.x).toBeGreaterThanOrEqual(-WILD_RIM_TILES - 4);
      expect(piece.x).toBeLessThanOrEqual(MAP + WILD_RIM_TILES + 4);
    }
  });

  it.each(['amber-fox-4821', 'quiet-gecko-8233', 'calm-owl-17', 'swift-lynx-902'])('leaves no bare area on the Wild land of %s: every 16-tile block is well wooded', seed => {
    const pieces = wildScenery(seed, OWNED);
    const counts = new Map<string, number>();
    for (const piece of pieces) {
      const key = `${Math.floor(piece.x / SIZE)},${Math.floor(piece.z / SIZE)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (let x = -2; x < GAME_CONFIG.mapSizeInParcels + 2; x++) {
      for (let z = -2; z < GAME_CONFIG.mapSizeInParcels + 2; z++) {
        if (OWNED.some(parcel => parcel.x === x && parcel.y === z)) continue;
        expect(counts.get(`${x},${z}`) ?? 0, `${x},${z}`).toBeGreaterThanOrEqual(12);
      }
    }
  });

  it('thins the trees and drops the small pieces on a light budget, keeping a subset of the full scenery', () => {
    const full = wildScenery('amber-fox-4821', OWNED, 'full');
    const light = wildScenery('amber-fox-4821', OWNED, 'light');
    const key = (piece: (typeof full)[number]) => `${piece.model}@${piece.x},${piece.z}`;
    const fullKeys = new Set(full.map(key));
    expect(light.length).toBeLessThan(full.length * 0.7);
    expect(light.every(piece => fullKeys.has(key(piece)))).toBe(true);
    expect(light.length).toBeGreaterThan(full.length * 0.3);
  });

  it('draws the trees four ninths of the model size in every direction', () => {
    const trees = wildScenery('amber-fox-4821', OWNED).filter(piece => TREE_MODELS.includes(piece.model));
    expect(trees.length).toBeGreaterThan(1000);
    for (const tree of trees) {
      expect(tree.scale).toBeGreaterThanOrEqual(0.75 * (4 / 9) - 1e-9);
      expect(tree.scale).toBeLessThanOrEqual(1.35 * 1.5 * (4 / 9) + 1e-9);
    }
  });

  it('only uses existing nature models', () => {
    const ids = new Set(BUILDING_ENTRIES.map(entry => entry.model));
    for (const model of SCENERY_MODELS) expect(ids.has(model), model).toBe(true);
    expect(new Set(wildScenery('amber-fox-4821', OWNED).map(piece => piece.model)).size).toBeGreaterThan(4);
  });
});

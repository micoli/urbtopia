import { wildScenery, wildTerrain, type GameState, type SceneryDetail } from '../core';
import { modelFileOf } from '../core/models/modelFiles';
import { ChunkedWorld } from './ChunkedWorld';
import type { ModelLibrary } from './modelLibrary';
import type { RenderItem } from './renderItems';

const SCENERY_CHUNK_TILES = 32;

export class WildScenery {
  private world: ChunkedWorld;
  private signature = '';

  constructor(private library: ModelLibrary, private detail: SceneryDetail) {
    this.world = new ChunkedWorld(library, SCENERY_CHUNK_TILES);
  }

  get root() {
    return this.world.root;
  }

  async sync(state: Pick<GameState, 'seed' | 'ownedParcels'>): Promise<void> {
    const signature = `${state.seed}|${state.ownedParcels.map(parcel => `${parcel.x},${parcel.y}`).join(';')}`;
    if (signature === this.signature) return;
    this.signature = signature;
    const terrain = wildTerrain(state.seed, state.ownedParcels);
    const items: RenderItem[] = wildScenery(state.seed, state.ownedParcels, this.detail).map(piece => ({ model: modelFileOf(piece.model), x: piece.x, z: piece.z, rotation: 0, yaw: piece.yaw, scale: piece.scale, elevation: terrain.heightAt(piece.x, piece.z) }));
    await this.library.ensure(items.map(item => item.model));
    if (signature === this.signature) this.world.sync(items);
  }
}

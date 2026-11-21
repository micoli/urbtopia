import * as THREE from 'three';
import type { Plan } from '../core/architect/housePlan.ts';
import { buildHouse } from './render.ts';
import { loadSlotModels } from './slotModels.ts';

// A cell of the studio is half a tile of the game on each side, a quarter of a tile in area; the house keeps its shape.
export const GAME_CELL_SIZE = 0.25;

// The house as built in the studio, centred on its footprint with the ground floor at y = 0, at the scale of the game.
export async function buildGameHouse(plan: Plan): Promise<THREE.Group> {
  await loadSlotModels();
  const house = buildHouse(plan);
  const box = new THREE.Box3().setFromObject(house);
  house.position.set(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
  house.position.multiplyScalar(GAME_CELL_SIZE);
  house.scale.setScalar(GAME_CELL_SIZE);
  const root = new THREE.Group();
  root.add(house);
  root.updateMatrixWorld(true);
  return root;
}

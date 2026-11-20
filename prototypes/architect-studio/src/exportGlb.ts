import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { Plan } from './model.ts';
import { buildHouse } from './render.ts';
import { loadSlotModels } from './slotModels.ts';

// Height of one floor in the game's urbtopia houses (`floor_height` of `building_lib`), against 1 in the studio.
export const GAME_FLOOR_HEIGHT = 0.26;

// The house as built in the studio, one tile per world unit across, centred on its footprint with the ground floor at y = 0.
// Heights (floors, roofs, openings) are scaled to the floor height of the game; the footprint is left as drawn.
export async function exportPlanGlb(plan: Plan): Promise<Blob> {
  await loadSlotModels();
  const house = buildHouse(plan);
  const box = new THREE.Box3().setFromObject(house);
  house.position.set(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
  house.scale.y = GAME_FLOOR_HEIGHT;
  const root = new THREE.Group();
  root.add(house);
  root.updateMatrixWorld(true);
  const glb = await new GLTFExporter().parseAsync(root, { binary: true });
  return new Blob([glb as ArrayBuffer], { type: 'model/gltf-binary' });
}

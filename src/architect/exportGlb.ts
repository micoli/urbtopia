import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { Plan } from '../core/architect/housePlan.ts';
import { buildGameHouse } from './gameHouse.ts';

export async function exportPlanGlb(plan: Plan): Promise<Blob> {
  const glb = await new GLTFExporter().parseAsync(await buildGameHouse(plan), { binary: true });
  return new Blob([glb as ArrayBuffer], { type: 'model/gltf-binary' });
}

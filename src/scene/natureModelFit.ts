import * as THREE from 'three';
import { NATURE_MODELS, type NatureFamily } from '../core/environment/nature';

const familiesByModel = new Map<string, NatureFamily>(NATURE_MODELS.map(([, model, family]) => [model, family]));
const limits: Record<NatureFamily, { width: number; height: number }> = {
  tree: { width: 0.85, height: 2.5 },
  conifer: { width: 0.85, height: 2.8 },
  palm: { width: 0.85, height: 2.8 },
  shrub: { width: 0.7, height: 1 },
  flower: { width: 0.55, height: 0.5 },
  grass: { width: 0.85, height: 0.35 },
  habitat: { width: 0.8, height: 0.8 },
};

export function fitNatureModel(model: THREE.Object3D, key: string): void {
  const family = familiesByModel.get(key);
  if (!family) return;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  if (bounds.isEmpty()) return;
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const limit = limits[family];
  const scale = Math.min(limit.width / Math.max(size.x, size.z, 0.001), limit.height / Math.max(size.y, 0.001));
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
}

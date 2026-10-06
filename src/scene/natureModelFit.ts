import * as THREE from 'three';
import { definitionOf } from './modelDefinitions';

export function fitNatureModel(model: THREE.Object3D, key: string): void {
  const limit = definitionOf(key)?.fit;
  if (!limit) return;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  if (bounds.isEmpty()) return;
  const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(limit.width / Math.max(size.x, size.z, 0.001), limit.height / Math.max(size.y, 0.001));
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
}

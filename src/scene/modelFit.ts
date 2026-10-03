import * as THREE from 'three';

interface ModelFit {
  scale: number;
  centerX: number;
  centerZ: number;
}

const MODEL_FIT: Record<string, ModelFit> = {
  'industrial/building-h': { scale: 1.45, centerX: -0.58, centerZ: 0.28 },
};

const IDENTITY = new THREE.Matrix4();

export function fitMatrixOf(model: string): THREE.Matrix4 {
  if (model === 'trains/railroad-straight') return new THREE.Matrix4().makeScale(.7, 1, .25).multiply(new THREE.Matrix4().makeTranslation(0, 1, -2));
  if (model === 'trains/railroad-corner-small') return new THREE.Matrix4().makeTranslation(0, 1, 0);
  const fit = MODEL_FIT[model];
  if (!fit) return IDENTITY;
  return new THREE.Matrix4().makeScale(fit.scale, fit.scale, fit.scale).multiply(new THREE.Matrix4().makeTranslation(-fit.centerX, 0, -fit.centerZ));
}

import * as THREE from 'three';
import { definitionOf } from './modelDefinitions';

const IDENTITY = new THREE.Matrix4();

export function fitMatrixOf(model: string): THREE.Matrix4 {
  if (model === 'trains/railroad-straight') return new THREE.Matrix4().makeScale(.7, 1, .25).multiply(new THREE.Matrix4().makeTranslation(0, 1, -2));
  if (model === 'trains/railroad-corner-small') return new THREE.Matrix4().makeTranslation(0, 1, 0);
  const definition = definitionOf(model);
  if (definition?.scale === undefined || definition.fit) return IDENTITY;
  const [centerX, centerZ] = definition.center ?? [0, 0];
  return new THREE.Matrix4().makeScale(definition.scale, definition.scale, definition.scale).multiply(new THREE.Matrix4().makeTranslation(-centerX, 0, -centerZ));
}

const FOOTPRINT_FILL = 0.9;
const HEIGHT_GROWTH = 0.3;

export function facilityScaleOf(box: THREE.Box3, footprint: number): { horizontal: number; vertical: number } {
  const width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
  const horizontal = (footprint * FOOTPRINT_FILL) / width;
  return { horizontal, vertical: horizontal <= 1 ? horizontal : 1 + HEIGHT_GROWTH * (horizontal - 1) };
}

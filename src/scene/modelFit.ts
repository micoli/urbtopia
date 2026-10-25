import * as THREE from 'three';
import { RAIL_CORNER_MODEL, RAIL_STRAIGHT_MODEL } from '../core/infrastructure/infrastructure';
import { definitionOf } from './modelDefinitions';

const IDENTITY = new THREE.Matrix4();
const MANAGED_MARGIN = 0.03;
const MANAGED_INSET = new THREE.Matrix4().makeScale(1 - 2 * MANAGED_MARGIN, 1, 1 - 2 * MANAGED_MARGIN);
const turnedBy = (degrees: number) => new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(degrees));

export function fitMatrixOf(model: string): THREE.Matrix4 {
  if (model === RAIL_STRAIGHT_MODEL) return new THREE.Matrix4().makeScale(.7, 1, .25).multiply(new THREE.Matrix4().makeTranslation(0, 1, -2));
  if (model === RAIL_CORNER_MODEL) return new THREE.Matrix4().makeTranslation(0, 1, 0);
  const definition = definitionOf(model);
  if (definition?.source === 'managed') {
    const size = definition.scale ?? 1;
    const fitted = definition.flush ? turnedBy(definition.rotationOffset ?? 0) : MANAGED_INSET.clone().multiply(turnedBy(definition.rotationOffset ?? 0));
    return new THREE.Matrix4().makeScale(size, size, size).multiply(fitted);
  }
  if (definition?.scale === undefined || definition.fit) return IDENTITY;
  const [centerX, centerZ] = definition.center ?? [0, 0];
  const rotation = turnedBy(definition.rotationOffset ?? 0);
  return new THREE.Matrix4().makeScale(definition.scale, definition.scale, definition.scale).multiply(rotation).multiply(new THREE.Matrix4().makeTranslation(-centerX, 0, -centerZ));
}

const FOOTPRINT_FILL = 0.9;
const HEIGHT_GROWTH = 0.3;

export function facilityScaleOf(box: THREE.Box3, footprint: number): { horizontal: number; vertical: number } {
  const width = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
  const horizontal = (footprint * FOOTPRINT_FILL) / width;
  return { horizontal, vertical: horizontal <= 1 ? horizontal : 1 + HEIGHT_GROWTH * (horizontal - 1) };
}

import * as THREE from 'three'
import type { ModelDefinition } from '../../../src/scene/modelDefinitions'
import type { ModelInfo } from './modelLoader'

export function footprintOf(info: ModelInfo, definition?: ModelDefinition): { width: number; depth: number } {
  const fixed = definition?.footprint
  return { width: fixed?.[0] ?? Math.max(1, Math.ceil(info.size.x - 0.15)), depth: fixed?.[1] ?? Math.max(1, Math.ceil(info.size.z - 0.15)) }
}

// Mirrors how the game places a model: fit limits (natureModelFit) or scale and center (modelFit), plus the rotation offset.
export function fitted(model: THREE.Object3D, definition?: ModelDefinition): THREE.Object3D {
  if (!definition) return model
  const placed = new THREE.Group()
  placed.add(model)
  placed.rotation.y = THREE.MathUtils.degToRad(definition.rotationOffset ?? 0)
  const { fit, scale, center } = definition
  if (fit) {
    const bounds = new THREE.Box3().setFromObject(model)
    if (bounds.isEmpty()) return placed
    const size = bounds.getSize(new THREE.Vector3()), middle = bounds.getCenter(new THREE.Vector3())
    placed.scale.setScalar(Math.min(fit.width / Math.max(size.x, size.z, 0.001), fit.height / Math.max(size.y, 0.001)))
    model.position.set(-middle.x, -bounds.min.y, -middle.z)
    return placed
  }
  if (!scale) return placed
  placed.scale.setScalar(scale)
  if (center) model.position.set(-center[0], 0, -center[1])
  return placed
}

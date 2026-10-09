import * as THREE from 'three'
import type { ModelDefinition } from '../../../../src/scene/modelDefinitions'
import { fitted } from '../fitted'
import { loadModel } from '../modelLoader'

const SIZE = 160

let renderer: THREE.WebGLRenderer | null = null
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 500)
const sun = new THREE.DirectionalLight(0xffffff, 1.8)
sun.position.set(5, 10, 4)
scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 2), sun)

const cache = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

const rendererOf = () => {
  renderer ??= new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(SIZE, SIZE, false)
  return renderer
}

async function render(pack: string, name: string, definition: ModelDefinition | undefined): Promise<string> {
  const { root } = await loadModel(pack, name)
  const model = fitted(root.clone(true), definition)
  scene.add(model)
  const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(0.05, sphere.radius)
  Object.assign(camera, { left: -radius, right: radius, top: radius, bottom: -radius })
  camera.position.copy(sphere.center).add(new THREE.Vector3(1, 0.9, 1).normalize().multiplyScalar(radius * 4))
  camera.lookAt(sphere.center)
  camera.updateProjectionMatrix()
  const target = rendererOf()
  target.render(scene, camera)
  scene.remove(model)
  return target.domElement.toDataURL('image/png')
}

// One shared offscreen renderer draws thumbnails one after the other, each model once per session.
export function thumbnailOf(file: string, pack: string, name: string, definition: ModelDefinition | undefined): Promise<string> {
  const cached = cache.get(file)
  if (cached) return cached
  const drawn = queue.then(() => render(pack, name, definition)).catch(() => '')
  queue = drawn
  cache.set(file, drawn)
  return drawn
}

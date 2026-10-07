import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ModelLibrary } from '../../../src/scene/modelLibrary'
import type { ModelDefinition } from '../../../src/scene/modelDefinitions'
import { fitted, footprintOf } from './fitted'
import { loadModel, type ModelInfo } from './modelLoader'

const library = new ModelLibrary()
const HEX = /^#[0-9a-f]{6}$/i

const arrow = (direction: THREE.Vector3, color: number) => new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0.02, 0), 0.8, color, 0.2, 0.12)

export interface PlacedModel {
  name: string
  info: ModelInfo
  object: THREE.Group
}

export async function buildPlacement(pack: string, name: string, definition: ModelDefinition | undefined, withGrid: boolean): Promise<PlacedModel> {
  const { root, info } = await loadModel(pack, name)
  const group = new THREE.Group()
  group.userData.name = name
  const model = root.clone(true)
  const recolor = definition?.recolor
  if (recolor && HEX.test(recolor.color)) {
    const color = Number.parseInt(recolor.color.slice(1), 16)
    model.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.isMesh) mesh.material = library.withRecolor(mesh.material, color)
    })
  }
  group.add(fitted(model, definition))

  const { width, depth } = footprintOf(info, definition)
  const footprint = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.55, side: THREE.DoubleSide }))
  footprint.rotation.x = -Math.PI / 2
  footprint.position.y = 0.005
  group.add(footprint)
  if (withGrid) {
    const size = Math.max(width, depth) + 4
    const grid = new THREE.GridHelper(size, size, 0x556677, 0x8899aa)
    grid.position.y = 0.002
    group.add(grid)
    const street = new THREE.Mesh(new THREE.PlaneGeometry(width + 2, 1), new THREE.MeshBasicMaterial({ color: 0x777777 }))
    street.rotation.x = -Math.PI / 2
    street.position.set(0, 0.003, -(depth / 2 + 0.5))
    group.add(street)
  }
  group.add(arrow(new THREE.Vector3(1, 0, 0), 0xff2222), arrow(new THREE.Vector3(0, 0, 1), 0x2244ff))
  return { name, info, object: group }
}

export class SceneStage {
  readonly stage = new THREE.Group()
  readonly camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 200)
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly scene = new THREE.Scene()
  private zoom = 1.2
  private fitZoom = 1.2
  private frame = 0

  constructor(private readonly canvas: HTMLCanvasElement, private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.scene.background = new THREE.Color(0xcfd8e3)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(5, 10, 4)
    this.scene.add(sun, this.stage)
    this.camera.position.set(6, 6, 6)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = false
    this.controls.enableZoom = false
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    const loop = () => {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.frame = requestAnimationFrame(loop)
    }
    loop()
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.canvas.removeEventListener('wheel', this.onWheel)
    this.controls.dispose()
    this.renderer.dispose()
  }

  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight
    if (!height) return
    this.renderer.setSize(width, height, false)
    const aspect = width / height
    this.camera.left = -this.zoom * aspect
    this.camera.right = this.zoom * aspect
    this.camera.top = this.zoom
    this.camera.bottom = -this.zoom
    this.camera.updateProjectionMatrix()
  }

  clear() {
    this.stage.clear()
  }

  frameStage() {
    const box = new THREE.Box3().setFromObject(this.stage)
    if (box.isEmpty()) return
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight)
    const radius = Math.max(0.1, sphere.radius)
    this.controls.target.copy(sphere.center)
    this.camera.position.copy(sphere.center).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(radius * 3))
    this.camera.zoom = 1
    this.camera.far = Math.max(200, radius * 6)
    this.zoom = (radius * 1.1) / Math.min(1, Math.max(0.01, aspect))
    this.fitZoom = this.zoom
    this.resize()
    this.controls.update()
  }

  nameAt(clientX: number, clientY: number): string | undefined {
    const rect = this.canvas.getBoundingClientRect()
    const point = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(point, this.camera)
    let node: THREE.Object3D | null = raycaster.intersectObjects(this.stage.children, true)[0]?.object ?? null
    while (node && node.parent !== this.stage) node = node.parent
    return node?.userData.name as string | undefined
  }

  private onWheel = (event: WheelEvent) => {
    event.preventDefault()
    this.zoom = Math.min(this.fitZoom * 8, Math.max(this.fitZoom * 0.02, this.zoom * (event.deltaY > 0 ? 1.1 : 0.9)))
    this.resize()
  }
}

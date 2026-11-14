import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { lightingOf } from '../../../src/scene/dayLighting'

const SUN_OFFSET = new THREE.Vector3(-20, 40, 10)
const ISO_PITCH = Math.atan(1 / Math.SQRT2)
const START_YAW = Math.PI / 4
const GAP = 1.5
const GROUND_COLOR = 0x7d9a62

export interface ShownModel {
  object: THREE.Object3D
  label: string
}

export class ViewerScene {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500)
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly scene = new THREE.Scene()
  private readonly sun = new THREE.DirectionalLight()
  private readonly sky = new THREE.HemisphereLight()
  private readonly ground: THREE.Mesh
  private readonly models = new THREE.Group()
  private grid = new THREE.GridHelper(1, 1)
  private showGrid = true
  private night = false
  private radius = 4

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 0.8
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    const generator = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = generator.fromScene(new RoomEnvironment(), 0.04).texture
    generator.dispose()
    this.scene.environmentIntensity = 0.12
    this.scene.background = new THREE.Color()
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: GROUND_COLOR }))
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = -0.001
    this.ground.receiveShadow = true
    this.scene.add(this.sun, this.sun.target, this.sky, this.ground, this.models, this.grid)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = false
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02
    this.applyLighting()
    this.renderer.setAnimationLoop(() => this.draw())
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.controls.dispose()
    this.renderer.dispose()
  }

  // Models sit on a square-ish grid of equal cells, each as wide as the biggest model.
  show(items: ShownModel[]) {
    this.models.clear()
    const boxes = items.map(({ object }) => {
      object.position.set(0, 0, 0)
      object.updateMatrixWorld(true)
      return new THREE.Box3().setFromObject(object)
    })
    const cell = Math.max(1, ...boxes.map((box) => Math.max(box.max.x - box.min.x, box.max.z - box.min.z))) + GAP
    const columns = Math.ceil(Math.sqrt(items.length))
    const rows = Math.ceil(items.length / columns)
    items.forEach(({ object }, index) => {
      const box = boxes[index]!
      const column = index % columns
      const row = Math.floor(index / columns)
      object.position.set(
        (column - (columns - 1) / 2) * cell - (box.min.x + box.max.x) / 2,
        0,
        (row - (rows - 1) / 2) * cell - (box.min.z + box.max.z) / 2,
      )
      object.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.castShadow = true
        mesh.receiveShadow = true
      })
      this.models.add(object)
    })
    this.rebuildGround()
  }

  setShadows(enabled: boolean) {
    this.sun.castShadow = enabled
    this.applyLighting()
  }

  setNight(enabled: boolean) {
    this.night = enabled
    this.applyLighting()
  }

  setGrid(enabled: boolean) {
    this.showGrid = enabled
    this.grid.visible = enabled
  }

  frame() {
    this.controls.target.set(0, Math.min(1, this.radius / 4), 0)
    const distance = 100
    this.camera.position.set(
      Math.sin(START_YAW) * Math.cos(ISO_PITCH) * distance,
      Math.sin(ISO_PITCH) * distance + this.controls.target.y,
      Math.cos(START_YAW) * Math.cos(ISO_PITCH) * distance,
    )
    this.camera.zoom = 1
    this.controls.update()
    this.resize()
  }

  private rebuildGround() {
    const box = new THREE.Box3().setFromObject(this.models)
    const size = box.getSize(new THREE.Vector3())
    this.radius = Math.max(2, Math.hypot(size.x, size.y, size.z) / 2)
    const side = Math.ceil(Math.max(size.x, size.z) + 6)
    this.ground.scale.set(Math.max(side, size.x + 6), Math.max(side, size.z + 6), 1)
    this.scene.remove(this.grid)
    this.grid.dispose()
    this.grid = new THREE.GridHelper(side, side, 0x4d5d3c, 0x6a8350)
    this.grid.position.y = 0.002
    this.grid.visible = this.showGrid
    this.scene.add(this.grid)
    const reach = this.radius + 4
    Object.assign(this.sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 120 })
    this.sun.shadow.camera.updateProjectionMatrix()
    this.sun.position.copy(SUN_OFFSET)
  }

  private applyLighting() {
    const lighting = lightingOf(this.night ? 0 : 1, this.sun.castShadow)
    this.sun.color.setHex(lighting.sunColor)
    this.sun.intensity = lighting.sunIntensity
    this.sky.color.setHex(lighting.skyColor)
    this.sky.groundColor.setHex(lighting.groundColor)
    this.sky.intensity = lighting.hemisphereIntensity
    this.scene.environmentIntensity = lighting.environmentIntensity
    ;(this.scene.background as THREE.Color).setHex(lighting.background)
  }

  private resize() {
    const width = this.canvas.clientWidth || 1
    const height = this.canvas.clientHeight || 1
    const half = this.radius * 1.4
    const aspect = width / height
    this.camera.left = -half * Math.max(1, aspect)
    this.camera.right = half * Math.max(1, aspect)
    this.camera.top = half / Math.min(1, aspect)
    this.camera.bottom = -half / Math.min(1, aspect)
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private draw() {
    const { clientWidth, clientHeight } = this.canvas
    if (this.canvas.width !== Math.round(clientWidth * this.renderer.getPixelRatio()) || this.canvas.height !== Math.round(clientHeight * this.renderer.getPixelRatio())) this.resize()
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

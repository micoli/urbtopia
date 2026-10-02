// PROTOTYPE - throwaway imperative three.js scene + camera/touch controls.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ALL_MODELS, type Building, type Ghost } from './game'
import { itemById } from './catalog'
import { MAP_MAX, MAP_MIN, inBounds, isCrossroad, isRoad, tileKey } from './map'

const ISO_PITCH = Math.atan(1 / Math.SQRT2)
const ZOOM_MIN = 14
const ZOOM_MAX = 90
const TAP_SLOP = 8
const LONG_PRESS_MS = 500
const TWIST_SNAP = (35 * Math.PI) / 180

export type SceneEvents = {
  onTap: (tile: { x: number; z: number }, buildingId: number | null, screen: { x: number; y: number }) => void
  onLongPress: (screen: { x: number; y: number }) => void
  onGhost: (ghost: Ghost | null) => void
  onCancel: () => void
}

export type Projected = { x: number; y: number; visible: boolean }

export class GameScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500)
  private cam = { x: 0, z: 0, zoom: 36, yaw: Math.PI / 4, yawTarget: Math.PI / 4, targetX: 0, targetZ: 0 }
  private models = new Map<string, THREE.Object3D>()
  private objects = new Map<number, THREE.Object3D>()
  private occupied = new Map<string, number>()
  private ghost: THREE.Object3D | null = null
  private ghostItemId: string | null = null
  private ghostTile = { x: NaN, z: NaN }
  private grid: THREE.GridHelper
  private ring: THREE.Mesh
  private raycaster = new THREE.Raycaster()
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private pointers = new Map<number, { x: number; y: number; startX: number; startY: number; t: number }>()
  private lastPinch = 0
  private lastAngle = 0
  private twist = 0
  private gestureMoved = false
  private longPressTimer = 0
  private keys = new Set<string>()
  private frameListeners = new Set<() => void>()
  private disposed = false
  private ghostItemFromStore: string | null = null

  constructor(private canvas: HTMLCanvasElement, private events: SceneEvents) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.scene.background = new THREE.Color(0x9ec5e8)
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(20, 40, 10)
    this.scene.add(sun, new THREE.AmbientLight(0xffffff, 1.2))

    const size = MAP_MAX - MAP_MIN + 1
    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(size + 40, size + 40), new THREE.MeshStandardMaterial({ color: 0x86b36b }))
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.y = -0.01
    this.scene.add(groundMesh)

    this.grid = new THREE.GridHelper(size, size, 0xffffff, 0xffffff)
    this.grid.position.set((MAP_MIN + MAP_MAX) / 2 + 0.5, 0.03, (MAP_MIN + MAP_MAX) / 2 + 0.5)
    ;(this.grid.material as THREE.Material).opacity = 0.35
    ;(this.grid.material as THREE.Material).transparent = true
    this.grid.visible = false
    this.scene.add(this.grid)

    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: 0xffd23f, side: THREE.DoubleSide }))
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = 0.05
    this.ring.visible = false
    this.scene.add(this.ring)

    this.bindInput()
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  async init() {
    const loader = new GLTFLoader()
    const paths = [...ALL_MODELS, 'roads/road-crossroad']
    await Promise.all(paths.map(async p => this.models.set(p, (await loader.loadAsync(`/models/${p}.glb`)).scene)))
    const roads = new THREE.Group()
    for (let x = MAP_MIN; x <= MAP_MAX; x++) for (let z = MAP_MIN; z <= MAP_MAX; z++) {
      if (!isRoad(x, z)) continue
      const road = this.models.get(isCrossroad(x, z) ? 'roads/road-crossroad' : 'roads/road-straight')!.clone(true)
      road.position.set(x, 0, z)
      road.rotation.y = !isCrossroad(x, z) && x % 6 === 0 ? Math.PI / 2 : 0
      roads.add(road)
      this.occupied.set(tileKey(x, z), -1)
    }
    this.scene.add(roads)
    requestAnimationFrame(this.frame)
  }

  dispose() {
    this.disposed = true
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.renderer.dispose()
  }

  // --- store -> scene
  sync(buildings: Building[]) {
    const seen = new Set<number>()
    for (const b of buildings) {
      seen.add(b.id)
      if (this.objects.has(b.id)) continue
      const obj = this.models.get(itemById(b.itemId).model)!.clone(true)
      obj.position.set(b.x, 0, b.z)
      this.scene.add(obj)
      this.objects.set(b.id, obj)
      this.occupied.set(tileKey(b.x, b.z), b.id)
    }
    for (const [id, obj] of this.objects) {
      if (seen.has(id)) continue
      this.scene.remove(obj)
      this.objects.delete(id)
      for (const [key, value] of this.occupied) if (value === id) this.occupied.delete(key)
    }
    this.ghostTile = { x: NaN, z: NaN }
  }

  setSelected(id: number | null) {
    const obj = id === null ? null : this.objects.get(id)
    this.ring.visible = !!obj
    if (obj) this.ring.position.set(obj.position.x, 0.05, obj.position.z)
  }

  setBuildItem(itemId: string | null) {
    this.ghostItemFromStore = itemId
    this.grid.visible = itemId !== null
    if (itemId === this.ghostItemId) return
    if (this.ghost) this.scene.remove(this.ghost)
    this.ghost = null
    this.ghostItemId = itemId
    this.ghostTile = { x: NaN, z: NaN }
    if (!itemId) return this.events.onGhost(null)
    const ghost = this.models.get(itemById(itemId).model)!.clone(true)
    ghost.traverse(node => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone()
      ;(mesh.material as THREE.MeshStandardMaterial).transparent = true
      ;(mesh.material as THREE.MeshStandardMaterial).opacity = 0.8
    })
    this.ghost = ghost
    this.scene.add(ghost)
  }

  // --- camera api
  rotateStep(dir: 1 | -1) { this.cam.yawTarget += (dir * Math.PI) / 2 }
  zoomBy(factor: number) { this.cam.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.cam.zoom * factor)) }
  centerOn(x: number, z: number) { this.cam.targetX = x; this.cam.targetZ = z }
  subscribeFrame(listener: () => void) { this.frameListeners.add(listener); return () => { this.frameListeners.delete(listener) } }

  project(id: number): Projected | null {
    const obj = this.objects.get(id)
    if (!obj) return null
    const v = new THREE.Vector3(obj.position.x, 1.6, obj.position.z).project(this.camera)
    return {
      x: ((v.x + 1) / 2) * this.canvas.clientWidth,
      y: ((1 - v.y) / 2) * this.canvas.clientHeight,
      visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1,
    }
  }

  // --- internals
  private resize = () => {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false)
    this.updateCamera()
  }

  private updateCamera() {
    const { cam, camera } = this
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight
    camera.left = -w / cam.zoom / 2; camera.right = w / cam.zoom / 2
    camera.top = h / cam.zoom / 2; camera.bottom = -h / cam.zoom / 2
    const d = 100
    camera.position.set(
      cam.x + Math.sin(cam.yaw) * Math.cos(ISO_PITCH) * d,
      Math.sin(ISO_PITCH) * d,
      cam.z + Math.cos(cam.yaw) * Math.cos(ISO_PITCH) * d,
    )
    camera.lookAt(cam.x, 0, cam.z)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  }

  private panByPixels(dx: number, dy: number) {
    const s = 1 / this.cam.zoom
    const c = Math.cos(this.cam.yaw), si = Math.sin(this.cam.yaw)
    this.cam.x -= (dx * c + dy * si * Math.SQRT2) * s
    this.cam.z -= (-dx * si + dy * c * Math.SQRT2) * s
    this.cam.targetX = this.cam.x
    this.cam.targetZ = this.cam.z
  }

  private tileAt(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const hit = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(this.ground, hit)) return null
    return { x: Math.round(hit.x), z: Math.round(hit.z) }
  }

  private bindInput() {
    const c = this.canvas
    c.addEventListener('contextmenu', e => { e.preventDefault(); this.events.onCancel() })
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId)
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, t: performance.now() })
      this.lastPinch = 0
      this.twist = 0
      if (this.pointers.size > 1) { this.gestureMoved = true; window.clearTimeout(this.longPressTimer); return }
      this.gestureMoved = false
      window.clearTimeout(this.longPressTimer)
      if (e.pointerType === 'mouse' && e.button !== 0) return
      this.longPressTimer = window.setTimeout(() => {
        if (this.gestureMoved || this.pointers.size !== 1) return
        this.gestureMoved = true
        this.events.onLongPress({ x: e.clientX, y: e.clientY })
      }, LONG_PRESS_MS)
    })
    c.addEventListener('pointermove', e => {
      const p = this.pointers.get(e.pointerId)
      if (!p) return
      if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > TAP_SLOP) { this.gestureMoved = true; window.clearTimeout(this.longPressTimer) }
      if (this.pointers.size === 1 && this.gestureMoved) this.panByPixels(e.clientX - p.x, e.clientY - p.y)
      p.x = e.clientX; p.y = e.clientY
      if (this.pointers.size === 2) this.onTwoFingers()
    })
    const end = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId)
      this.pointers.delete(e.pointerId)
      window.clearTimeout(this.longPressTimer)
      this.lastPinch = 0
      if (!p || this.gestureMoved || e.type === 'pointercancel') return
      const tile = this.tileAt(e.clientX, e.clientY)
      if (!tile) return
      const id = this.occupied.get(tileKey(tile.x, tile.z))
      this.events.onTap(tile, id !== undefined && id >= 0 ? id : null, { x: e.clientX, y: e.clientY })
    }
    c.addEventListener('pointerup', end)
    c.addEventListener('pointercancel', end)
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.1 : 0.9) }, { passive: false })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  private onTwoFingers() {
    const [a, b] = [...this.pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    if (this.lastPinch) {
      this.zoomBy(dist / this.lastPinch)
      let delta = angle - this.lastAngle
      if (delta > Math.PI) delta -= 2 * Math.PI
      if (delta < -Math.PI) delta += 2 * Math.PI
      this.twist += delta
      if (Math.abs(this.twist) > TWIST_SNAP) { this.rotateStep(this.twist > 0 ? -1 : 1); this.twist = 0 }
    }
    this.lastPinch = dist
    this.lastAngle = angle
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea')) return
    const k = e.key.toLowerCase()
    if (k === 'q') this.rotateStep(-1)
    else if (k === 'e') this.rotateStep(1)
    else if (k === 'escape') this.events.onCancel()
    else this.keys.add(k)
  }
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()) }

  private updateGhost() {
    if (!this.ghost || !this.ghostItemFromStore) return
    const tile = { x: Math.round(this.cam.x), z: Math.round(this.cam.z) }
    if (tile.x === this.ghostTile.x && tile.z === this.ghostTile.z) return
    this.ghostTile = tile
    const valid = inBounds(tile.x, tile.z) && !this.occupied.has(tileKey(tile.x, tile.z))
    this.ghost.position.set(tile.x, 0.02, tile.z)
    this.ghost.traverse(node => {
      const mesh = node as THREE.Mesh
      if (mesh.isMesh) (mesh.material as THREE.MeshStandardMaterial).emissive.set(valid ? 0x1f8a3a : 0xc0392b)
    })
    this.events.onGhost({ ...tile, valid })
  }

  private frame = () => {
    if (this.disposed) return
    const { cam } = this
    const speed = 0.25 * (36 / cam.zoom) + 0.1
    const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw)
    let kx = 0, kz = 0
    if (this.keys.has('w') || this.keys.has('arrowup')) kz -= 1
    if (this.keys.has('s') || this.keys.has('arrowdown')) kz += 1
    if (this.keys.has('a') || this.keys.has('arrowleft')) kx -= 1
    if (this.keys.has('d') || this.keys.has('arrowright')) kx += 1
    if (kx || kz) {
      cam.targetX += (kx * c + kz * s) * speed
      cam.targetZ += (-kx * s + kz * c) * speed
    }
    cam.x += (cam.targetX - cam.x) * (this.pointers.size ? 1 : 0.2)
    cam.z += (cam.targetZ - cam.z) * (this.pointers.size ? 1 : 0.2)
    cam.yaw += (cam.yawTarget - cam.yaw) * 0.18
    this.updateCamera()
    this.updateGhost()
    this.renderer.render(this.scene, this.camera)
    this.frameListeners.forEach(l => l())
    requestAnimationFrame(this.frame)
  }
}

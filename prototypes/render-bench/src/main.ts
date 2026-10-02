// PROTOTYPE - throwaway. Question: can an iso ortho three.js scene with Kenney GLBs hold 60fps on phones?
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type Mode = 'naive' | 'instanced' | 'chunked'
const state = {
  mode: 'instanced' as Mode,
  size: 30,
  shadow: false,
  dpr: Math.min(window.devicePixelRatio, 2),
  lowDetail: false,
  chunk: 16,
  lod: 0,
}
const MODES: Mode[] = ['naive', 'instanced', 'chunked']
const CHUNKS = [8, 16, 32]
const LODS = [0, 10, 20, 40]
const SIZES = [20, 30, 50, 80, 150, 250]
const DPRS = [1, 1.5, 2, 3]

const canvas = document.getElementById('c') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x99aadd)
const sun = new THREE.DirectionalLight(0xffffff, 2.2)
sun.position.set(20, 40, 10)
scene.add(sun, new THREE.AmbientLight(0xffffff, 1.2))

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500)
const cam = { x: 0, z: 0, zoom: 40, yaw: Math.PI / 4 }
const ISO_PITCH = Math.atan(1 / Math.SQRT2)

function updateCamera() {
  const w = canvas.clientWidth, h = canvas.clientHeight
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
}

function resize() {
  renderer.setPixelRatio(state.dpr)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  updateCamera()
}
window.addEventListener('resize', resize)

// --- input: 1 finger pan, 2 fingers pinch zoom, wheel zoom
const pointers = new Map<number, { x: number; y: number }>()
let lastPinch = 0
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }) })
canvas.addEventListener('pointerup', e => { pointers.delete(e.pointerId); lastPinch = 0 })
canvas.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId)
  if (!p) return
  if (pointers.size === 1) {
    const dx = e.clientX - p.x, dy = e.clientY - p.y
    const s = 1 / cam.zoom
    const c = Math.cos(cam.yaw), si = Math.sin(cam.yaw)
    cam.x -= (dx * c + dy * si * Math.SQRT2) * s
    cam.z -= (-dx * si + dy * c * Math.SQRT2) * s
  }
  p.x = e.clientX; p.y = e.clientY
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (lastPinch) cam.zoom = Math.min(150, Math.max(8, cam.zoom * dist / lastPinch))
    lastPinch = dist
  }
  updateCamera()
})
canvas.addEventListener('wheel', e => { cam.zoom = Math.min(150, Math.max(8, cam.zoom * (e.deltaY < 0 ? 1.1 : 0.9))); updateCamera() })

// --- assets
const loader = new GLTFLoader()
const gltfCache = new Map<string, THREE.Object3D>()
async function load(path: string) {
  const hit = gltfCache.get(path)
  if (hit) return hit
  const g = await loader.loadAsync(path)
  gltfCache.set(path, g.scene)
  return g.scene
}

const BUILDINGS = 'abcdefghijklmn'.split('').map(l => `building-${l}`)
const LOW = 'abcdefghijklmn'.split('').map(l => `low-detail-building-${l}`)
const SKY = 'abcde'.split('').map(l => `building-skyscraper-${l}`)

type Item = { path: string; x: number; z: number; rot: number }

function layout(n: number): Item[] {
  const items: Item[] = []
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const names = state.lowDetail ? LOW : BUILDINGS
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = i - n / 2, z = j - n / 2
    const rx = i % 4 === 0, rz = j % 4 === 0
    if (rx && rz) items.push({ path: 'roads/road-crossroad', x, z, rot: 0 })
    else if (rx) items.push({ path: 'roads/road-straight', x, z, rot: Math.PI / 2 })
    else if (rz) items.push({ path: 'roads/road-straight', x, z, rot: 0 })
    else {
      const sky = !state.lowDetail && rnd() < 0.08
      const pool = sky ? SKY : names
      items.push({ path: 'commercial/' + pool[Math.floor(rnd() * pool.length)], x, z, rot: Math.floor(rnd() * 4) * Math.PI / 2 })
    }
  }
  return items
}

let world = new THREE.Group()
scene.add(world)

const toLow = (path: string) =>
  path.includes('skyscraper') ? 'commercial/low-detail-building-a' : path.replace('building-', 'low-detail-building-')

async function buildInstanced(items: Item[], lod: 'high' | 'low' | 'both') {
  const byKey = new Map<string, Item[]>()
  const cs = state.mode === 'chunked' ? state.chunk : Infinity
  for (const it of items) {
    const key = `${it.path}|${Math.floor((it.x + state.size) / cs)}|${Math.floor((it.z + state.size) / cs)}`
    ;(byKey.get(key) ?? byKey.set(key, []).get(key)!).push(it)
  }
  const m = new THREE.Matrix4(), r = new THREE.Matrix4()
  for (const [key, list] of byKey) {
    const src = gltfCache.get(`/models/${key.split('|')[0]}.glb`)!
    src.updateMatrixWorld(true)
    const cx = list.reduce((a, i) => a + i.x, 0) / list.length
    const cz = list.reduce((a, i) => a + i.z, 0) / list.length
    src.traverse(node => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, list.length)
      list.forEach((it, k) => {
        m.makeRotationY(it.rot).setPosition(it.x, 0, it.z)
        r.multiplyMatrices(m, mesh.matrixWorld)
        inst.setMatrixAt(k, r)
      })
      inst.computeBoundingSphere()
      inst.castShadow = state.shadow; inst.receiveShadow = state.shadow
      inst.userData = { lod, cx, cz }
      world.add(inst)
    })
  }
}

function updateLod() {
  if (state.lod === 0) return
  for (const o of world.children) {
    const { lod, cx, cz } = o.userData
    if (lod === 'both') continue
    const near = Math.hypot(cx - cam.x, cz - cam.z) < state.lod
    o.visible = lod === 'high' ? near : !near
  }
}

async function build() {
  scene.remove(world)
  world.traverse(o => { if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose() })
  world = new THREE.Group()
  const items = layout(state.size)
  const paths = [...new Set(items.map(i => i.path))]
  await Promise.all(paths.map(p => load(`/models/${p}.glb`)))

  if (state.mode === 'naive') {
    for (const it of items) {
      const o = gltfCache.get(`/models/${it.path}.glb`)!.clone(true)
      o.position.set(it.x, 0, it.z); o.rotation.y = it.rot
      o.traverse(m => { m.castShadow = state.shadow; m.receiveShadow = state.shadow })
      world.add(o)
    }
  } else {
    const useLod = state.mode === 'chunked' && state.lod > 0 && !state.lowDetail
    await buildInstanced(items, useLod ? 'high' : 'both')
    if (useLod) {
      const low = items.filter(i => !i.path.startsWith('roads/')).map(i => ({ ...i, path: toLow(i.path) }))
      await Promise.all([...new Set(low.map(i => i.path))].map(p => load(`/models/${p}.glb`)))
      await buildInstanced(low, 'low')
    }
  }
  scene.add(world)
}

function applyShadow() {
  renderer.shadowMap.enabled = state.shadow
  sun.castShadow = state.shadow
  const s = state.size / 1.4
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 200 })
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.updateProjectionMatrix()
}

// --- HUD
const $ = (id: string) => document.getElementById(id) as HTMLButtonElement
function label() {
  $('mode').textContent = `mode:${state.mode}${state.mode === 'chunked' ? ' ' + state.chunk : ''}`
  $('lod').textContent = `lod:${state.lod || 'off'}`
  $('size').textContent = `grid:${state.size}x${state.size}`
  $('shadow').textContent = `shadow:${state.shadow ? 'on' : 'off'}`
  $('dpr').textContent = `dpr:${state.dpr}`
  $('low').textContent = `models:${state.lowDetail ? 'low-detail' : 'normal'}`
}
async function rebuild() { label(); applyShadow(); resize(); await build() }
$('mode').onclick = () => { state.mode = MODES[(MODES.indexOf(state.mode) + 1) % MODES.length]; rebuild() }
$('lod').onclick = () => { state.lod = LODS[(LODS.indexOf(state.lod) + 1) % LODS.length]; rebuild() }
$('chunk').onclick = () => { state.chunk = CHUNKS[(CHUNKS.indexOf(state.chunk) + 1) % CHUNKS.length]; rebuild() }
$('size').onclick = () => { state.size = SIZES[(SIZES.indexOf(state.size) + 1) % SIZES.length]; rebuild() }
$('shadow').onclick = () => { state.shadow = !state.shadow; rebuild() }
$('dpr').onclick = () => { state.dpr = DPRS[(DPRS.indexOf(state.dpr) + 1) % DPRS.length]; rebuild() }
$('low').onclick = () => { state.lowDetail = !state.lowDetail; rebuild() }

// --- loop + fps
const stats = document.getElementById('stats')!
let frames = 0, t0 = performance.now(), worst = 0, last = t0
function frame(now: number) {
  worst = Math.max(worst, now - last); last = now
  updateLod()
  renderer.render(scene, camera)
  frames++
  if (now - t0 >= 1000) {
    const i = renderer.info
    stats.textContent = `${frames}fps worst:${worst.toFixed(0)}ms calls:${i.render.calls} tris:${(i.render.triangles / 1000).toFixed(0)}k geo:${i.memory.geometries} tex:${i.memory.textures} gpu:${renderer.getContext().getParameter(renderer.getContext().VERSION)}`
    frames = 0; worst = 0; t0 = now
  }
  requestAnimationFrame(frame)
}
rebuild().then(() => requestAnimationFrame(frame))

// Assets editor: browse every model source and edit assets/models.json (Model definitions).
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MODEL_KEYS } from '../../../src/scene/renderItems'
import { ModelLibrary } from '../../../src/scene/modelLibrary'
import type { ModelDefinition, ModelSource } from '../../../src/scene/modelDefinitions'

const PACKS: Record<string, string[]> = {}
const manifest: Record<string, string[]> = await (await fetch('/manifest.json')).json()
Object.assign(PACKS, manifest)

const sourceOfPack: Record<string, ModelSource | undefined> = await (await fetch('/api/packs')).json()
const definitions: Record<string, ModelDefinition> = await (await fetch('/api/models')).json()
const library = new ModelLibrary()

interface Info { size: THREE.Vector3; min: THREE.Vector3; max: THREE.Vector3; tris: number; meshes: number; nodeScaled: boolean }

// Quaternius FBX packs are listed as quaternius-<pack> but the game keys them <pack>/<name>.
const definitionKey = (p: string, n: string) => (isFbxPack(p) ? `${p.slice('quaternius-'.length)}/${n}` : `${p}/${n}`)
const sourceOf = (p: string): ModelSource | undefined => (isFbxPack(p) ? 'quaternius' : sourceOfPack[p])
const definitionOf = (p: string, n: string) => definitions[definitionKey(p, n)]
const usedInGame = new Set(MODEL_KEYS)
let sourceFilter = 'all'
let saveMessage = ''
const infos: Record<string, Info> = {}
const cache: Record<string, THREE.Object3D> = {}

let pack = Object.keys(PACKS)[0]
let current = ''
let rot = 0
let overview = false
let globalSearch = ''
let listSearch = ''
let renderVersion = 0
const assets = Object.entries(PACKS).flatMap(([pack, names]) => names.map(name => ({ pack, name })))

function visibleAssets() {
  const query = globalSearch.trim().toLowerCase()
  const filter = listSearch.trim().toLowerCase()
  return assets.filter(asset => (query ? matchesSourceFilter(asset.pack) && key(asset.pack, asset.name).toLowerCase().includes(query) : asset.pack === pack)
    && asset.name.toLowerCase().includes(filter))
}

function selectAsset(p: string, name: string) {
  pack = p
  current = name
  rot = 0
  overview = false
  renderBar()
  renderList()
  void render()
  document.querySelector('#list .sel')?.scrollIntoView({ block: 'nearest' })
}

const canvas = document.getElementById('c') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xcfd8e3)
scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.6))
const sun = new THREE.DirectionalLight(0xffffff, 1.6)
sun.position.set(5, 10, 4)
scene.add(sun)
const cam = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 200)
cam.position.set(6, 6, 6)
const controls = new OrbitControls(cam, canvas)
controls.enableDamping = false
let zoom = 1.2

const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()
const mtlLoader = new MTLLoader()
const threeMfLoader = new ThreeMFLoader()
const isFbxPack = (p: string) => p.startsWith('quaternius-')
const isObjPack = (p: string) => p === 'miscellaneous'
const key = (p: string, n: string) => `${p}/${n}`

const matteOf = (source: THREE.Material) => {
  const { color, map, vertexColors } = source as THREE.MeshPhongMaterial
  const { r, g, b } = color.getRGB(new THREE.Color(), THREE.SRGBColorSpace)
  return new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace), map, vertexColors, roughness: 1, metalness: 0 })
}

async function loadMaterials(p: string, n: string) {
  const response = await fetch(`/models/${p}/${n}.mtl`)
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) return null
  const directory = `/models/${p}/${n.slice(0, n.lastIndexOf('/') + 1)}`
  mtlLoader.setResourcePath(directory)
  return mtlLoader.parse(await response.text(), directory)
}

async function loadObj(p: string, n: string): Promise<THREE.Object3D> {
  const objLoader = new OBJLoader()
  const materials = await loadMaterials(p, n)
  if (materials) objLoader.setMaterials(materials)
  return objLoader.loadAsync(`/models/${p}/${n}.obj`)
}

async function load3mf(p: string, n: string): Promise<THREE.Object3D> {
  const model = await threeMfLoader.loadAsync(`/models/${p}/${n}`)
  model.rotation.x = -Math.PI / 2
  return new THREE.Group().add(model)
}

async function loadRoot(p: string, n: string): Promise<THREE.Object3D> {
  if (isFbxPack(p)) return fbxLoader.loadAsync(`/models/${p}/${n}.fbx`)
  if (isObjPack(p) && n.endsWith('.glb')) return (await gltfLoader.loadAsync(`/models/${p}/${n}`)).scene
  if (isObjPack(p)) return n.endsWith('.3mf') ? load3mf(p, n) : loadObj(p, n)
  return (await gltfLoader.loadAsync(`/models/${p}/${n}.glb`)).scene
}

async function load(p: string, n: string): Promise<THREE.Object3D> {
  const k = key(p, n)
  if (cache[k]) return cache[k]
  const root = await loadRoot(p, n)
  root.updateMatrixWorld(true)
  let tris = 0, meshes = 0, nodeScaled = false
  root.traverse((o) => {
    if (o !== root && o.scale.distanceTo(new THREE.Vector3(1, 1, 1)) > 1e-4) nodeScaled = true
    const m = o as THREE.Mesh
    if (m.isMesh) {
      meshes++
      tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3
      if (isObjPack(p) && !m.geometry.attributes.normal) m.geometry.computeVertexNormals()
      if (isFbxPack(p) || isObjPack(p)) m.material = Array.isArray(m.material) ? m.material.map(matteOf) : matteOf(m.material)
      for (const mat of [m.material].flat() as THREE.MeshStandardMaterial[]) {
        if (mat.map) { mat.map.magFilter = THREE.NearestFilter; mat.map.needsUpdate = true }
      }
    }
  })
  const box = new THREE.Box3().setFromObject(root)
  infos[k] = { size: box.getSize(new THREE.Vector3()), min: box.min.clone(), max: box.max.clone(), tris, meshes, nodeScaled }
  cache[k] = root
  return root
}

const stage = new THREE.Group()
scene.add(stage)

function clearStage() {
  while (stage.children.length) stage.remove(stage.children[0])
}

function arrow(dir: THREE.Vector3, color: number, len = 0.8) {
  return new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0.02, 0), len, color, 0.2, 0.12)
}

function footprint(p: string, n: string) {
  const i = infos[key(p, n)]
  const fixed = definitionOf(p, n)?.footprint
  return { w: fixed?.[0] ?? Math.max(1, Math.ceil(i.size.x - 0.15)), d: fixed?.[1] ?? Math.max(1, Math.ceil(i.size.z - 0.15)) }
}

async function place(p: string, n: string, at: THREE.Vector3, rotY: number, withGrid: boolean, version?: number) {
  const g = new THREE.Group()
  g.userData.name = n
  const model = (await load(p, n)).clone(true)
  if (version !== undefined && version !== renderVersion) return
  const recolor = definitionOf(p, n)?.recolor
  if (recolor && /^#[0-9a-f]{6}$/i.test(recolor.color)) {
    model.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) mesh.material = library.withRecolor(mesh.material, Number.parseInt(recolor.color.slice(1), 16))
    })
  }
  g.add(model)
  const { w, d } = footprint(p, n)
  const fp = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  )
  fp.rotation.x = -Math.PI / 2
  fp.position.y = 0.005
  g.add(fp)
  if (withGrid) {
    const grid = new THREE.GridHelper(Math.max(w, d) + 4, Math.max(w, d) + 4, 0x556677, 0x8899aa)
    grid.position.y = 0.002
    g.add(grid)
    const street = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, 1), new THREE.MeshBasicMaterial({ color: 0x777777 }))
    street.rotation.x = -Math.PI / 2
    street.position.set(0, 0.003, -(d / 2 + 0.5))
    g.add(street)
  }
  g.add(arrow(new THREE.Vector3(1, 0, 0), 0xff2222))
  g.add(arrow(new THREE.Vector3(0, 0, 1), 0x2244ff))
  g.position.copy(at)
  g.rotation.y = rotY
  stage.add(g)
}

async function render() {
  const version = ++renderVersion
  clearStage()
  const names = PACKS[pack]
  if (overview) {
    const cols = Math.ceil(Math.sqrt(names.length))
    for (let i = 0; i < names.length; i++) {
      await place(pack, names[i], new THREE.Vector3((i % cols) * 3, 0, Math.floor(i / cols) * 3), 0, false, version)
      if (version !== renderVersion) return
    }
  } else if (current) {
    await place(pack, current, new THREE.Vector3(0, 0, 0), (rot * Math.PI) / 2, true, version)
  }
  if (version !== renderVersion) return
  resetCam()
  renderSide()
  renderList()
}

const matchesSourceFilter = (p: string) => sourceFilter === 'all' || (sourceOf(p) ?? 'other') === sourceFilter

function renderBar() {
  const bar = document.getElementById('bar')!
  bar.innerHTML = ''
  const search = document.createElement('input')
  search.id = 'global-search'
  search.type = 'search'
  search.placeholder = 'Search all assets'
  search.setAttribute('aria-label', 'Search all assets')
  search.value = globalSearch
  search.oninput = () => { globalSearch = search.value; renderList() }
  bar.appendChild(search)
  const filter = document.createElement('select')
  filter.setAttribute('aria-label', 'Source')
  for (const source of ['all', 'kenney', 'quaternius', 'managed', 'poly.pizza', 'other']) filter.add(new Option(source, source, false, source === sourceFilter))
  filter.onchange = () => { sourceFilter = filter.value; renderBar() }
  bar.appendChild(filter)
  for (const p of Object.keys(PACKS).filter(matchesSourceFilter)) {
    const b = document.createElement('button')
    b.textContent = p
    b.className = p === pack ? 'on' : ''
    b.onclick = () => { pack = p; current = PACKS[p][0]; rot = 0; renderBar(); render() }
    bar.appendChild(b)
  }
  const ov = document.createElement('button')
  ov.textContent = overview ? 'single' : 'overview (all in pack)'
  ov.onclick = () => { overview = !overview; renderBar(); render() }
  bar.appendChild(ov)
  const r = document.createElement('button')
  r.textContent = 'rotate 90 (game rotation)'
  r.onclick = () => { rot = (rot + 1) % 4; render() }
  bar.appendChild(r)
}

function resetCam() {
  const box = new THREE.Box3().setFromObject(stage)
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const view = document.getElementById('view')!
  const aspect = view.clientWidth / Math.max(1, view.clientHeight)
  const radius = Math.max(0.1, sphere.radius)
  controls.target.copy(sphere.center)
  cam.position.copy(sphere.center).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(radius * 3))
  cam.zoom = 1
  cam.far = Math.max(200, radius * 6)
  zoom = radius * 1.1 / Math.min(1, Math.max(0.01, aspect))
  resize()
  controls.update()
}

function renderList() {
  const list = document.getElementById('list')!
  list.innerHTML = ''
  const results = visibleAssets()
  if (!results.length) list.textContent = 'No assets found'
  for (const { pack: p, name: n } of results) {
    const d = document.createElement('div')
    d.className = (p === pack && n === current ? 'sel ' : '') + (definitionOf(p, n) ? 'done' : '')
    const label = document.createElement('span')
    label.textContent = (globalSearch.trim() ? key(p, n) : n) + (usedInGame.has(definitionKey(p, n)) ? ' (*)' : '')
    d.append(label, definitionOf(p, n) ? 'defined' : '')
    d.onclick = () => { selectAsset(p, n); list.focus() }
    list.appendChild(d)
  }
}

let pending: { key: string; definition: ModelDefinition } | null = null

async function persist() {
  if (pending) definitions[pending.key] ??= pending.definition
  const response = await fetch('/api/models', { method: 'PUT', body: JSON.stringify(definitions) })
  saveMessage = response.ok ? 'saved' : ((await response.json()) as { error: string }).error
  renderSide()
  renderList()
}

// An entry only joins models.json on its first edit, so browsing never creates definitions.
function editable(p: string, n: string): ModelDefinition {
  const existing = definitionOf(p, n)
  if (existing) return existing
  const source = sourceOf(p)!
  const definition: ModelDefinition = { source, license: source === 'kenney' || source === 'quaternius' ? 'CC0' : '' }
  pending = { key: definitionKey(p, n), definition }
  return definition
}

function textRow(side: HTMLElement, label: string, value: string, on: (value: string) => void) {
  const row = document.createElement('div')
  row.className = 'row'
  const input = document.createElement('input')
  input.value = value
  input.onchange = () => { on(input.value.trim()); void persist() }
  row.append(label + ': ', input)
  side.appendChild(row)
}

function numberRow(side: HTMLElement, label: string, value: number | undefined, placeholder: string, on: (value: number | undefined) => void) {
  const row = document.createElement('div')
  row.className = 'row'
  const input = document.createElement('input')
  input.type = 'number'; input.step = 'any'; input.style.width = '60px'
  input.value = value === undefined ? '' : String(value)
  input.placeholder = placeholder
  input.onchange = () => { on(input.value === '' ? undefined : Number(input.value)); void persist().then(render) }
  row.append(label + ': ', input)
  side.appendChild(row)
}

function colorInput(value: string, on: (value: string) => void) {
  const input = document.createElement('input')
  input.type = 'color'
  input.value = value
  input.onchange = () => { on(input.value); void persist().then(render) }
  return input
}

function renderRecolor(side: HTMLElement, def: ModelDefinition) {
  const row = document.createElement('div')
  row.className = 'row'
  const enable = document.createElement('input')
  enable.type = 'checkbox'
  enable.checked = !!def.recolor
  enable.onchange = () => {
    if (enable.checked) def.recolor = { color: '#c0392b' }
    else delete def.recolor
    void persist().then(render)
  }
  row.append('recolor: ', enable)
  const recolor = def.recolor
  if (recolor) {
    row.append(colorInput(recolor.color, (color) => { recolor.color = color }))
    for (const [name, color] of Object.entries(recolor.variants ?? {})) {
      const variant = document.createElement('div')
      const remove = document.createElement('button')
      remove.textContent = 'x'
      remove.onclick = () => { delete recolor.variants![name]; if (!Object.keys(recolor.variants!).length) delete recolor.variants; void persist().then(render) }
      variant.append(`${name}: `, colorInput(color, (value) => { recolor.variants![name] = value }), remove)
      row.appendChild(variant)
    }
    const add = document.createElement('button')
    add.textContent = '+ variant'
    add.onclick = () => {
      const name = prompt('Variant name')?.trim()
      if (!name) return
      recolor.variants = { ...recolor.variants, [name]: recolor.color }
      void persist().then(render)
    }
    row.appendChild(add)
  }
  side.appendChild(row)
}

function renderSide() {
  const side = document.getElementById('side')!
  if (!current) { side.textContent = 'pick a model'; return }
  const k = key(pack, current)
  const i = infos[k]
  const fp = i ? footprint(pack, current) : { w: 0, d: 0 }
  side.innerHTML = ''
  const h = document.createElement('h3')
  h.textContent = definitionKey(pack, current)
  side.appendChild(h)
  const info = document.createElement('div')
  info.innerHTML = i
    ? `bbox ${i.size.x.toFixed(2)} x ${i.size.z.toFixed(2)} h ${i.size.y.toFixed(2)}<br>min ${i.min.x.toFixed(2)},${i.min.z.toFixed(2)} max ${i.max.x.toFixed(2)},${i.max.z.toFixed(2)}<br>tris ${i.tris} meshes ${i.meshes}${i.nodeScaled ? '<br><b>node scale != 1 (bake)</b>' : ''}<br>footprint ${fp.w} x ${fp.d}${definitionOf(pack, current)?.footprint ? '' : ' (computed)'}<br>source ${sourceOf(pack) ?? 'none'}, ${usedInGame.has(definitionKey(pack, current)) ? 'used in game' : 'not used in game'}`
    : 'loading'
  side.appendChild(info)
  if (!sourceOf(pack)) { side.append('not part of a managed source: read only'); return }

  pending = null
  const def = editable(pack, current)
  const set = <K extends keyof ModelDefinition>(field: K, value: ModelDefinition[K] | undefined | '') => {
    if (value === undefined || value === '') delete def[field]
    else def[field] = value as ModelDefinition[K]
  }
  const pair = (a: number | undefined, b: number | undefined): [number, number] | undefined => (a === undefined && b === undefined ? undefined : [a ?? 1, b ?? 1])
  numberRow(side, 'footprint W (x)', def.footprint?.[0], String(fp.w), (v) => set('footprint', pair(v, def.footprint?.[1] ?? fp.d)))
  numberRow(side, 'footprint D (z)', def.footprint?.[1], String(fp.d), (v) => set('footprint', pair(def.footprint?.[0] ?? fp.w, v)))
  numberRow(side, 'scale', def.scale, '1', (v) => set('scale', v))
  numberRow(side, 'fit width', def.fit?.width, '', (v) => set('fit', v === undefined ? undefined : { width: v, height: def.fit?.height ?? v }))
  numberRow(side, 'fit height', def.fit?.height, '', (v) => set('fit', v === undefined ? undefined : { width: def.fit?.width ?? v, height: v }))
  numberRow(side, 'rotation offset (deg)', def.rotationOffset, '0', (v) => set('rotationOffset', v))
  const bake = document.createElement('div')
  bake.className = 'row'
  const bakeBox = document.createElement('input')
  bakeBox.type = 'checkbox'
  bakeBox.checked = !!def.bakeNodeScale
  bakeBox.onchange = () => { set('bakeNodeScale', bakeBox.checked || undefined); void persist() }
  bake.append('bake node scale: ', bakeBox)
  side.appendChild(bake)
  renderRecolor(side, def)
  textRow(side, 'license', def.license, (v) => set('license', v as string))
  textRow(side, 'author', def.author ?? '', (v) => set('author', v))
  textRow(side, 'url', def.url ?? '', (v) => set('url', v))
  textRow(side, 'note', def.note ?? '', (v) => set('note', v))
  const remove = document.createElement('button')
  remove.textContent = 'remove definition (use computed defaults)'
  remove.onclick = () => { delete definitions[definitionKey(pack, current)]; void persist().then(render) }
  side.appendChild(remove)
  const status = document.createElement('div')
  status.textContent = saveMessage
  side.appendChild(status)
}

function resize() {
  const v = document.getElementById('view')!
  const w = v.clientWidth, h = v.clientHeight
  renderer.setSize(w, h, false)
  const a = w / h
  cam.left = -zoom * a; cam.right = zoom * a; cam.top = zoom; cam.bottom = -zoom
  cam.updateProjectionMatrix()
}
addEventListener('resize', resize)
document.getElementById('list-search')!.addEventListener('input', (event) => {
  listSearch = (event.target as HTMLInputElement).value
  renderList()
})
addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  const target = event.target as HTMLElement
  const isSearch = target.id === 'global-search' || target.id === 'list-search'
  if (!isSearch && target.closest('input, select, textarea, [contenteditable]')) return
  const results = visibleAssets()
  if (!results.length) return
  event.preventDefault()
  const index = results.findIndex(asset => asset.pack === pack && asset.name === current)
  const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : results.length - 1)
    : Math.max(0, Math.min(results.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
  const asset = results[next]
  if (index === next && !overview) return
  selectAsset(asset.pack, asset.name)
  if (isSearch) document.getElementById(target.id)?.focus()
})
const raycaster = new THREE.Raycaster()
let pointerDown: { x: number; y: number } | null = null
canvas.addEventListener('pointerdown', (e) => { pointerDown = { x: e.clientX, y: e.clientY } })
canvas.addEventListener('pointerup', (e) => {
  const start = pointerDown
  pointerDown = null
  if (!overview || !start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return
  const rect = canvas.getBoundingClientRect()
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), cam)
  const hit = raycaster.intersectObjects(stage.children, true)[0]
  let node: THREE.Object3D | null = hit?.object ?? null
  while (node && node.parent !== stage) node = node.parent
  const name = node?.userData.name as string | undefined
  if (!name) return
  current = name
  renderSide()
  renderList()
  document.querySelector('#list .sel')?.scrollIntoView({ block: 'nearest' })
})
canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.min(30, Math.max(0.5, zoom * (e.deltaY > 0 ? 1.1 : 0.9))); resize() }, { passive: false })
controls.enableZoom = false

current = PACKS[pack][0]
renderBar()
await render()
;(function loop() { controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop) })()

;(window as unknown as Record<string, unknown>).__infos = infos
;(window as unknown as Record<string, unknown>).__cam = { cam, controls, resize: () => resize(), setZoom: (z: number) => { zoom = z; resize() } }
;(window as unknown as Record<string, unknown>).__show = async (names: string[]) => {
  clearStage()
  for (let i = 0; i < names.length; i++) await place(pack, names[i], new THREE.Vector3(i * 1.6, 0, 0), 0, false)
  const c = ((names.length - 1) * 1.6) / 2
  controls.target.set(c, 0, 0)
  cam.position.set(c, 40, 0.001)
  zoom = names.length * 0.9
  resize()
  controls.update()
}

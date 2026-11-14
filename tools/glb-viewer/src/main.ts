import * as THREE from 'three'
import { ModelLibrary } from '../../../src/scene/modelLibrary'
import { fetchCatalog, type CatalogModel } from './modelCatalog'
import { ViewerScene } from './viewerScene'

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const list = element<HTMLUListElement>('models')
const filter = element<HTMLInputElement>('filter')
const toneSelect = element<HTMLSelectElement>('tone')
const info = element('info')
const viewer = new ViewerScene(element<HTMLCanvasElement>('canvas'))

let catalog: CatalogModel[] = []
let selected = new Set(location.hash.slice(1).split(',').filter(Boolean).map(decodeURIComponent))
let tone = 'a'
let refitOnNextShow = true

const saveSelection = () => history.replaceState(null, '', `#${[...selected].map(encodeURIComponent).join(',')}`)

function renderList() {
  const query = filter.value.trim().toLowerCase()
  list.replaceChildren(...catalog.filter(({ key }) => key.toLowerCase().includes(query)).map(({ key }) => {
    const item = document.createElement('li')
    const label = document.createElement('label')
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = selected.has(key)
    box.addEventListener('change', () => {
      if (box.checked) selected.add(key)
      else selected.delete(key)
      saveSelection()
      refitOnNextShow = true
      void showSelection()
    })
    label.append(box, key)
    item.append(label)
    return item
  }))
}

function renderTones() {
  const tones = [...new Set(catalog.filter(({ key }) => selected.has(key)).flatMap((model) => model.tones))].sort()
  toneSelect.replaceChildren(...tones.map((id) => new Option(`Tone ${id}`, id, false, id === tone)))
  toneSelect.disabled = tones.length < 2
}

const trisOf = (object: THREE.Object3D) => {
  let tris = 0
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    tris += (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position!.count) / 3
  })
  return tris
}

async function showSelection() {
  const keys = catalog.map((model) => model.key).filter((key) => selected.has(key))
  renderTones()
  if (!keys.length) {
    viewer.show([])
    info.textContent = ''
    return
  }
  const library = new ModelLibrary('/glb/')
  const withTone = keys.filter((key) => tone !== 'a' && catalog.find((model) => model.key === key)?.tones.includes(tone))
  try {
    await library.ensure(keys)
    await library.ensureTextureVariants(withTone.map((key) => `tone:${key}:${tone}` as never))
  } catch (error) {
    info.textContent = `Load failed: ${error instanceof Error ? error.message : String(error)}`
    return
  }
  const items = keys.map((key) => {
    const object = library.get(key).clone(true)
    if (withTone.includes(key)) {
      object.traverse((node) => {
        const mesh = node as THREE.Mesh
        if (mesh.isMesh) mesh.material = library.withTextureVariant(mesh.material, `tone:${key}:${tone}` as never)
      })
    }
    return { object, label: key }
  })
  viewer.show(items)
  if (refitOnNextShow) viewer.frame()
  refitOnNextShow = false
  info.textContent = items.map(({ label, object }) => {
    const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3())
    return `${label}: ${trisOf(object)} tris, ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`
  }).join('\n')
}

async function refreshCatalog() {
  catalog = await fetchCatalog()
  selected = new Set([...selected].filter((key) => catalog.some((model) => model.key === key)))
  renderList()
  await showSelection()
}

filter.addEventListener('input', renderList)
toneSelect.addEventListener('change', () => {
  tone = toneSelect.value
  void showSelection()
})
element<HTMLInputElement>('shadows').addEventListener('change', (event) => viewer.setShadows((event.target as HTMLInputElement).checked))
element<HTMLInputElement>('night').addEventListener('change', (event) => viewer.setNight((event.target as HTMLInputElement).checked))
element<HTMLInputElement>('grid').addEventListener('change', (event) => viewer.setGrid((event.target as HTMLInputElement).checked))
element('frame').addEventListener('click', () => viewer.frame())
import.meta.hot?.on('models-changed', () => void refreshCatalog())

void refreshCatalog()

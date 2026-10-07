import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { assetKey, isFbxPack, isObjPack } from './assetKeys'

export interface ModelInfo {
  size: THREE.Vector3
  min: THREE.Vector3
  max: THREE.Vector3
  tris: number
  meshes: number
  nodeScaled: boolean
}

interface LoadedModel {
  root: THREE.Object3D
  info: ModelInfo
}

const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()
const mtlLoader = new MTLLoader()
const threeMfLoader = new ThreeMFLoader()
const cache = new Map<string, Promise<LoadedModel>>()

const matteOf = (source: THREE.Material) => {
  const { color, map, vertexColors } = source as THREE.MeshPhongMaterial
  const { r, g, b } = color.getRGB(new THREE.Color(), THREE.SRGBColorSpace)
  return new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace), map, vertexColors, roughness: 1, metalness: 0 })
}

async function loadMaterials(pack: string, name: string) {
  const response = await fetch(`/models/${pack}/${name}.mtl`)
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) return null
  const directory = `/models/${pack}/${name.slice(0, name.lastIndexOf('/') + 1)}`
  mtlLoader.setResourcePath(directory)
  return mtlLoader.parse(await response.text(), directory)
}

async function loadObj(pack: string, name: string): Promise<THREE.Object3D> {
  const objLoader = new OBJLoader()
  const materials = await loadMaterials(pack, name)
  if (materials) objLoader.setMaterials(materials)
  return objLoader.loadAsync(`/models/${pack}/${name}.obj`)
}

async function load3mf(pack: string, name: string): Promise<THREE.Object3D> {
  const model = await threeMfLoader.loadAsync(`/models/${pack}/${name}`)
  model.rotation.x = -Math.PI / 2
  return new THREE.Group().add(model)
}

async function loadRoot(pack: string, name: string): Promise<THREE.Object3D> {
  if (isFbxPack(pack)) return fbxLoader.loadAsync(`/models/${pack}/${name}.fbx`)
  if (isObjPack(pack) && name.endsWith('.glb')) return (await gltfLoader.loadAsync(`/models/${pack}/${name}`)).scene
  if (isObjPack(pack)) return name.endsWith('.3mf') ? load3mf(pack, name) : loadObj(pack, name)
  return (await gltfLoader.loadAsync(`/models/${pack}/${name}.glb`)).scene
}

async function loadUncached(pack: string, name: string): Promise<LoadedModel> {
  const root = await loadRoot(pack, name)
  root.updateMatrixWorld(true)
  let tris = 0, meshes = 0, nodeScaled = false
  root.traverse((object) => {
    if (object !== root && object.scale.distanceTo(new THREE.Vector3(1, 1, 1)) > 1e-4) nodeScaled = true
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return
    meshes++
    tris += (mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3
    if (isObjPack(pack) && !mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals()
    if (isFbxPack(pack) || isObjPack(pack)) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(matteOf) : matteOf(mesh.material)
    for (const material of [mesh.material].flat() as THREE.MeshStandardMaterial[]) {
      if (!material.map) continue
      material.map.magFilter = THREE.NearestFilter
      material.map.needsUpdate = true
    }
  })
  const box = new THREE.Box3().setFromObject(root)
  return { root, info: { size: box.getSize(new THREE.Vector3()), min: box.min.clone(), max: box.max.clone(), tris, meshes, nodeScaled } }
}

export function loadModel(pack: string, name: string): Promise<LoadedModel> {
  const key = assetKey(pack, name)
  const cached = cache.get(key)
  if (cached) return cached
  const loading = loadUncached(pack, name)
  cache.set(key, loading)
  return loading
}

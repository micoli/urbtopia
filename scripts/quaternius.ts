import { unzipSync } from 'fflate';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { ExtractedFile } from './extractPack.ts';

export const TILE_FILL = 0.85;
export const MAX_PLANT_HEIGHT = 1.6;
export const PRODUCE_WIDTH = 0.4;
export const BUILDING_FILL = 1.9;

export interface QuaterniusPack {
  name: string;
  archive: string;
  files: string[];
}

export interface Size {
  width: number;
  height: number;
  depth: number;
}

export function plantScale(stages: readonly Size[]): number {
  const footprint = Math.max(...stages.map((size) => Math.max(size.width, size.depth)));
  const height = Math.max(...stages.map((size) => size.height));
  return Math.min(TILE_FILL / footprint, MAX_PLANT_HEIGHT / height);
}

export function fitScale(size: Size, width: number): number {
  return width / Math.max(size.width, size.depth);
}

type Placement = 'origin' | 'centered';

interface ModelPlan {
  scaleOf: (size: Size) => number;
  placement: Placement;
  turned?: boolean;
}

const growthStage = /^(.+)_[1-4]$/;
const suffixes = ['_1', '_2', '_3', '_4', '_Crop', '_Harvested'];
const speciesOf = (name: string): string => suffixes.reduce((base, suffix) => (base.endsWith(suffix) ? base.slice(0, -suffix.length) : base), name).replace(/^Flowers$/, 'Flower');

function installFileReader(): void {
  if (typeof globalThis.FileReader !== 'undefined') return;
  const blobText = async (blob: Blob) => Buffer.from(await blob.arrayBuffer());
  globalThis.FileReader = class {
    result: ArrayBuffer | string | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      void blobText(blob).then((buffer) => {
        this.result = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        this.onloadend?.();
      });
    }
    readAsDataURL(blob: Blob) {
      void blobText(blob).then((buffer) => {
        this.result = `data:application/octet-stream;base64,${buffer.toString('base64')}`;
        this.onloadend?.();
      });
    }
  } as unknown as typeof FileReader;
}

function parseFbx(data: Uint8Array): THREE.Group {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return new FBXLoader().parse(buffer, '');
}

function linearFbxColor(loaded: THREE.Color): THREE.Color {
  const { r, g, b } = loaded.getRGB(new THREE.Color(), THREE.SRGBColorSpace);
  return new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}

function standardMaterials(model: THREE.Object3D): void {
  model.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const convert = (material: THREE.Material) => new THREE.MeshStandardMaterial({ color: linearFbxColor((material as THREE.MeshPhongMaterial).color), roughness: 1, metalness: 0 });
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
}

function sizeOf(model: THREE.Object3D): Size {
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  return { width: size.x, height: size.y, depth: size.z };
}

function place(model: THREE.Object3D, scale: number, placement: Placement, turned = false): THREE.Group {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  model.position.set(placement === 'centered' ? -center.x : 0, -box.min.y, placement === 'centered' ? -center.z : 0);
  wrapper.add(model);
  wrapper.scale.setScalar(scale);
  if (turned) wrapper.rotation.y = Math.PI;
  wrapper.updateMatrixWorld(true);
  return wrapper;
}

async function toGlb(model: THREE.Object3D): Promise<Uint8Array> {
  installFileReader();
  const glb = await new GLTFExporter().parseAsync(model, { binary: true });
  return new Uint8Array(glb as ArrayBuffer);
}

function plansOf(pack: QuaterniusPack, sizes: Map<string, Size>): Map<string, ModelPlan> {
  const plans = new Map<string, ModelPlan>();
  if (pack.name === 'crops') {
    const scaleBySpecies = new Map<string, number>();
    for (const species of new Set(pack.files.map(speciesOf))) {
      const stages = [...sizes].filter(([name]) => growthStage.test(name) && speciesOf(name) === species).map(([, size]) => size);
      scaleBySpecies.set(species, plantScale(stages));
    }
    for (const name of pack.files) {
      const produce = name.endsWith('_Crop');
      plans.set(name, produce ? { scaleOf: (size) => fitScale(size, PRODUCE_WIDTH), placement: 'centered' } : { scaleOf: () => scaleBySpecies.get(speciesOf(name))!, placement: 'origin' });
    }
    return plans;
  }
  for (const name of pack.files) plans.set(name, { scaleOf: (size) => fitScale(size, BUILDING_FILL), placement: 'centered', turned: true });
  return plans;
}

export async function convertQuaterniusPack(archive: Uint8Array, pack: QuaterniusPack): Promise<ExtractedFile[]> {
  const entries = unzipSync(archive, { filter: ({ name }) => name.endsWith('.fbx') });
  const byName = new Map(Object.entries(entries).map(([path, data]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.fbx$/, ''), data]));
  const missing = pack.files.filter((name) => !byName.has(name));
  if (missing.length > 0) throw new Error(`Missing in the archive: ${missing.map((name) => `${name}.fbx`).join(', ')}`);

  const models = new Map(pack.files.map((name) => [name, parseFbx(byName.get(name)!)]));
  for (const model of models.values()) standardMaterials(model);
  const sizes = new Map([...models].map(([name, model]) => [name, sizeOf(model)]));
  const plans = plansOf(pack, sizes);
  return Promise.all(pack.files.map(async (name) => {
    const plan = plans.get(name)!;
    const placed = place(models.get(name)!, plan.scaleOf(sizes.get(name)!), plan.placement, plan.turned);
    return { path: `${name}.glb`, data: await toGlb(placed) };
  }));
}

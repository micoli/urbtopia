import { fitNatureModel } from './natureModelFit';
import { waterOutline } from './waterShape';
import { fitRailCorner } from './railModelFit';
import * as THREE from 'three';
import { FIELD_SOIL_MODEL, GARAGE_DOOR_MODEL, RED_CROSS_MODEL, WATER_TILE_MODEL, BRIDGE_DECK_MODEL, type TextureVariant } from './renderItems';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLibrary {
  private loader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();
  private variants = new Map<string, THREE.Texture>();
  private pendingVariants = new Map<string, Promise<THREE.Texture>>();
  private models = new Map<string, THREE.Object3D>();
  private pending = new Map<string, Promise<void>>();

  async ensure(keys: Iterable<string>): Promise<void> {
    await Promise.all([...new Set(keys)].map((key) => this.load(key)));
  }

  async ensureTextureVariants(variants: Iterable<TextureVariant>): Promise<void> {
    await Promise.all([...new Set(variants)].map(variant => {
      if (this.variants.has(variant)) return Promise.resolve();
      const pending = this.pendingVariants.get(variant);
      if (pending) return pending.then(() => undefined);
      const loading = this.textureLoader.loadAsync(`${import.meta.env.BASE_URL}models/${variantTexturePath(variant)}`).then(texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        this.variants.set(variant, texture);
        this.pendingVariants.delete(variant);
        return texture;
      });
      this.pendingVariants.set(variant, loading);
      return loading.then(() => undefined);
    }));
  }

  has(key: string): boolean {
    return this.models.has(key);
  }

  get(key: string): THREE.Object3D {
    const model = this.models.get(key);
    if (!model) throw new Error(`Model not loaded: ${key}`);
    return model;
  }

  withTextureVariant(source: THREE.Material | THREE.Material[], variant: TextureVariant): THREE.Material | THREE.Material[] {
    const replace = (material: THREE.Material): THREE.Material => {
      if (!(material as THREE.MeshStandardMaterial).map) return material;
      const clone = material.clone() as THREE.MeshStandardMaterial;
      const texture = this.variants.get(variant);
      if (!texture) throw new Error(`Texture variant not loaded: ${variant}`);
      clone.map = texture;
      return clone;
    };
    return Array.isArray(source) ? source.map(replace) : replace(source);
  }

  withTint(source: THREE.Material | THREE.Material[], tint: number): THREE.Material | THREE.Material[] {
    const replace = (material: THREE.Material): THREE.Material => {
      const clone = material.clone() as THREE.MeshStandardMaterial;
      clone.color.setHex(tint);
      return clone;
    };
    return Array.isArray(source) ? source.map(replace) : replace(source);
  }

  withRecolor(source: THREE.Material | THREE.Material[], color: number): THREE.Material | THREE.Material[] {
    const target = new THREE.Color(color);
    const replace = (material: THREE.Material): THREE.Material => {
      const clone = material.clone() as THREE.MeshStandardMaterial;
      clone.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float recolorLight = clamp(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)) / 0.75, 0.0, 1.15);
          diffuseColor.rgb = vec3(${target.r.toFixed(3)}, ${target.g.toFixed(3)}, ${target.b.toFixed(3)}) * recolorLight;`,
        );
      };
      clone.customProgramCacheKey = () => `recolor-${color}`;
      return clone;
    };
    return Array.isArray(source) ? source.map(replace) : replace(source);
  }

  private load(key: string): Promise<void> {
    if (this.models.has(key)) return Promise.resolve();
    const procedural = key === RED_CROSS_MODEL ? buildRedCross : key === GARAGE_DOOR_MODEL ? buildGarageDoor : key === FIELD_SOIL_MODEL ? buildFieldSoil : key.startsWith(`${WATER_TILE_MODEL}:`) ? () => buildWaterTile(...(key.slice(WATER_TILE_MODEL.length + 1).split(':') as [string, string, string])) : key === BRIDGE_DECK_MODEL ? buildBridgeDeck : null;
    if (procedural) {
      this.models.set(key, procedural());
      return Promise.resolve();
    }
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;
    const promise = this.loader.loadAsync(`${import.meta.env.BASE_URL}models/${key}.glb`).then((gltf) => {
      fitNatureModel(gltf.scene, key);
      if (key === 'trains/railroad-corner-small') fitRailCorner(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      this.models.set(key, gltf.scene);
    });
    this.pending.set(key, promise);
    return promise;
  }
}

function variantTexturePath(variant: TextureVariant): string {
  if (variant === 'roads-a') return 'roads/Textures/variation-a.png';
  return `suburban/Textures/variation-${variant}.png`;
}

function buildRedCross(): THREE.Object3D {
  const material = new THREE.MeshStandardMaterial({ color: 0xd62828 });
  const group = new THREE.Group();
  for (const [width, height] of [[0.5, 0.15], [0.15, 0.5]] as const) {
    group.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.03), material));
  }
  group.updateMatrixWorld(true);
  return group;
}

function buildFieldSoil(): THREE.Object3D {
  const group = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.02, 0.94), new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 }));
  soil.position.y = 0.01;
  group.add(soil);
  group.updateMatrixWorld(true);
  return group;
}

const WATER_THICKNESS = 0.04;
const WATER_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x3f8fd8, roughness: 0.25, metalness: 0.1 });

function waterSlab(points: readonly (readonly [number, number])[]): THREE.Mesh {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: WATER_THICKNESS, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, WATER_THICKNESS, 0);
  return new THREE.Mesh(geometry, WATER_MATERIAL);
}

function buildWaterTile(code: string, edges: string, variant: string): THREE.Object3D {
  const { outline, fillets } = waterOutline(code, edges, Number(variant));
  const group = new THREE.Group();
  group.add(waterSlab(outline), ...fillets.map(waterSlab));
  group.updateMatrixWorld(true);
  return group;
}

function buildBridgeDeck(): THREE.Object3D {
  const group = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.8 }));
  deck.position.y = 0.05;
  group.add(deck);
  group.updateMatrixWorld(true);
  return group;
}

function buildGarageDoor(): THREE.Object3D {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.03), new THREE.MeshStandardMaterial({ color: 0xe6e6e6 }));
  group.add(panel);
  const slat = new THREE.MeshStandardMaterial({ color: 0x7d7d7d });
  for (const y of [-0.12, -0.04, 0.04, 0.12]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.015, 0.035), slat);
    line.position.y = y;
    group.add(line);
  }
  group.updateMatrixWorld(true);
  return group;
}

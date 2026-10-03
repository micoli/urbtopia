import { fitNatureModel } from './natureModelFit';
import { fitRailCorner } from './railModelFit';
import * as THREE from 'three';
import { RED_CROSS_MODEL } from './renderItems';
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

  async ensureTextureVariants(variants: Iterable<'a' | 'b' | 'c'>): Promise<void> {
    await Promise.all([...new Set(variants)].map(variant => {
      if (this.variants.has(variant)) return Promise.resolve();
      const pending = this.pendingVariants.get(variant);
      if (pending) return pending.then(() => undefined);
      const loading = this.textureLoader.loadAsync(`${import.meta.env.BASE_URL}models/suburban/Textures/variation-${variant}.png`).then(texture => {
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

  withTextureVariant(source: THREE.Material | THREE.Material[], variant: 'a' | 'b' | 'c'): THREE.Material | THREE.Material[] {
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
    if (key === RED_CROSS_MODEL) {
      this.models.set(key, buildRedCross());
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

function buildRedCross(): THREE.Object3D {
  const material = new THREE.MeshStandardMaterial({ color: 0xd62828 });
  const group = new THREE.Group();
  for (const [width, height] of [[0.5, 0.15], [0.15, 0.5]] as const) {
    group.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.03), material));
  }
  group.updateMatrixWorld(true);
  return group;
}

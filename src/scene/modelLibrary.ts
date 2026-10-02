import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLibrary {
  private loader = new GLTFLoader();
  private models = new Map<string, THREE.Object3D>();
  private pending = new Map<string, Promise<void>>();

  async ensure(keys: Iterable<string>): Promise<void> {
    await Promise.all([...new Set(keys)].map((key) => this.load(key)));
  }

  get(key: string): THREE.Object3D {
    const model = this.models.get(key);
    if (!model) throw new Error(`Model not loaded: ${key}`);
    return model;
  }

  private load(key: string): Promise<void> {
    if (this.models.has(key)) return Promise.resolve();
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;
    const promise = this.loader.loadAsync(`${import.meta.env.BASE_URL}models/${key}.glb`).then((gltf) => {
      gltf.scene.updateMatrixWorld(true);
      this.models.set(key, gltf.scene);
    });
    this.pending.set(key, promise);
    return promise;
  }
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type SlotKind = 'window' | 'door' | 'bay' | 'balcony' | 'balconyDoor';

export const DEFAULT_VARIANT = 'classic';

const FILE_NAME: Record<SlotKind, string> = { window: 'window', door: 'door', bay: 'bay', balcony: 'balcony', balconyDoor: 'balcony-door' };

// Every `<type>-<variant>.glb` of assets/managed-models/architect is picked up: a new variant is a new file.
const URLS = import.meta.glob<string>('../../../assets/managed-models/architect/*/*.glb', { query: '?url', import: 'default', eager: true });

const templates = new Map<string, THREE.Object3D>();
let loading: Promise<void> | undefined;

const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.glb$/, '');

// The game's own models: until they have arrived the slots use plain boxes.
export function loadSlotModels(): Promise<void> {
  loading ??= (async () => {
    const loader = new GLTFLoader();
    await Promise.all(
      Object.entries(URLS).map(async ([path, url]) => {
        const gltf = await loader.loadAsync(url);
        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) node.castShadow = node.receiveShadow = true;
        });
        templates.set(nameOf(path), gltf.scene);
      }),
    );
  })().catch(() => undefined);
  return loading;
}

export function slotModel(kind: SlotKind, variant = DEFAULT_VARIANT): THREE.Object3D | undefined {
  return templates.get(`${FILE_NAME[kind]}-${variant}`)?.clone(true);
}

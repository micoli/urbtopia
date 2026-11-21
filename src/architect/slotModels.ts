import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import type { Brick, Decor } from '../core/architect/housePlan.ts';

export type SlotBrick = Exclude<Brick, 'wall'>;

// The file of each brick: `<type>-<variant>`, the name of its folder and of its GLB in assets/managed-models/architect.
const FILE_NAME: Record<SlotBrick, string> = {
  window: 'window-classic',
  windowArched: 'window-arched',
  windowShutters: 'window-shutters',
  windowRound: 'window-round',
  door: 'door-classic',
  doorArched: 'door-arched',
  doorDouble: 'door-double',
  doorGlazed: 'door-glazed',
  doorGarage: 'door-garage',
  bay: 'bay-classic',
  balcony: 'balcony-classic',
  balconyDoor: 'balcony-door-classic',
};

// The decors have the file of their name, in the same frame as the bricks: the outer plane of the wall is the origin.
const DECOR_FILE_NAME: Record<Decor, string> = {
  doorHood: 'door-hood',
  awning: 'awning',
  stripedAwning: 'awning-striped',
  pilasters: 'pilasters',
  stoneAccents: 'stone-accents',
  portico: 'portico',
  colonnade: 'colonnade',
  pergola: 'pergola',
  cypresses: 'cypresses',
};

// Every `<type>-<variant>.glb` of assets/managed-models/architect is picked up: a new variant is a new file.
const URLS = import.meta.glob<string>('../../assets/managed-models/architect/*/*.glb', { query: '?url', import: 'default', eager: true });

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

export function decorModel(decor: Decor): THREE.Object3D | undefined {
  return templates.get(DECOR_FILE_NAME[decor])?.clone(true);
}

// Undefined until the model has been made or loaded: the slot then falls back to plain boxes.
export function slotModel(brick: SlotBrick): THREE.Object3D | undefined {
  return templates.get(FILE_NAME[brick])?.clone(true);
}

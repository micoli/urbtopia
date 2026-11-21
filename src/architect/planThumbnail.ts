import * as THREE from 'three';
import type { Plan } from '../core/architect/housePlan.ts';
import { buildHouse } from './render.ts';
import { loadSlotModels } from './slotModels.ts';

const WIDTH = 192;
const HEIGHT = 144;
const FIELD_OF_VIEW = 30;
const VIEW_DIRECTION = new THREE.Vector3(1, 0.75, 1).normalize();

const cache = new Map<string, string>();
let renderer: THREE.WebGLRenderer | undefined;
let queue: Promise<unknown> = Promise.resolve();

function sharedRenderer(): THREE.WebGLRenderer {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  return renderer;
}

async function render(plan: Plan, key: string): Promise<string> {
  const cached = cache.get(key);
  if (cached) return cached;
  await loadSlotModels();
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#9aa57a', 1.3));
  const sun = new THREE.DirectionalLight('#fff4dc', 2.2);
  sun.position.set(6, 10, 4);
  scene.add(sun);
  const house = buildHouse(plan);
  scene.add(house);
  const sphere = new THREE.Box3().setFromObject(house).getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, WIDTH / HEIGHT, 0.1, 100);
  const distance = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(FIELD_OF_VIEW) / 2)) * 1.05;
  camera.position.copy(sphere.center).addScaledVector(VIEW_DIRECTION, distance);
  camera.lookAt(sphere.center);
  const context = sharedRenderer();
  context.render(scene, camera);
  const url = context.domElement.toDataURL('image/png');
  house.traverse((object) => {
    if (object instanceof THREE.Mesh) object.geometry.dispose();
  });
  cache.set(key, url);
  return url;
}

// A picture of a plan, drawn once and kept by plan: the renders run one after the other on a single renderer.
export function planThumbnail(plan: Plan): Promise<string> {
  const key = JSON.stringify(plan);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const rendered = queue.then(() => render(plan, key));
  queue = rendered.catch(() => undefined);
  return rendered;
}

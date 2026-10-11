import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AVATAR_IDS } from '../src/social/avatar';

const SIZE = 128;
const BUST_RATIO = 0.7;
const YAW = THREE.MathUtils.degToRad(35);
const PITCH = THREE.MathUtils.degToRad(8);
const canvas = document.querySelector('canvas')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE, false);
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(1, 2, 3);
scene.add(sun, new THREE.AmbientLight(0xffffff, 1.4));
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
const loader = new GLTFLoader();

async function render(id: string): Promise<string> {
  const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/mini-characters/${id}.glb`);
  scene.add(gltf.scene);
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  if (bounds.isEmpty()) throw new Error(`Empty avatar model: ${id}`);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const bustHeight = size.y * BUST_RATIO;
  const half = bustHeight / 2 * 1.15;
  const focus = new THREE.Vector3(center.x, bounds.max.y - bustHeight / 2, center.z);
  camera.left = -half; camera.right = half; camera.top = half; camera.bottom = -half;
  const distance = size.length() * 4 + 5;
  camera.position.copy(focus).add(new THREE.Vector3(Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH)).multiplyScalar(distance));
  camera.lookAt(focus);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const image = canvas.toDataURL('image/png');
  scene.remove(gltf.scene);
  return image;
}

export interface AvatarRenderer {
  ids: readonly string[];
  render: typeof render;
}

declare global {
  interface Window { avatarRenderer: AvatarRenderer; }
}

window.avatarRenderer = { ids: AVATAR_IDS, render };

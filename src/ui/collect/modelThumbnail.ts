import * as THREE from 'three';
import { ModelLibrary } from '../../scene/modelLibrary';

const SIZE = 96;

interface ThumbnailRig {
  library: ModelLibrary;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
}

let rig: ThumbnailRig | null = null;
const thumbnails = new Map<string, Promise<string | null>>();

function createRig(): ThumbnailRig {
  const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE, false);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(20, 40, 10);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 1.2));
  return { library: new ModelLibrary(), renderer, scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 1000) };
}

async function render(model: string): Promise<string> {
  rig ??= createRig();
  const { library, renderer, scene, camera } = rig;
  await library.ensure([model]);
  const object = library.get(model).clone(true);
  scene.add(object);
  scene.updateMatrixWorld(true);
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  const extent = Math.max(0.05, sphere.radius) * 1.1;
  camera.left = -extent;
  camera.right = extent;
  camera.top = extent;
  camera.bottom = -extent;
  camera.position.copy(sphere.center).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(extent * 4));
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  scene.remove(object);
  return renderer.domElement.toDataURL('image/png');
}

export function modelThumbnail(model: string): Promise<string | null> {
  const cached = thumbnails.get(model);
  if (cached) return cached;
  const pending = render(model).catch(() => null);
  thumbnails.set(model, pending);
  return pending;
}

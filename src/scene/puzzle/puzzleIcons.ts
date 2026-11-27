import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ModelLibrary } from '../modelLibrary';
import { PUZZLE_LIGHTINGS } from '../puzzleLighting';

const SIZE = 128;
const PITCH = (20 * Math.PI) / 180;
const DISTANCE = 20;
const MARGIN = 1.15;

interface Context {
  renderer: THREE.WebGLRenderer;
  library: ModelLibrary;
  environment: THREE.Texture;
}

let context: Context | undefined;
const icons = new Map<string, Promise<string>>();

function shared(): Context {
  if (context) return context;
  const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(SIZE, SIZE, false);
  renderer.setClearColor(0x000000, 0);
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
  generator.dispose();
  context = { renderer, library: new ModelLibrary(), environment };
  return context;
}

async function render(model: string): Promise<string> {
  const { renderer, library, environment } = shared();
  await library.ensure([model]);
  const lighting = PUZZLE_LIGHTINGS.vivid;
  renderer.toneMapping = lighting.toneMapping;
  renderer.toneMappingExposure = lighting.exposure;
  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = lighting.environmentIntensity;
  const sun = new THREE.DirectionalLight(lighting.sunColor, lighting.sunIntensity);
  sun.position.set(-8, 16, 30);
  const sky = new THREE.HemisphereLight(lighting.skyColor, lighting.groundColor, lighting.hemisphereIntensity);
  const root = library.get(model).clone(true);
  scene.add(sun, sky, root);
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const half = (Math.max(size.x, size.y) / 2) * MARGIN;
  const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100);
  camera.position.set(centre.x, centre.y + DISTANCE * Math.tan(PITCH), centre.z + DISTANCE);
  camera.lookAt(centre);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

// A picture of a model as the Daily puzzle lights it, drawn once and kept: the icon of a Part in the tray.
export function partIcon(model: string): Promise<string> {
  let icon = icons.get(model);
  if (!icon) {
    icon = render(model);
    icons.set(model, icon);
  }
  return icon;
}

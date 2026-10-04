import * as THREE from 'three';
import { CODEX_ENTRIES, codexImageKey, HOME_COLOR_VARIANTS, validateCodex } from '../src/codex/catalog';
import { codexSnapshot } from '../src/codex/snapshot';
import { ChunkedWorld } from '../src/scene/ChunkedWorld';
import { EcologyLayer } from '../src/scene/EcologyLayer';
import { ModelLibrary } from '../src/scene/modelLibrary';
import { MODEL_KEYS, PROCEDURAL_MODELS, renderItemsOf } from '../src/scene/renderItems';

validateCodex();
const library = new ModelLibrary();
await library.ensure([...MODEL_KEYS, ...PROCEDURAL_MODELS]);
await library.ensureTextureVariants(['a', 'b', 'c', 'roads-a']);
const canvas = document.querySelector('canvas')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(512, 512, false);
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef4ec);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(20, 40, 10);
const world = new ChunkedWorld(library);
const ecology = new EcologyLayer(library);
const objects = new THREE.Group();
objects.add(world.root, ecology.root);
scene.add(objects, sun, new THREE.AmbientLight(0xffffff, 1.2));
const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.01, 1000);

const variants = CODEX_ENTRIES.flatMap(entry => entry.levels.flatMap(level => {
  const colors = entry.id === 'home' || entry.id === 'solarHome' ? HOME_COLOR_VARIANTS : [undefined];
  return colors.map(colorVariant => {
  const state = codexSnapshot(entry.id, level, colorVariant);
  const signature = JSON.stringify([
    renderItemsOf(state), state.brtRoads,
    state.buildings.map(b => ({ type: b.type, x: b.x, y: b.y, rotation: b.rotation })),
  ]);
  return { id: entry.id, level, colorVariant, key: codexImageKey(entry.id, level, colorVariant), signature };
  });
}));

function render(key: string): string {
  const variant = variants.find(variant => variant.key === key);
  if (!variant) throw new Error(`Unknown codex variant: ${key}`);
  const state = codexSnapshot(variant.id, variant.level, variant.colorVariant);
  world.sync(renderItemsOf(state));
  ecology.sync(state, null);
  objects.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(objects);
  if (bounds.isEmpty()) throw new Error(`Empty codex model: ${key}`);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const extent = Math.max(0.1, sphere.radius) * 1.15;
  camera.left = -extent; camera.right = extent; camera.top = extent; camera.bottom = -extent;
  camera.position.copy(sphere.center).add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(extent * 4));
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  return canvas.toDataURL('image/png');
}

export interface CodexRenderer {
  variants: typeof variants;
  render: typeof render;
}

declare global {
  interface Window { codexRenderer: CodexRenderer; }
}

window.codexRenderer = { variants, render };

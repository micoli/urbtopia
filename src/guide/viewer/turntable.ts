import * as THREE from 'three';
import type { CodexId } from '../../codex/catalog';
import { codexSnapshot } from '../../codex/snapshot';
import type { ColorVariant } from '../../core';
import { BridgeLayer } from '../../scene/BridgeLayer';
import { ChunkedWorld } from '../../scene/ChunkedWorld';
import { EcologyLayer } from '../../scene/EcologyLayer';
import { ModelLibrary } from '../../scene/modelLibrary';
import { renderItemsOf } from '../../scene/renderItems';

export interface Turntable {
  show: (id: CodexId, level: number, colorVariant: ColorVariant | undefined) => Promise<void>;
  dispose: () => void;
}

const SPIN_PER_MS = 0.0004;
const DRAG_SPIN = 0.01;

export function createTurntable(canvas: HTMLCanvasElement, modelsUrl: string): Turntable {
  const library = new ModelLibrary(modelsUrl);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(20, 40, 10);
  const world = new ChunkedWorld(library);
  const ecology = new EcologyLayer(library);
  const bridges = new BridgeLayer(library);
  const objects = new THREE.Group();
  objects.add(world.root, ecology.root, bridges.root);
  const pivot = new THREE.Group();
  pivot.add(objects);
  scene.add(pivot, sun, new THREE.AmbientLight(0xffffff, 1.2));
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.01, 1000);

  let dragging: number | null = null;
  let last = performance.now();
  let frame = 0;

  const draw = (time: number) => {
    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth * devicePixelRatio || canvas.height !== clientHeight * devicePixelRatio) {
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(clientWidth, clientHeight, false);
    }
    if (dragging === null) pivot.rotation.y += (time - last) * SPIN_PER_MS;
    last = time;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  };

  const press = (event: PointerEvent) => {
    dragging = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (dragging === null) return;
    pivot.rotation.y += (event.clientX - dragging) * DRAG_SPIN;
    dragging = event.clientX;
  };
  const release = () => { dragging = null; };
  canvas.addEventListener('pointerdown', press);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  frame = requestAnimationFrame(draw);

  return {
    show: async (id, level, colorVariant) => {
      const state = codexSnapshot(id, level, colorVariant);
      const items = renderItemsOf(state);
      await library.ensure([...new Set(items.map(item => item.model))]);
      await library.ensureTextureVariants(items.flatMap(item => item.textureVariant ? [item.textureVariant] : []));
      world.sync(items);
      ecology.sync(state, null);
      bridges.sync(state);
      objects.position.set(0, 0, 0);
      objects.updateMatrixWorld(true);
      const sphere = new THREE.Box3().setFromObject(objects).getBoundingSphere(new THREE.Sphere());
      objects.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
      const extent = Math.max(0.1, sphere.radius) * 1.1;
      camera.left = -extent; camera.right = extent; camera.top = extent; camera.bottom = -extent;
      camera.position.copy(new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(extent * 4));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', press);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
      renderer.dispose();
    },
  };
}

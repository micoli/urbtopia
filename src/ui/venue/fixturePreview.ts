import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FIXTURES, type FixtureId } from '../../core';
import { ModelLibrary } from '../../scene/modelLibrary';

// Small pictures of the Fixtures for the build menu, drawn once each with the models of the interior and kept.
const WIDTH = 88;
const HEIGHT = 76;

interface Studio {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  library: ModelLibrary;
}

let studio: Studio | null | undefined;
const pictures = new Map<FixtureId, Promise<string | undefined>>();
let queue: Promise<unknown> = Promise.resolve();

function open(): Studio | null {
  if (studio !== undefined) return studio;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(WIDTH, HEIGHT, false);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.9;
    const scene = new THREE.Scene();
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
    sun.position.set(6, 12, 8);
    scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x8a7a64, 1.3), sun);
    studio = { renderer, scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50), library: new ModelLibrary() };
  } catch {
    studio = null;
  }
  return studio;
}

async function draw(id: FixtureId): Promise<string | undefined> {
  const room = open();
  if (!room) return undefined;
  const spec = FIXTURES[id];
  try {
    await room.library.ensure([spec.model]);
    const holder = new THREE.Group();
    holder.add(cloneModel(room.library.get(spec.model)));
    if (spec.tint !== undefined) holder.traverse(node => { if (node instanceof THREE.Mesh) node.material = room.library.withTint(node.material, spec.tint!); });
    room.scene.add(holder);
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder);
    const center = box.getCenter(new THREE.Vector3());
    holder.position.sub(center);
    holder.updateMatrixWorld(true);
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius * 1.05;
    const aspect = WIDTH / HEIGHT;
    room.camera.left = -radius * aspect;
    room.camera.right = radius * aspect;
    room.camera.top = radius;
    room.camera.bottom = -radius;
    const pitch = Math.atan(1 / Math.SQRT2), yaw = Math.PI / 4, distance = 20;
    room.camera.position.set(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance);
    room.camera.lookAt(0, 0, 0);
    room.camera.updateProjectionMatrix();
    room.renderer.render(room.scene, room.camera);
    const picture = room.renderer.domElement.toDataURL('image/png');
    room.scene.remove(holder);
    return picture;
  } catch {
    return undefined;
  }
}

// Pictures are drawn one after the other, since they share a single renderer.
export function fixturePicture(id: FixtureId): Promise<string | undefined> {
  const known = pictures.get(id);
  if (known) return known;
  const next = queue.then(() => draw(id));
  queue = next.catch(() => undefined);
  pictures.set(id, next);
  return next;
}

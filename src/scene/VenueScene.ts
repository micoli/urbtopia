import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FIXTURES, entranceCell, fixtureFootprint, fixtureIdsOf, type Coord, type VenueFixture, type VenueType } from '../core';
import { ModelLibrary } from './modelLibrary';
import { VENUE_CORNER_PLACEMENT, VENUE_CROWD_MODELS, VENUE_SHELL_MODELS } from './renderItems';
import { VenueCrowdLayer } from './VenueCrowdLayer';
import type { Figure } from './venueCrowd';
import { clampPan, nextZoom } from './venueZoom';

const TAP_DISTANCE = 6;
const SELECTION_COLOR = 0x4da3ff;
const WARNING_COLOR = 0xff9500;
const BROKEN_COLOR = 0xe5484d;
const ENTRANCE_COLOR = 0xe8d9a8;
const VALID_COLOR = 0x35d07f;
const INVALID_COLOR = 0xe5484d;

export interface VenueGhost {
  tiles: readonly Coord[];
  valid: boolean;
}

export class VenueScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  private library = new ModelLibrary();
  private shell = new THREE.Group();
  private fixtureRoot = new THREE.Group();
  private ghostRoot = new THREE.Group();
  private selectionRoot = new THREE.Group();
  private warningRoot = new THREE.Group();
  private crowd: VenueCrowdLayer;
  private lastFrame = performance.now();
  private fixturesSignature = '';
  private zoom = 1;
  private pan = { x: 0, z: 0 };
  private brokenRoot = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private resizeObserver: ResizeObserver;
  private frameHandle = 0;
  private dirty = true;
  private pointerDown: { x: number; y: number } | null = null;
  private lastFixtures: readonly VenueFixture[] = [];
  private builtSize = 0;
  private disposed = false;
  readonly ready: Promise<void>;
  onTapCell: (cell: Coord) => void = () => {};
  onHoverCell: (cell: Coord | null) => void = () => {};

  private shellModels: { floor: string; wall: string; corner: string };
  private cornerPlacement: { x: number; z: number; rotation: number };

  constructor(private canvas: HTMLCanvasElement, private size: number, private tier = 1, venueType: VenueType = 'arcade', seed = 1) {
    this.shellModels = VENUE_SHELL_MODELS[venueType];
    this.cornerPlacement = VENUE_CORNER_PLACEMENT[venueType];
    this.crowd = new VenueCrowdLayer(this.library, size, entranceCell(tier), seed);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.scene.background = new THREE.Color(0x232838);
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
    sun.position.set(6, 12, 8);
    const sky = new THREE.HemisphereLight(0xcfe0ff, 0x8a7a64, 1.1);
    this.scene.add(sun, sky, this.shell, this.fixtureRoot, this.crowd.root, this.warningRoot, this.brokenRoot, this.selectionRoot, this.ghostRoot);
    this.ready = this.library.ensure([...Object.values(this.shellModels), ...new Set([...fixtureIdsOf(venueType).map(id => FIXTURES[id].model), ...Object.values(VENUE_CROWD_MODELS)])]).then(() => {
      if (this.disposed) return;
      this.buildShell();
      this.rebuildFixtures();
      this.crowd.enable();
      this.dirty = true;
    });
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  setFixtures(fixtures: readonly VenueFixture[]): void {
    const signature = JSON.stringify(fixtures.map(fixture => [fixture.id, fixture.type, fixture.x, fixture.y, fixture.rotation]));
    if (signature === this.fixturesSignature) return;
    this.fixturesSignature = signature;
    this.lastFixtures = fixtures;
    this.crowd.setFixtures(fixtures);
    this.rebuildFixtures();
  }

  setCrowd(plan: readonly Figure[], mood: number): void {
    this.crowd.setPlan(plan, mood);
  }

  setSize(size: number): void {
    if (size === this.size) return;
    this.size = size;
    this.crowd.setSize(size);
    this.buildShell();
    this.resize();
  }

  setGhost(ghost: VenueGhost | null): void {
    this.markTiles(this.ghostRoot, ghost?.tiles ?? [], ghost ? (ghost.valid ? VALID_COLOR : INVALID_COLOR) : VALID_COLOR);
  }

  setSelection(tiles: readonly Coord[]): void {
    this.markTiles(this.selectionRoot, tiles, SELECTION_COLOR);
  }

  setBroken(tiles: readonly Coord[]): void {
    this.markTiles(this.brokenRoot, tiles, BROKEN_COLOR);
  }

  setWarnings(tiles: readonly Coord[]): void {
    this.markTiles(this.warningRoot, tiles, WARNING_COLOR);
  }

  private markTiles(root: THREE.Group, tiles: readonly Coord[], color: number): void {
    this.clear(root, true);
    if (tiles.length > 0) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthTest: false });
      for (const tile of tiles) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(tile.x + 0.5, 0.05, tile.y + 0.5);
        mesh.renderOrder = 10;
        root.add(mesh);
      }
    }
    this.dirty = true;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.clear(this.ghostRoot, true);
    this.clear(this.selectionRoot, true);
    this.clear(this.warningRoot, true);
    this.clear(this.brokenRoot, true);
    this.crowd.dispose();
    this.renderer.dispose();
  }

  private buildShell(): void {
    if (!this.library.has(this.shellModels.floor) || this.builtSize === this.size) return;
    this.builtSize = this.size;
    this.clear(this.shell);
    const entrance = entranceCell(this.tier);
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) this.place(this.shell, this.shellModels.floor, x + 0.5, y + 0.5, 0);
    }
    for (let index = 0; index < this.size; index++) {
      if (index !== entrance.x) this.place(this.shell, this.shellModels.wall, index + 0.5, 0, 0);
      this.place(this.shell, this.shellModels.wall, 0, index + 0.5, Math.PI / 2);
    }
    this.place(this.shell, this.shellModels.corner, this.cornerPlacement.x, this.cornerPlacement.z, this.cornerPlacement.rotation);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: ENTRANCE_COLOR }));
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(entrance.x + 0.5, 0.04, entrance.y + 0.5);
    this.shell.add(mat);
    this.dirty = true;
  }

  private rebuildFixtures(): void {
    if (!this.library.has(this.shellModels.floor)) return;
    this.clear(this.fixtureRoot);
    for (const fixture of this.lastFixtures) {
      const spec = FIXTURES[fixture.type];
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const object = this.place(this.fixtureRoot, spec.model, fixture.x + width / 2, fixture.y + depth / 2, -fixture.rotation * Math.PI / 2);
      if (spec.tint !== undefined) this.tint(object, spec.tint);
    }
    this.dirty = true;
  }

  private tint(object: THREE.Object3D, color: number): void {
    object.traverse(node => {
      if (node instanceof THREE.Mesh) node.material = this.library.withTint(node.material, color);
    });
  }

  private place(parent: THREE.Group, model: string, x: number, z: number, rotation: number): THREE.Object3D {
    const holder = new THREE.Group();
    holder.add(cloneModel(this.library.get(model)));
    holder.position.set(x, 0, z);
    holder.rotation.y = rotation;
    parent.add(holder);
    return holder;
  }

  private clear(group: THREE.Group, disposeMarks = false): void {
    for (const child of [...group.children]) {
      group.remove(child);
      if (!disposeMarks || !(child instanceof THREE.Mesh)) continue;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  }

  private groundAt(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
    this.raycaster.setFromCamera(pointer, this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
  }

  private cellAt(clientX: number, clientY: number): Coord | null {
    const hit = this.groundAt(clientX, clientY);
    if (!hit) return null;
    const cell = { x: Math.floor(hit.x), y: Math.floor(hit.z) };
    return cell.x >= 0 && cell.y >= 0 && cell.x < this.size && cell.y < this.size ? cell : null;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const start = this.pointerDown;
    this.pointerDown = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_DISTANCE) return;
    const cell = this.cellAt(event.clientX, event.clientY);
    if (cell) this.onTapCell(cell);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    this.onHoverCell(this.cellAt(event.clientX, event.clientY));
  };

  private handlePointerLeave = (): void => {
    this.onHoverCell(null);
  };

  // The wheel zooms around the point under the pointer, which stays where it is on the screen.
  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const zoom = nextZoom(this.zoom, event.deltaY);
    if (zoom === this.zoom) return;
    const before = this.groundAt(event.clientX, event.clientY);
    this.zoom = zoom;
    this.resize();
    const after = this.groundAt(event.clientX, event.clientY);
    if (before && after) {
      this.pan = clampPan({ x: this.pan.x + before.x - after.x, z: this.pan.z + before.z - after.z }, this.zoom, this.size);
      this.resize();
    }
    this.pan = clampPan(this.pan, this.zoom, this.size);
    this.onHoverCell(this.cellAt(event.clientX, event.clientY));
  };

  private resize(): void {
    const width = Math.max(1, this.canvas.clientWidth), height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfHeight = Math.max(this.size * 0.55 + 1.2, (this.size * 0.75 + 0.6) / aspect) / this.zoom;
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.pan = clampPan(this.pan, this.zoom, this.size);
    const center = this.size / 2, distance = 40, pitch = Math.atan(1 / Math.SQRT2), yaw = Math.PI / 4;
    const focusX = center + this.pan.x, focusZ = center + this.pan.z;
    this.camera.position.set(focusX + Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, focusZ + Math.cos(yaw) * Math.cos(pitch) * distance);
    this.camera.lookAt(focusX, 0.3, focusZ);
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private frame = (now: number): void => {
    const delta = Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.crowd.update(delta, this.camera);
    if (this.crowd.active) this.dirty = true;
    if (this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

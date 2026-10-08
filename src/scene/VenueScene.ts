import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ARCADE_FIXTURES, entranceCell, fixtureFootprint, type Coord, type VenueFixture } from '../core';
import { ModelLibrary } from './modelLibrary';
import { VENUE_CROWD_MODELS, VENUE_SHELL_MODELS } from './renderItems';
import type { Figure } from './venueCrowd';

const { floor: FLOOR_MODEL, wall: WALL_MODEL, corner: CORNER_MODEL } = VENUE_SHELL_MODELS;
const TAP_DISTANCE = 6;
const CROWD_SCALE = 0.7;
const QUEUE_TINT = 0xffd9a8;
const EMPLOYEE_TINT = 0xffffff;
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
  private crowdRoot = new THREE.Group();
  private lastCrowd: readonly Figure[] = [];
  private crowdSignature = '';
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

  constructor(private canvas: HTMLCanvasElement, private size: number, private tier = 1) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.scene.background = new THREE.Color(0x232838);
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
    sun.position.set(6, 12, 8);
    const sky = new THREE.HemisphereLight(0xcfe0ff, 0x8a7a64, 1.1);
    this.scene.add(sun, sky, this.shell, this.fixtureRoot, this.crowdRoot, this.warningRoot, this.brokenRoot, this.selectionRoot, this.ghostRoot);
    this.ready = this.library.ensure([FLOOR_MODEL, WALL_MODEL, CORNER_MODEL, ...new Set([...Object.values(ARCADE_FIXTURES).map(spec => spec.model), ...Object.values(VENUE_CROWD_MODELS)])]).then(() => {
      if (this.disposed) return;
      this.buildShell();
      this.rebuildFixtures();
      this.rebuildCrowd();
      this.dirty = true;
    });
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  setFixtures(fixtures: readonly VenueFixture[]): void {
    this.lastFixtures = fixtures;
    this.rebuildFixtures();
  }

  setCrowd(figures: readonly Figure[]): void {
    const signature = JSON.stringify(figures);
    if (signature === this.crowdSignature) return;
    this.crowdSignature = signature;
    this.lastCrowd = figures;
    this.rebuildCrowd();
  }

  setSize(size: number): void {
    if (size === this.size) return;
    this.size = size;
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
    this.clear(this.ghostRoot, true);
    this.clear(this.selectionRoot, true);
    this.clear(this.warningRoot, true);
    this.clear(this.brokenRoot, true);
    this.renderer.dispose();
  }

  private buildShell(): void {
    if (!this.library.has(FLOOR_MODEL) || this.builtSize === this.size) return;
    this.builtSize = this.size;
    this.clear(this.shell);
    const entrance = entranceCell(this.tier);
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) this.place(this.shell, FLOOR_MODEL, x + 0.5, y + 0.5, 0);
    }
    for (let index = 0; index < this.size; index++) {
      if (index !== entrance.x) this.place(this.shell, WALL_MODEL, index + 0.5, 0, 0);
      this.place(this.shell, WALL_MODEL, 0, index + 0.5, Math.PI / 2);
    }
    this.place(this.shell, CORNER_MODEL, -0.1, -0.1, Math.PI / 2);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: ENTRANCE_COLOR }));
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(entrance.x + 0.5, 0.04, entrance.y + 0.5);
    this.shell.add(mat);
    this.dirty = true;
  }

  private rebuildFixtures(): void {
    if (!this.library.has(FLOOR_MODEL)) return;
    this.clear(this.fixtureRoot);
    for (const fixture of this.lastFixtures) {
      const spec = ARCADE_FIXTURES[fixture.type];
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const object = this.place(this.fixtureRoot, spec.model, fixture.x + width / 2, fixture.y + depth / 2, -fixture.rotation * Math.PI / 2);
      if (spec.tint !== undefined) this.tint(object, spec.tint);
    }
    this.dirty = true;
  }

  private rebuildCrowd(): void {
    if (!this.library.has(FLOOR_MODEL)) return;
    this.clear(this.crowdRoot);
    for (const figure of this.lastCrowd) {
      const holder = this.place(this.crowdRoot, VENUE_CROWD_MODELS[figure.kind], figure.x + 0.5, figure.y + 0.5, figure.facing);
      holder.scale.setScalar(CROWD_SCALE);
      if (figure.kind === 'queue') this.tint(holder, QUEUE_TINT);
      if (figure.kind === 'employee') this.tint(holder, EMPLOYEE_TINT);
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

  private cellAt(clientX: number, clientY: number): Coord | null {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
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

  private resize(): void {
    const width = Math.max(1, this.canvas.clientWidth), height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfHeight = Math.max(this.size * 0.55 + 1.2, (this.size * 0.75 + 0.6) / aspect);
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    const center = this.size / 2, distance = 40, pitch = Math.atan(1 / Math.SQRT2), yaw = Math.PI / 4;
    this.camera.position.set(center + Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, center + Math.cos(yaw) * Math.cos(pitch) * distance);
    this.camera.lookAt(center, 0.3, center);
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private frame = (): void => {
    if (this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

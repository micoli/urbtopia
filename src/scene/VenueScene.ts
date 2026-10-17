import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FIXTURES, conditionOf, entranceCell, fixtureFootprint, fixtureIdsOf, type Coord, type VenueFixture, type VenueType } from '../core';
import { ModelLibrary } from './modelLibrary';
import { VENUE_CORNER_PLACEMENT, VENUE_SHELL_MODELS } from './renderItems';
import { venueCrowdModelsOf } from './venueCrowdModels';
import { VenueCrowdLayer } from './VenueCrowdLayer';
import { ShelfStockLayer } from './ShelfStockLayer';
import type { Figure } from './venueCrowd';
import { clampPan, nextZoom, pinchZoom } from './venueZoom';
import { renderPixelRatio, shouldRenderFrame, watchPageHidden, wantsAntialias } from './renderBudget';

const TAP_DISTANCE = 6;
const SELECTION_COLOR = 0x4da3ff;
const WARNING_COLOR = 0xff9500;
const BROKEN_COLOR = 0xe5484d;
const ENTRANCE_COLOR = 0xe8d9a8;
const VALID_COLOR = 0x35d07f;
const INVALID_COLOR = 0xe5484d;
const WEAR_BAR_FROM_CONDITION = 50;
const WEAR_BAR_ORANGE_HUE = 30 / 360;
const WEAR_BAR_BACK = 0x1b1f2b;
const WEAR_BAR_WIDTH = 0.8;
const WEAR_BAR_THICKNESS = 0.1;
const WEAR_BAR_HEIGHT = 1.4;

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
  private wearRoot = new THREE.Group();
  private shelfStock = new ShelfStockLayer(() => { this.dirty = true; });
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private resizeObserver: ResizeObserver;
  private frameHandle = 0;
  private hidden = document.hidden;
  private stopWatchingHidden: () => void;
  private dirty = true;
  private pointerDown: { x: number; y: number; ground: THREE.Vector3 | null } | null = null;
  private dragged = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance = 0;
  private lastFixtures: readonly VenueFixture[] = [];
  private builtSize = 0;
  private disposed = false;
  readonly ready: Promise<void>;
  // `repeat` is true when Shift is held: the player keeps placing the same item.
  onTapCell: (cell: Coord, repeat: boolean) => void = () => {};
  onHoverCell: (cell: Coord | null) => void = () => {};

  private shellModels: { floor: string; wall: string; corner: string };
  private cornerPlacement: { x: number; z: number; rotation: number };

  constructor(private canvas: HTMLCanvasElement, private size: number, private tier = 1, venueType: VenueType = 'arcade', seed = 1) {
    this.shellModels = VENUE_SHELL_MODELS[venueType];
    this.cornerPlacement = VENUE_CORNER_PLACEMENT[venueType];
    this.crowd = new VenueCrowdLayer(this.library, size, entranceCell(tier), seed, venueType);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: wantsAntialias(), powerPreference: 'low-power' });
    this.renderer.setPixelRatio(renderPixelRatio());
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.scene.background = new THREE.Color(0x232838);
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
    sun.position.set(6, 12, 8);
    const sky = new THREE.HemisphereLight(0xcfe0ff, 0x8a7a64, 1.1);
    this.scene.add(sun, sky, this.shell, this.fixtureRoot, this.crowd.root, this.warningRoot, this.brokenRoot, this.wearRoot, this.shelfStock.root, this.selectionRoot, this.ghostRoot);
    this.ready = this.library.ensure([...Object.values(this.shellModels), ...new Set([...fixtureIdsOf(venueType).map(id => FIXTURES[id].model), ...venueCrowdModelsOf(venueType)])]).then(() => {
      if (this.disposed) return;
      this.buildShell();
      this.rebuildFixtures();
      this.crowd.enable();
      this.dirty = true;
    });
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.stopWatchingHidden = watchPageHidden((hidden) => {
      this.hidden = hidden;
      cancelAnimationFrame(this.frameHandle);
      if (hidden) return;
      this.lastFrame = performance.now();
      this.dirty = true;
      this.frameHandle = requestAnimationFrame(this.frame);
    });
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  setFixtures(fixtures: readonly VenueFixture[]): void {
    if (this.shelfStock.sync(fixtures)) this.dirty = true;
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

  setWear(fixtures: readonly VenueFixture[]): void {
    this.clear(this.wearRoot, true);
    for (const fixture of fixtures) {
      const condition = conditionOf(fixture);
      if (condition > WEAR_BAR_FROM_CONDITION) continue;
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const bar = new THREE.Group();
      bar.position.set(fixture.x + width / 2, WEAR_BAR_HEIGHT, fixture.y + depth / 2);
      bar.quaternion.copy(this.camera.quaternion);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(WEAR_BAR_WIDTH, WEAR_BAR_THICKNESS), new THREE.MeshBasicMaterial({ color: WEAR_BAR_BACK, depthTest: false }));
      const wear = (100 - condition) / 100;
      const fill = new THREE.Mesh(new THREE.PlaneGeometry(WEAR_BAR_WIDTH * wear, WEAR_BAR_THICKNESS), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(WEAR_BAR_ORANGE_HUE * condition / WEAR_BAR_FROM_CONDITION, 0.9, 0.5), depthTest: false }));
      fill.position.set(-WEAR_BAR_WIDTH * (1 - wear) / 2, 0, 0.001);
      back.renderOrder = 11;
      fill.renderOrder = 12;
      bar.add(back, fill);
      this.wearRoot.add(bar);
    }
    this.dirty = true;
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
    this.stopWatchingHidden();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.clear(this.ghostRoot, true);
    this.clear(this.selectionRoot, true);
    this.clear(this.warningRoot, true);
    this.clear(this.brokenRoot, true);
    this.clear(this.wearRoot, true);
    this.crowd.dispose();
    this.shelfStock.dispose();
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
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      this.pointerDown = null;
      this.dragged = true;
      this.lastPinchDistance = this.pinchDistance();
      return;
    }
    this.pointerDown = { x: event.clientX, y: event.clientY, ground: this.groundAt(event.clientX, event.clientY) };
    this.dragged = false;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that is no longer active cannot be captured; the drag still works inside the canvas.
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    const start = this.pointerDown;
    this.pointerDown = null;
    this.canvas.style.cursor = '';
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (!start || this.dragged) return;
    const cell = this.cellAt(event.clientX, event.clientY);
    if (cell) this.onTapCell(cell, event.shiftKey);
  };

  // Dragging with the button down moves the room under the pointer, as in the city.
  private handlePointerMove = (event: PointerEvent): void => {
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      this.handlePinch();
      return;
    }
    const start = this.pointerDown;
    if (start && (this.dragged || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_DISTANCE)) {
      this.dragged = true;
      this.canvas.style.cursor = 'grabbing';
      const now = this.groundAt(event.clientX, event.clientY);
      if (start.ground && now) {
        this.pan = clampPan({ x: this.pan.x + start.ground.x - now.x, z: this.pan.z + start.ground.z - now.z }, this.zoom, this.size);
        this.resize();
      }
      this.onHoverCell(null);
      return;
    }
    this.onHoverCell(this.cellAt(event.clientX, event.clientY));
  };

  private pinchPoints(): [{ x: number; y: number }, { x: number; y: number }] | null {
    const [a, b] = [...this.pointers.values()];
    return a && b ? [a, b] : null;
  }

  private pinchDistance(): number {
    const points = this.pinchPoints();
    return points ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
  }

  private handlePinch(): void {
    const points = this.pinchPoints();
    if (!points) return;
    const distance = this.pinchDistance();
    const previous = this.lastPinchDistance;
    this.lastPinchDistance = distance;
    if (previous === 0) return;
    this.zoomAround(pinchZoom(this.zoom, distance / previous), (points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2);
  }

  private handlePointerCancel = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    this.pointerDown = null;
  };

  private handlePointerLeave = (): void => {
    this.onHoverCell(null);
  };

  // The wheel zooms around the point under the pointer, which stays where it is on the screen.
  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoomAround(nextZoom(this.zoom, event.deltaY), event.clientX, event.clientY);
    this.onHoverCell(this.cellAt(event.clientX, event.clientY));
  };

  private zoomAround(zoom: number, clientX: number, clientY: number): void {
    if (zoom === this.zoom) return;
    const before = this.groundAt(clientX, clientY);
    this.zoom = zoom;
    this.resize();
    const after = this.groundAt(clientX, clientY);
    if (before && after) {
      this.pan = clampPan({ x: this.pan.x + before.x - after.x, z: this.pan.z + before.z - after.z }, this.zoom, this.size);
      this.resize();
    }
    this.pan = clampPan(this.pan, this.zoom, this.size);
  }

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
    const elapsed = now - this.lastFrame;
    if (!shouldRenderFrame(elapsed)) {
      this.frameHandle = requestAnimationFrame(this.frame);
      return;
    }
    const delta = Math.min(0.1, Math.max(0, elapsed / 1000));
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

import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DISTRICT_PLAN, HEX_CATEGORIES, HEX_EDGE_COUNT, type Cell, type DistrictSeam, type Hex, type HexCategory, type PlacedHex } from '../core';
import { modelFileOf } from '../core/models/modelFiles';
import { modelSlotsOf } from './hexModels';
import { cellToPoint, cornerOf, edgeCorners, pointToCell } from './hexLayout';
import { ModelLibrary } from './modelLibrary';
import { renderPixelRatio, wantsAntialias } from './renderBudget';
import { ZOOM, clampPan, nextZoom, pinchZoom } from './venueZoom';

const SIZE = 1;
const TILE_SCALE = 0.94;
const THICKNESS = 0.12;
const GHOST_LIFT = 0.1;
// The plinth under the whole board, and the bar that marks a seam where two edges of the same category meet, shown on the Hex picked before it is placed.
const PLINTH_DEPTH = 0.3;
const PLINTH_MARGIN = 0.9;
const SEAM_WIDTH = 0.07;
const SEAM_HEIGHT = 0.035;
const SEAM_SHARE = 0.7;
const PLATE = 0.03;
const TAP_DISTANCE = 6;
const BOARD_HALF_WIDTH = 9;
const BOARD_MIN_HALF_HEIGHT = 5.6;
// The isometric pitch of the interiors; the board is seen from 60° round, and a hexagon repeats every 60°, so the view turns by that step.
const CAMERA_DISTANCE = 40;
const VIEW_PITCH = Math.atan(1 / Math.SQRT2);
const START_YAW = Math.PI / 3;
const TURN_STEP = Math.PI / 3;
const PAN_SIZE = 10;
const TURN_SPEED = 10;

const tokenColor = (name: string): THREE.Color => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());

// The top of a Hex: six wedges, each coloured by the category of its edge, as one mesh with vertex colours.
const wedgesGeometry = (edges: readonly HexCategory[], colors: Record<HexCategory, THREE.Color>): THREE.BufferGeometry => {
  const centre = { x: 0, z: 0 };
  const positions: number[] = [];
  const colours: number[] = [];
  for (let edge = 0; edge < HEX_EDGE_COUNT; edge++) {
    const before = cornerOf(centre, SIZE, (edge + HEX_EDGE_COUNT - 1) % HEX_EDGE_COUNT);
    const after = cornerOf(centre, SIZE, edge);
    const color = colors[edges[edge]!];
    for (const point of [centre, before, after]) {
      positions.push(point.x, 0, point.z);
      colours.push(color.r, color.g, color.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.computeVertexNormals();
  return geometry;
};

// The isometric view of the hexagonal board of the District plan: each Hex placed is a slab whose top shows the category of its six edges.
export class DistrictPlanScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  private board = new THREE.Group();
  private candidates = new THREE.Group();
  private ghost = new THREE.Group();
  private colors: Record<HexCategory, THREE.Color>;
  private baseMaterial: THREE.MeshStandardMaterial;
  private topMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 });
  private plateGeometry = new THREE.CylinderGeometry(SIZE * TILE_SCALE, SIZE * TILE_SCALE, PLATE, 6);
  private baseGeometry = new THREE.CylinderGeometry(SIZE * TILE_SCALE, SIZE * TILE_SCALE, THICKNESS, 6);
  private plinthGeometry: THREE.CylinderGeometry;
  private plinthMaterial: THREE.MeshStandardMaterial;
  private seamGeometry = new THREE.BoxGeometry(1, SEAM_HEIGHT, SEAM_WIDTH);
  private seamMaterial: THREE.MeshBasicMaterial;
  private candidateMaterial: THREE.MeshBasicMaterial;
  private invalidMaterial: THREE.MeshBasicMaterial;
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -THICKNESS);
  private geometries: THREE.BufferGeometry[] = [];
  private library = new ModelLibrary();
  private modelsReady = false;
  private lastBoard: readonly PlacedHex[] = [];
  private lastGhost: { cell: Cell; hex: Hex; valid: boolean; seams: readonly DistrictSeam[] } | null = null;
  private tapHandler: ((cell: Cell) => void) | null = null;
  private anchorHandler: ((anchor: { x: number; y: number } | null) => void) | null = null;
  private lastAnchor = '';
  private zoom = 1;
  private pan = { x: 0, z: 0 };
  private yaw = START_YAW;
  private yawTarget = START_YAW;
  private turning = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private pointerDown: { x: number; y: number; ground: THREE.Vector3 | null } | null = null;
  private dragged = false;
  private lastPinchDistance = 0;
  private width = 1;
  private height = 1;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: wantsAntialias(), alpha: true });
    this.renderer.setPixelRatio(renderPixelRatio());
    this.colors = Object.fromEntries(HEX_CATEGORIES.map(category => [category, tokenColor(`--hex-${category}`)])) as Record<HexCategory, THREE.Color>;
    this.baseMaterial = new THREE.MeshStandardMaterial({ color: tokenColor('--hex-base'), roughness: 0.9 });
    this.candidateMaterial = new THREE.MeshBasicMaterial({ color: tokenColor('--hex-candidate'), transparent: true, opacity: 0.28 });
    this.invalidMaterial = new THREE.MeshBasicMaterial({ color: tokenColor('--hex-invalid'), transparent: true, opacity: 0.55 });
    this.seamMaterial = new THREE.MeshBasicMaterial({ color: tokenColor('--hex-seam') });
    // A hexagon of hexagons: its corners lie where the neighbours of a cell lie, half a turn off the cells themselves.
    const plinthRadius = DISTRICT_PLAN.boardRadius * Math.sqrt(3) * SIZE + PLINTH_MARGIN;
    this.plinthGeometry = new THREE.CylinderGeometry(plinthRadius, plinthRadius, PLINTH_DEPTH, 6);
    this.plinthMaterial = new THREE.MeshStandardMaterial({ color: tokenColor('--hex-plinth'), roughness: 0.95 });
    const plinth = new THREE.Mesh(this.plinthGeometry, this.plinthMaterial);
    plinth.rotation.y = Math.PI / 6;
    plinth.position.y = -PLINTH_DEPTH / 2;
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1), this.directionalLight(), plinth, this.board, this.candidates, this.ghost);
    this.placeCamera();
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    void this.loadModels();
  }

  // The Hexes are drawn at once, bare; the models stand on them as soon as they have arrived.
  private async loadModels(): Promise<void> {
    await this.library.ensure(HEX_CATEGORIES.map(category => modelFileOf(DISTRICT_PLAN.categoryModels[category])));
    if (this.disposed) return;
    this.modelsReady = true;
    this.setBoard(this.lastBoard);
    this.setGhost(this.lastGhost);
  }

  private directionalLight(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(-6, 12, 7);
    return light;
  }

  onTap(handler: (cell: Cell) => void): void {
    this.tapHandler = handler;
  }

  // The cell under the Hex that is picked, as the pixel below it on the canvas, so that the buttons can follow it.
  onAnchor(handler: (anchor: { x: number; y: number } | null) => void): void {
    this.anchorHandler = handler;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.fitCamera();
    this.render();
  }

  private fitCamera(): void {
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / this.height;
    const halfHeight = Math.max(BOARD_MIN_HALF_HEIGHT, BOARD_HALF_WIDTH / aspect) / this.zoom;
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.pan = clampPan(this.pan, this.zoom, PAN_SIZE);
    this.placeCamera();
    this.camera.updateProjectionMatrix();
  }

  private placeCamera(): void {
    const focus = new THREE.Vector3(this.pan.x, 0.1, this.pan.z);
    this.camera.position.set(
      focus.x + Math.sin(this.yaw) * Math.cos(VIEW_PITCH) * CAMERA_DISTANCE,
      focus.y + Math.sin(VIEW_PITCH) * CAMERA_DISTANCE,
      focus.z + Math.cos(this.yaw) * Math.cos(VIEW_PITCH) * CAMERA_DISTANCE,
    );
    this.camera.lookAt(focus);
    this.camera.updateMatrixWorld();
  }

  // Turns the board by a sixth of a turn, as the buttons of an interior turn a room; the turn is instant for those who ask for less motion.
  rotate(direction: number): void {
    this.yawTarget += direction * TURN_STEP;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.yaw = this.yawTarget;
      this.placeCamera();
      this.render();
      return;
    }
    if (this.turning) return;
    let last = performance.now();
    const step = (now: number): void => {
      const delta = (now - last) / 1000;
      last = now;
      const difference = this.yawTarget - this.yaw;
      this.yaw = Math.abs(difference) < 0.002 ? this.yawTarget : this.yaw + difference * Math.min(1, delta * TURN_SPEED);
      this.placeCamera();
      this.render();
      this.turning = this.yaw === this.yawTarget || this.disposed ? 0 : requestAnimationFrame(step);
    };
    this.turning = requestAnimationFrame(step);
  }

  setBoard(placed: readonly PlacedHex[]): void {
    this.lastBoard = placed;
    this.fill(this.board, placed.map(({ cell, hex }) => this.slab(cell, hex, 1, 0)));
    this.render();
  }

  private seamBar(seam: DistrictSeam, lift: number): THREE.Mesh {
    const [from, to] = edgeCorners(cellToPoint(seam.cell, SIZE), SIZE * TILE_SCALE, seam.edge);
    const bar = new THREE.Mesh(this.seamGeometry, this.seamMaterial);
    bar.scale.x = Math.hypot(to.x - from.x, to.z - from.z) * SEAM_SHARE;
    bar.position.set((from.x + to.x) / 2, THICKNESS + lift + SEAM_HEIGHT / 2 + 0.004, (from.z + to.z) / 2);
    bar.rotation.y = -Math.atan2(to.z - from.z, to.x - from.x);
    return bar;
  }

  // The cells a Hex may go on.
  setCandidates(cells: readonly Cell[]): void {
    this.fill(this.candidates, cells.map(cell => this.plate(cell, this.candidateMaterial)));
    this.render();
  }

  // The Hex in hand over the cell picked, lifted above the board; a cell that cannot take it is red.
  setGhost(ghost: { cell: Cell; hex: Hex; valid: boolean; seams: readonly DistrictSeam[] } | null): void {
    this.lastGhost = ghost;
    this.fill(this.ghost, ghost ? [ghost.valid ? this.slab(ghost.cell, ghost.hex, 0.8, GHOST_LIFT) : this.plate(ghost.cell, this.invalidMaterial), ...ghost.seams.map(seam => this.seamBar(seam, GHOST_LIFT))] : []);
    this.render();
  }

  private slab(cell: Cell, hex: Hex, opacity: number, lift: number): THREE.Group {
    const point = cellToPoint(cell, SIZE);
    const group = new THREE.Group();
    group.position.set(point.x, lift, point.z);
    const base = new THREE.Mesh(this.baseGeometry, opacity < 1 ? this.fadedMaterial(this.baseMaterial, opacity) : this.baseMaterial);
    base.position.y = THICKNESS / 2;
    const topGeometry = wedgesGeometry(hex.edges, this.colors);
    this.geometries.push(topGeometry);
    const top = new THREE.Mesh(topGeometry, opacity < 1 ? this.fadedMaterial(this.topMaterial, opacity) : this.topMaterial);
    top.position.y = THICKNESS + 0.002;
    top.scale.set(TILE_SCALE, 1, TILE_SCALE);
    group.add(base, top);
    if (this.modelsReady) group.add(this.models(hex, opacity));
    return group;
  }

  // The model of each category of the Hex, standing on its slab, fitted to the width its slot allows.
  private models(hex: Hex, opacity: number): THREE.Group {
    const holder = new THREE.Group();
    holder.userData.library = true;
    const owned: THREE.Material[] = [];
    holder.userData.owned = owned;
    for (const slot of modelSlotsOf(hex.edges, SIZE)) {
      const model = cloneModel(this.library.get(modelFileOf(DISTRICT_PLAN.categoryModels[slot.category])));
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = slot.extent / Math.max(size.x, size.z);
      model.scale.setScalar(scale);
      model.position.set(slot.x - center.x * scale, THICKNESS + 0.004 - box.min.y * scale, slot.z - center.z * scale);
      if (opacity < 1) this.fade(model, opacity, owned);
      holder.add(model);
    }
    return holder;
  }

  // Models are shared by every Hex: a translucent one gets materials of its own, which go with it.
  private fade(model: THREE.Object3D, opacity: number, owned: THREE.Material[]): void {
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const faded = (Array.isArray(child.material) ? child.material : [child.material]).map((material: THREE.Material) => {
        const copy = material.clone();
        copy.transparent = true;
        copy.opacity = opacity;
        owned.push(copy);
        return copy;
      });
      child.material = Array.isArray(child.material) ? faded : faded[0]!;
    });
  }

  private fadedMaterial(source: THREE.MeshStandardMaterial, opacity: number): THREE.MeshStandardMaterial {
    const material = source.clone();
    material.transparent = true;
    material.opacity = opacity;
    return material;
  }

  private plate(cell: Cell, material: THREE.Material): THREE.Mesh {
    const point = cellToPoint(cell, SIZE);
    const plate = new THREE.Mesh(this.plateGeometry, material);
    plate.position.set(point.x, PLATE / 2, point.z);
    return plate;
  }

  private fill(group: THREE.Group, children: readonly THREE.Object3D[]): void {
    for (const child of [...group.children]) {
      group.remove(child);
      this.disposeOf(child);
    }
    for (const child of children) group.add(child);
  }

  // Geometries and materials shared by every Hex, and the models of the library, are kept; those made for one slab go with it.
  private disposeOf(object: THREE.Object3D): void {
    if (object.userData.library) {
      for (const material of object.userData.owned as THREE.Material[]) material.dispose();
      return;
    }
    if (object instanceof THREE.Mesh) {
      if (this.geometries.includes(object.geometry)) {
        object.geometry.dispose();
        this.geometries.splice(this.geometries.indexOf(object.geometry), 1);
      }
      const material = object.material as THREE.Material;
      if (material !== this.baseMaterial && material !== this.topMaterial && material !== this.candidateMaterial && material !== this.invalidMaterial && material !== this.seamMaterial) material.dispose();
    }
    for (const child of object.children) this.disposeOf(child);
  }

  private groundAt(clientX: number, clientY: number): THREE.Vector3 | null {
    const bounds = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - bounds.left) / bounds.width) * 2 - 1, -(((clientY - bounds.top) / bounds.height) * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
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

  // Dragging with the button down moves the board under the pointer, and two fingers zoom.
  private handlePointerMove = (event: PointerEvent): void => {
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      this.handlePinch();
      return;
    }
    const start = this.pointerDown;
    if (!start || !(this.dragged || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_DISTANCE)) return;
    this.dragged = true;
    this.canvas.style.cursor = 'grabbing';
    const now = this.groundAt(event.clientX, event.clientY);
    if (!start.ground || !now) return;
    this.pan = clampPan({ x: this.pan.x + start.ground.x - now.x, z: this.pan.z + start.ground.z - now.z }, this.zoom, PAN_SIZE);
    this.fitCamera();
    this.render();
  };

  private handlePointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    const start = this.pointerDown;
    this.pointerDown = null;
    this.canvas.style.cursor = '';
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (!start || this.dragged) return;
    const hit = this.groundAt(event.clientX, event.clientY);
    if (hit) this.tapHandler?.(pointToCell({ x: hit.x, z: hit.z }, SIZE));
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    this.lastPinchDistance = 0;
    this.pointerDown = null;
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

  // The wheel zooms around the point under the pointer, which stays where it is on the screen.
  private handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.zoomAround(nextZoom(this.zoom, event.deltaY), event.clientX, event.clientY);
  };

  private zoomAround(zoom: number, clientX: number, clientY: number): void {
    if (zoom === this.zoom || zoom < ZOOM.min || zoom > ZOOM.max) return;
    const before = this.groundAt(clientX, clientY);
    this.zoom = zoom;
    this.fitCamera();
    const after = this.groundAt(clientX, clientY);
    if (before && after) {
      this.pan = clampPan({ x: this.pan.x + before.x - after.x, z: this.pan.z + before.z - after.z }, this.zoom, PAN_SIZE);
      this.fitCamera();
    }
    this.render();
  }

  // The middle of a cell on the canvas, in pixels.
  screenCenterOf(cell: Cell): { x: number; y: number } {
    const point = cellToPoint(cell, SIZE);
    const projected = new THREE.Vector3(point.x, THICKNESS, point.z).project(this.camera);
    return { x: ((projected.x + 1) / 2) * this.width, y: ((1 - projected.y) / 2) * this.height };
  }

  // The lowest point of the picked cell on the canvas, in pixels.
  private publishAnchor(): void {
    const cell = this.lastGhost?.cell;
    let anchor: { x: number; y: number } | null = null;
    if (cell) {
      const centre = cellToPoint(cell, SIZE);
      const corner = new THREE.Vector3();
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      for (let index = 0; index < HEX_EDGE_COUNT; index++) {
        const point = cornerOf(centre, SIZE * TILE_SCALE, index);
        corner.set(point.x, THICKNESS, point.z).project(this.camera);
        bottom = Math.max(bottom, ((1 - corner.y) / 2) * this.height);
        left = Math.min(left, ((corner.x + 1) / 2) * this.width);
        right = Math.max(right, ((corner.x + 1) / 2) * this.width);
      }
      anchor = { x: Math.round((left + right) / 2), y: Math.round(bottom) };
    }
    const key = anchor ? `${anchor.x},${anchor.y}` : '';
    if (key === this.lastAnchor) return;
    this.lastAnchor = key;
    this.anchorHandler?.(anchor);
  }

  render(): void {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.publishAnchor();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.turning);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    for (const group of [this.board, this.candidates, this.ghost]) this.fill(group, []);
    for (const resource of [this.baseGeometry, this.plateGeometry, this.plinthGeometry, this.seamGeometry, this.baseMaterial, this.topMaterial, this.plinthMaterial, this.candidateMaterial, this.invalidMaterial, this.seamMaterial]) resource.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

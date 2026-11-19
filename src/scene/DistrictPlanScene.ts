import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DISTRICT_PLAN, HEX_CATEGORIES, HEX_EDGE_COUNT, type Cell, type Hex, type HexCategory, type PlacedHex } from '../core';
import { modelFileOf } from '../core/models/modelFiles';
import { modelSlotsOf } from './hexModels';
import { cellToPoint, cornerOf, pointToCell } from './hexLayout';
import { ModelLibrary } from './modelLibrary';
import { renderPixelRatio, wantsAntialias } from './renderBudget';

const SIZE = 1;
const TILE_SCALE = 0.94;
const THICKNESS = 0.22;
const GHOST_LIFT = 0.18;
const PLATE = 0.03;
const TAP_DISTANCE = 6;
const BOARD_HALF_WIDTH = 8.4;
const BOARD_MIN_HALF_HEIGHT = 6.6;
const CAMERA_DISTANCE = 20;
const CAMERA_ELEVATION = (52 * Math.PI) / 180;

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
  private candidateMaterial: THREE.MeshBasicMaterial;
  private invalidMaterial: THREE.MeshBasicMaterial;
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -THICKNESS);
  private geometries: THREE.BufferGeometry[] = [];
  private library = new ModelLibrary();
  private modelsReady = false;
  private lastBoard: readonly PlacedHex[] = [];
  private lastGhost: { cell: Cell; hex: Hex; valid: boolean } | null = null;
  private tapHandler: ((cell: Cell) => void) | null = null;
  private pointerStart: { x: number; y: number } | null = null;
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
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1), this.directionalLight(), this.board, this.candidates, this.ghost);
    this.camera.position.set(0, CAMERA_DISTANCE * Math.sin(CAMERA_ELEVATION), CAMERA_DISTANCE * Math.cos(CAMERA_ELEVATION));
    this.camera.lookAt(0, 0, 0);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
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

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / this.height;
    const halfHeight = Math.max(BOARD_MIN_HALF_HEIGHT, BOARD_HALF_WIDTH / aspect);
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  setBoard(placed: readonly PlacedHex[]): void {
    this.lastBoard = placed;
    this.fill(this.board, placed.map(({ cell, hex }) => this.slab(cell, hex, 1, 0)));
    this.render();
  }

  // The cells a Hex may go on.
  setCandidates(cells: readonly Cell[]): void {
    this.fill(this.candidates, cells.map(cell => this.plate(cell, this.candidateMaterial)));
    this.render();
  }

  // The Hex in hand over the cell picked, lifted above the board; a cell that cannot take it is red.
  setGhost(ghost: { cell: Cell; hex: Hex; valid: boolean } | null): void {
    this.lastGhost = ghost;
    this.fill(this.ghost, ghost ? [ghost.valid ? this.slab(ghost.cell, ghost.hex, 0.8, GHOST_LIFT) : this.plate(ghost.cell, this.invalidMaterial)] : []);
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
      if (material !== this.baseMaterial && material !== this.topMaterial && material !== this.candidateMaterial && material !== this.invalidMaterial) material.dispose();
    }
    for (const child of object.children) this.disposeOf(child);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.pointerStart = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent): void => {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_DISTANCE) return;
    const bounds = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -(((event.clientY - bounds.top) / bounds.height) * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
    if (hit) this.tapHandler?.(pointToCell({ x: hit.x, z: hit.z }, SIZE));
  };

  render(): void {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    for (const group of [this.board, this.candidates, this.ghost]) this.fill(group, []);
    for (const resource of [this.baseGeometry, this.plateGeometry, this.baseMaterial, this.topMaterial, this.candidateMaterial, this.invalidMaterial]) resource.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

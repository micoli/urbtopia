import * as THREE from 'three';
import { AvatarPatrol, patrolRoute } from './avatarPatrol';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FIXTURES, PARQUET_MODELS, isRestockable, conditionOf, entranceCell, fixtureFootprint, fixtureIdsOf, focusOf, hostWallOf, isProducerRole, itemModelOf, partitionPieceOf, type Coord, type GoodId, type FixtureVenue, type LinePath, type InteriorAvatars, type VenueFixture } from '../core';
import { ModelLibrary } from './modelLibrary';
import { VENUE_CORNER_PLACEMENT, VENUE_SHELL_MODELS } from './renderItems';
import { RESTOCKER_MODEL, VENUE_STAFF_MODELS, venueCrowdModelsOf } from './venueCrowdModels';
import { ITEM_SCALE, InteriorLineLayer } from './InteriorLineLayer';
import { InteriorMotionLayer, type FixtureMotion } from './InteriorMotionLayer';
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
const WEAR_BAR_FROM_CONDITION = 90;
const WEAR_BAR_ORANGE_HUE = 30 / 360;
const WEAR_BAR_GREEN_HUE = 120 / 360;
const WEAR_BAR_BACK = 0x1b1f2b;
const WEAR_BAR_WIDTH = 0.8;
const WEAR_BAR_THICKNESS = 0.1;
const WEAR_BAR_HEIGHT = 1.4;
// The Good of an Oven or of a Display counter stands on top of the furniture: on the roof of the oven, away from its chimney and its fan, and on the roof of the case, in the middle of the shop half of the tile.
const OVEN_ROOF = 1.0;
const OVEN_ROOF_DEPTH = 0.2;
const CASE_ROOF = 0.76;
const CASE_DEPTH = 0.3;
// The Good an Exit of a Packhouse restocks stands above the hatch of its dock; that of a Machine of a Factory, above the Machine.
const DOCK_ROOF = 0.95;
const DOCK_DEPTH = 0.42;
const MACHINE_ROOF = 1.1;
const STAFF_SCALE = 0.7;
const STAFF_DISTANCE = 0.85;
// Staff stand on the corner of their Fixture, not in front of it.
const CORNER_MARGIN = 0.09;

// A side of a Fixture in the floor's axes (x to the east, z to the south), once the Fixture is turned: rotation 0 leaves it as drawn, each turn takes it a quarter turn on.
const turnedOffset = (x: number, z: number, turns: number): { x: number; z: number } => (turns % 4 === 0 ? { x, z } : turnedOffset(-z, x, turns - 1));

export interface VenueGhost {
  tiles: readonly Coord[];
  valid: boolean;
}

// How far a wall Fixture stands from the axis of a wall, so that it hangs on the face turned to the room.
const WALL_FACE = 0.06;

// The same, from the axis of a wall of the room, and the direction each face looks toward (south, east, north, west).
const PARTITION_FACE = 0.03;
const HUNG_FACES: readonly (readonly [number, number])[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];

export class VenueScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  private library = new ModelLibrary();
  private shell = new THREE.Group();
  private fixtureRoot = new THREE.Group();
  private truckRoot = new THREE.Group();
  private trucks: readonly VenueFixture[] = [];
  private linePaths: readonly LinePath[] | null = null;
  private ghostRoot = new THREE.Group();
  private selectionRoot = new THREE.Group();
  private warningRoot = new THREE.Group();
  private crowd: VenueCrowdLayer;
  private motion = new InteriorMotionLayer();
  private line = this.newLineLayer();
  private lastFrame = performance.now();
  private fixturesSignature = '';
  private zoom = 1;
  private pan = { x: 0, z: 0 };
  private yaw = Math.PI / 4;
  private yawTarget = Math.PI / 4;
  // Where the pointer last was over the canvas, to find the cell under it again when the room turns without the pointer moving.
  private lastPointer: { x: number; y: number } | null = null;
  private northWalls = new THREE.Group();
  private westWalls = new THREE.Group();
  private cornerPost = new THREE.Group();
  private brokenRoot = new THREE.Group();
  // The Good chosen on an Oven or a Display counter, floating above it, and the Staff assigned to it, standing beside it.
  private tokensRoot = new THREE.Group();
  private staffMixers: THREE.AnimationMixer[] = [];
  private avatars: readonly InteriorAvatars[] = [];
  private patrols: AvatarPatrol[] = [];
  private wearRoot = new THREE.Group();
  private shelfStock = new ShelfStockLayer(() => { this.dirty = true; });
  private raycaster = new THREE.Raycaster();
  private pickMode: 'base' | '3d' = '3d';
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private resizeObserver: ResizeObserver;
  private frameHandle = 0;
  private hidden = document.hidden;
  private stopWatchingHidden: () => void;
  private dirty = true;
  private pointerDown: { x: number; y: number; ground: THREE.Vector3 | null } | null = null;
  private dragged = false;
  private grabbed = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinchDistance = 0;
  private lastFixtures: readonly VenueFixture[] = [];
  private builtSize = 0;
  private disposed = false;
  readonly ready: Promise<void>;
  // `repeat` is true when Shift is held: the player keeps placing the same item. `fixtureId` is the piece of furniture whose 3D model the tap hit, in the 3D pick mode.
  onTapCell: (cell: Coord, repeat: boolean, fixtureId: number | null) => void = () => {};
  onHoverCell: (cell: Coord | null) => void = () => {};
  // A press on a piece of furniture grabs it: dragging then carries the piece instead of the room.
  onGrab: (cell: Coord, fixtureId: number | null) => boolean = () => false;
  onGrabMove: (cell: Coord) => void = () => {};
  onDrop: (cell: Coord | null) => void = () => {};

  private shellModels: { floor: string; wall: string; corner: string };
  private cornerPlacement: { x: number; z: number; rotation: number };

  constructor(private canvas: HTMLCanvasElement, private size: number, private tier = 1, venueType: FixtureVenue = 'arcade', seed = 1) {
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
    this.scene.add(sun, sky, this.shell, this.fixtureRoot, this.tokensRoot, this.truckRoot, this.line.root, this.crowd.root, this.warningRoot, this.brokenRoot, this.wearRoot, this.shelfStock.root, this.selectionRoot, this.ghostRoot);
    this.ready = this.library.ensure([...Object.values(this.shellModels), ...(venueType === 'home' ? PARQUET_MODELS : []), ...new Set([...fixtureIdsOf(venueType).flatMap(id => [FIXTURES[id].model, ...(FIXTURES[id].truck ? [FIXTURES[id].truck!] : []), ...Object.values(FIXTURES[id].joins ?? {})]), ...venueCrowdModelsOf(venueType)])]).then(() => {
      if (this.disposed) return;
      this.buildShell();
      this.rebuildFixtures();
      this.rebuildTrucks();
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

  private newLineLayer(): InteriorLineLayer {
    const layer = new InteriorLineLayer();
    layer.itemOf = good => {
      const model = itemModelOf(good as GoodId);
      return model && this.library.has(model) ? cloneModel(this.library.get(model)) : null;
    };
    return layer;
  }

  // Swaps the floor of the room, for a Home interior whose parquet is chosen by the player.
  setFloorModel(model: string): void {
    if (model === this.shellModels.floor) return;
    this.shellModels = { ...this.shellModels, floor: model };
    this.builtSize = -1;
    this.buildShell();
  }

  setFixtures(fixtures: readonly VenueFixture[]): void {
    if (this.shelfStock.sync(fixtures)) this.dirty = true;
    const signature = JSON.stringify(fixtures.map(fixture => [fixture.id, fixture.type, fixture.x, fixture.y, fixture.rotation, fixture.recipe, fixture.soldGood, fixture.assigned, fixture.restock, fixture.restocker]));
    if (signature === this.fixturesSignature) return;
    this.fixturesSignature = signature;
    this.lastFixtures = fixtures;
    this.crowd.setFixtures(fixtures);
    this.rebuildFixtures();
  }

  // The Staff hired in a Service interior, standing in the room in costume beside the Fixtures of their post.
  setAvatars(avatars: readonly InteriorAvatars[]): void {
    if (JSON.stringify(avatars) === JSON.stringify(this.avatars)) return;
    this.avatars = avatars;
    this.rebuildTokens();
  }

  // The Fixtures of a Factory interior that run, and the way they turn.
  setMotion(motion: ReadonlyMap<number, FixtureMotion>, speed = 1): void {
    this.motion.setMotion(motion);
    this.motion.setSpeed(speed);
    this.dirty = true;
  }

  // The ways that Packets take on a Packhouse interior, and the pace they ride at.
  setLine(paths: readonly LinePath[], speed = 1): void {
    if (paths !== this.linePaths) {
      this.linePaths = paths;
      this.line.setPaths(paths);
      this.loadBakedGoods(paths);
    }
    this.line.setSpeed(speed);
    this.dirty = true;
  }

  // The Packets that have gone through an Oven are drawn as the Good that arrives at the Exit: its model is loaded, then the Packets are laid again.
  private loadBakedGoods(paths: readonly LinePath[]): void {
    const models = [...new Set(paths.flatMap(path => (path.baked ? [itemModelOf(path.baked.good as GoodId)] : [])))].filter((model): model is string => model !== null && !this.library.has(model));
    if (models.length === 0) return;
    void this.library.ensure(models).then(() => {
      if (this.disposed || this.linePaths !== paths) return;
      this.line.setPaths(paths);
      this.dirty = true;
    });
  }

  // The Exits of a Packhouse interior whose Line is linked: a truck waits outside each of them.
  setTrucks(exits: readonly VenueFixture[]): void {
    if (exits === this.trucks) return;
    this.trucks = exits;
    this.rebuildTrucks();
  }

  private rebuildTrucks(): void {
    this.clear(this.truckRoot);
    for (const exit of this.trucks) {
      const truck = FIXTURES[exit.type].truck;
      if (truck && this.library.has(truck)) this.place(this.truckRoot, truck, exit.x + 0.5, exit.y + 0.5, -exit.rotation * Math.PI / 2);
    }
    this.dirty = true;
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

  // A bar shows once a Fixture is worn: its Condition has fallen to 90 %. A Factory interior reads it as what is left, a Venue as what is lost.
  setWear(fixtures: readonly VenueFixture[], remaining = false): void {
    this.clear(this.wearRoot, true);
    for (const fixture of fixtures) {
      const condition = conditionOf(fixture);
      if (condition > WEAR_BAR_FROM_CONDITION || (remaining && !FIXTURES[fixture.type].wear)) continue;
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const bar = new THREE.Group();
      bar.position.set(fixture.x + width / 2, WEAR_BAR_HEIGHT, fixture.y + depth / 2);
      bar.quaternion.copy(this.camera.quaternion);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(WEAR_BAR_WIDTH, WEAR_BAR_THICKNESS), new THREE.MeshBasicMaterial({ color: WEAR_BAR_BACK, depthTest: false }));
      const wear = remaining ? Math.max(condition, 1) / 100 : (100 - condition) / 100;
      const hue = remaining ? WEAR_BAR_GREEN_HUE * condition / WEAR_BAR_FROM_CONDITION : WEAR_BAR_ORANGE_HUE * condition / WEAR_BAR_FROM_CONDITION;
      const fill = new THREE.Mesh(new THREE.PlaneGeometry(WEAR_BAR_WIDTH * wear, WEAR_BAR_THICKNESS), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue, 0.9, 0.5), depthTest: false }));
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
    // A disposed renderer keeps its WebGL context until the garbage collector runs; browsers drop the oldest context, the Map's, past a limit.
    this.renderer.forceContextLoss();
  }

  private buildShell(): void {
    if (!this.library.has(this.shellModels.floor) || this.builtSize === this.size) return;
    this.builtSize = this.size;
    this.clear(this.shell);
    this.clear(this.northWalls);
    this.clear(this.westWalls);
    this.clear(this.cornerPost);
    const entrance = entranceCell(this.tier);
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) this.place(this.shell, this.shellModels.floor, x + 0.5, y + 0.5, 0);
    }
    for (let index = 0; index < this.size; index++) {
      if (index !== entrance.x) this.place(this.northWalls, this.shellModels.wall, index + 0.5, 0, 0);
      this.place(this.westWalls, this.shellModels.wall, 0, index + 0.5, Math.PI / 2);
    }
    this.place(this.cornerPost, this.shellModels.corner, this.cornerPlacement.x, this.cornerPlacement.z, this.cornerPlacement.rotation);
    this.shell.add(this.northWalls, this.westWalls, this.cornerPost);
    this.showWalls();
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: ENTRANCE_COLOR }));
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(entrance.x + 0.5, 0.04, entrance.y + 0.5);
    this.shell.add(mat);
    this.dirty = true;
  }

  private rebuildFixtures(): void {
    if (!this.library.has(this.shellModels.floor)) return;
    this.clear(this.fixtureRoot);
    this.motion.clear();
    for (const fixture of this.lastFixtures) {
      const spec = FIXTURES[fixture.type];
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const piece = spec.joins ? partitionPieceOf(fixture, this.lastFixtures) : undefined;
      const model = piece && piece.shape !== 'straight' ? spec.joins![piece.shape] : spec.model;
      const rotation = (piece ? piece.turns * Math.PI / 2 : -fixture.rotation * Math.PI / 2);
      const object = spec.wall
        ? this.placeHung(model, fixture)
        : this.place(this.fixtureRoot, model, fixture.x + width / 2, fixture.y + depth / 2, rotation);
      object.userData.fixtureId = fixture.id;
      this.motion.bind(fixture.id, object, spec.smoke);
      if (spec.tint !== undefined) this.tint(object, spec.tint);
    }
    this.rebuildTokens();
    this.dirty = true;
  }

  private rebuildTokens(): void {
    this.clear(this.tokensRoot);
    this.staffMixers = [];
    this.patrols = [];
    for (const fixture of this.lastFixtures) {
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      const centre = { x: fixture.x + width / 2, z: fixture.y + depth / 2 };
      const restockable = isRestockable(FIXTURES[fixture.type]);
      const good = restockable ? fixture.restock : focusOf(fixture);
      const model = good === undefined ? null : itemModelOf(good);
      if (model && this.ensured(model)) {
        const token = new THREE.Group();
        token.add(cloneModel(this.library.get(model)));
        token.scale.setScalar(ITEM_SCALE);
        const back = turnedOffset(0, -1, fixture.rotation);
        const baker = isProducerRole(FIXTURES[fixture.type].assigns);
        const [height, depth] = restockable || FIXTURES[fixture.type].assigns === 'miller' ? (FIXTURES[fixture.type].role === 'exit' ? [DOCK_ROOF, DOCK_DEPTH] : [MACHINE_ROOF, 0]) : baker ? [OVEN_ROOF, OVEN_ROOF_DEPTH] : [CASE_ROOF, CASE_DEPTH];
        token.position.set(centre.x + back.x * depth, height, centre.z + back.z * depth);
        this.tokensRoot.add(token);
      }
      if (fixture.assigned || fixture.restocker) this.placeStaff(fixture, centre);
    }
    this.placeAvatars();
    this.dirty = true;
  }

  // One avatar per Fixture of their post, who walks around it and stops now and then, turned toward it.
  private placeAvatars(): void {
    const attended = new Set<number>();
    for (const { model, beside, count } of this.avatars) {
      if (!this.ensured(model)) continue;
      const posts = beside.flatMap(type => this.lastFixtures.filter(fixture => fixture.type === type && !attended.has(fixture.id)));
      for (const fixture of posts.slice(0, count)) {
        const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
        const route = patrolRoute({ x: fixture.x, y: fixture.y, width, depth }, (x, z) => this.isFree(x, z));
        if (route.length === 0) continue;
        attended.add(fixture.id);
        const holder = new THREE.Group();
        const body = cloneModel(this.library.get(model));
        holder.add(body);
        holder.scale.setScalar(STAFF_SCALE);
        const patrol = new AvatarPatrol(holder, new THREE.AnimationMixer(body), this.library.clipsOf(model), route, { x: fixture.x + width / 2, z: fixture.y + depth / 2 }, fixture.id);
        this.patrols.push(patrol);
        this.tokensRoot.add(holder);
      }
    }
  }

  private isFree(x: number, z: number): boolean {
    if (x < 0 || z < 0 || x >= this.size || z >= this.size) return false;
    return !this.lastFixtures.some(fixture => {
      const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
      return !FIXTURES[fixture.type].wall && x >= fixture.x && x < fixture.x + width && z >= fixture.y && z < fixture.y + depth;
    });
  }

  // True once a model is loaded; otherwise asks for it and builds the tokens again when it has arrived.
  private ensured(model: string): boolean {
    if (this.library.has(model)) return true;
    void this.library.ensure([model]).then(() => {
      if (!this.disposed) this.rebuildTokens();
    });
    return false;
  }

  // The Staff assigned to a Fixture stands on the diagonal of its corner, turned toward it: a seller behind its Display counter, on the shop side; a baker at the side of its Oven that its gas does not use. A miller is a plain worker, like a Restocker.
  private placeStaff(fixture: VenueFixture, centre: { x: number; z: number }): void {
    const spec = FIXTURES[fixture.type];
    const model = isRestockable(spec) || spec.assigns === 'miller' ? RESTOCKER_MODEL : isProducerRole(spec.assigns) ? VENUE_STAFF_MODELS.restaurant[0] : VENUE_STAFF_MODELS.supermarket[0];
    if (!model || !this.ensured(model)) return;
    const side = spec.assigns === 'seller' ? turnedOffset(0, -1, fixture.rotation) : spec.flow?.includes('right') ? turnedOffset(-1, 0, fixture.rotation) : turnedOffset(1, 0, fixture.rotation);
    const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
    const corner = { x: Math.sign(side.x - side.z), z: Math.sign(side.z + side.x) };
    this.stand(model, { x: centre.x + corner.x * (width / 2 + CORNER_MARGIN), z: centre.z + corner.z * (depth / 2 + CORNER_MARGIN) }, { x: corner.x, z: corner.z });
  }

  private stand(model: string, at: { x: number; z: number }, side: { x: number; z: number }): void {
    const holder = new THREE.Group();
    const body = cloneModel(this.library.get(model));
    holder.add(body);
    holder.scale.setScalar(STAFF_SCALE);
    holder.position.set(at.x, 0, at.z);
    holder.rotation.y = Math.atan2(-side.x, -side.z);
    const mixer = new THREE.AnimationMixer(body);
    const idle = this.library.clipsOf(model).find(clip => clip.name === 'idle');
    if (idle) mixer.clipAction(idle).play();
    this.staffMixers.push(mixer);
    this.tokensRoot.add(holder);
  }

  // A wall Fixture hangs on a back wall, or on the face of a wall of the room when it stands on the tile of one.
  private placeHung(model: string, fixture: VenueFixture): THREE.Object3D {
    if (!hostWallOf(this.lastFixtures, fixture)) {
      const north = fixture.rotation === 0;
      return this.place(this.fixtureRoot, model, north ? fixture.x + 0.5 : WALL_FACE, north ? WALL_FACE : fixture.y + 0.5, north ? 0 : Math.PI / 2);
    }
    const [dx, dz] = HUNG_FACES[fixture.rotation]!;
    return this.place(this.fixtureRoot, model, fixture.x + 0.5 + dx * PARTITION_FACE, fixture.y + 0.5 + dz * PARTITION_FACE, Math.atan2(dx, dz));
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

  // In the 3D mode a piece of furniture is picked on its model, wherever it is drawn; in the base mode, on the cell of the floor.
  setPickMode(mode: 'base' | '3d'): void {
    this.pickMode = mode;
  }

  private fixtureAt(clientX: number, clientY: number): number | null {
    if (this.pickMode === 'base') return null;
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1)), this.camera);
    for (const hit of this.raycaster.intersectObject(this.fixtureRoot, true)) {
      for (let node: THREE.Object3D | null = hit.object; node && node !== this.fixtureRoot; node = node.parent) {
        if (typeof node.userData.fixtureId === 'number') return node.userData.fixtureId;
      }
    }
    return null;
  }

  private cellAt(clientX: number, clientY: number): Coord | null {
    const hit = this.groundAt(clientX, clientY);
    if (!hit) return null;
    const cell = { x: Math.floor(hit.x), y: Math.floor(hit.z) };
    return cell.x >= 0 && cell.y >= 0 && cell.x < this.size && cell.y < this.size ? cell : null;
  }

  // The cell a press stands for: the one under the pointer, or the cell of a hung painting whose model was hit above the walls, where the ground behind it lies out of the room.
  private pickedCell(clientX: number, clientY: number, fixtureId: number | null): Coord | null {
    const cell = this.cellAt(clientX, clientY);
    if (cell || fixtureId === null) return cell;
    const hit = this.lastFixtures.find(fixture => fixture.id === fixtureId);
    return hit ? { x: hit.x, y: hit.y } : null;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      this.pointerDown = null;
      this.dragged = true;
      if (this.grabbed) this.onDrop(null);
      this.grabbed = false;
      this.lastPinchDistance = this.pinchDistance();
      return;
    }
    this.pointerDown = { x: event.clientX, y: event.clientY, ground: this.groundAt(event.clientX, event.clientY) };
    this.dragged = false;
    const fixtureId = this.fixtureAt(event.clientX, event.clientY);
    const cell = this.pickedCell(event.clientX, event.clientY, fixtureId);
    this.grabbed = cell !== null && this.onGrab(cell, fixtureId);
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
    const carried = this.grabbed && this.dragged;
    this.pointerDown = null;
    this.grabbed = false;
    this.canvas.style.cursor = '';
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (carried) return this.onDrop(this.cellAt(event.clientX, event.clientY));
    if (!start || this.dragged) return;
    const fixtureId = this.fixtureAt(event.clientX, event.clientY);
    const cell = this.pickedCell(event.clientX, event.clientY, fixtureId);
    if (cell) this.onTapCell(cell, event.shiftKey, fixtureId);
  };

  // Dragging with the button down moves the room under the pointer, as in the city.
  private handlePointerMove = (event: PointerEvent): void => {
    this.lastPointer = { x: event.clientX, y: event.clientY };
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size >= 2) {
      this.handlePinch();
      return;
    }
    const start = this.pointerDown;
    if (start && (this.dragged || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_DISTANCE)) {
      this.dragged = true;
      this.canvas.style.cursor = 'grabbing';
      if (this.grabbed) {
        const cell = this.cellAt(event.clientX, event.clientY);
        if (cell) this.onGrabMove(cell);
        return;
      }
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
    if (this.grabbed) this.onDrop(null);
    this.grabbed = false;
  };

  private handlePointerLeave = (): void => {
    this.lastPointer = null;
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
    this.placeCamera();
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  // Turns the room by a quarter turn, as the buttons of the city map do.
  rotate(direction: number): void {
    this.yawTarget += direction * Math.PI / 2;
    this.dirty = true;
  }

  private placeCamera(): void {
    const center = this.size / 2, distance = 40, pitch = Math.atan(1 / Math.SQRT2);
    const focusX = center + this.pan.x, focusZ = center + this.pan.z;
    this.camera.position.set(focusX + Math.sin(this.yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, focusZ + Math.cos(this.yaw) * Math.cos(pitch) * distance);
    this.camera.lookAt(focusX, 0.3, focusZ);
    this.showWalls();
  }

  // The perimeter walls on the side the camera looks from would hide the room: they show only when they stand behind it.
  private showWalls(): void {
    const north = Math.cos(this.yaw) > 0.05, west = Math.sin(this.yaw) > 0.05;
    this.northWalls.visible = north;
    this.westWalls.visible = west;
    this.cornerPost.visible = north && west;
  }

  private turnTowardTarget(delta: number): void {
    if (this.yaw === this.yawTarget) return;
    const step = (this.yawTarget - this.yaw) * Math.min(1, delta * 10);
    this.yaw = Math.abs(this.yawTarget - this.yaw) < 0.002 ? this.yawTarget : this.yaw + step;
    this.placeCamera();
    this.camera.updateMatrixWorld();
    if (this.lastPointer && !this.pointerDown) this.onHoverCell(this.cellAt(this.lastPointer.x, this.lastPointer.y));
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
    this.turnTowardTarget(delta);
    this.crowd.update(delta, this.camera);
    this.motion.update(delta);
    this.line.update(delta);
    for (const mixer of this.staffMixers) mixer.update(delta);
    for (const patrol of this.patrols) patrol.update(delta);
    if (this.crowd.active || this.patrols.length > 0 || this.motion.active || this.line.active || this.staffMixers.length > 0) this.dirty = true;
    if (this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

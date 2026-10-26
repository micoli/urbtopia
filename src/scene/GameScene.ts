import { EcologyLayer } from './EcologyLayer';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GAME_CONFIG, WILD_RIM_TILES, congestionStats, pedestrianGraph, wildNoiseAt, wildTerrain, type Building, type GameState, type FacilityType } from '../core';
import { bridgeElevation } from './bridgeElevation';
import { CameraController } from './CameraController';
import { StreetViewController } from './StreetViewController';
import { footprintTiles, type Coord } from '../core';
import { congestionTints } from './congestionMarkers';
import type { DrawnExtent, GhostSpec } from '../tools/tools';
import { ChunkedWorld } from './ChunkedWorld';
import { WildScenery } from './WildScenery';
import { groundGeometry } from './groundMesh';
import { GhostLayer } from './GhostLayer';
import { createTendedGroundTexture, createWildGroundTexture, TENDED_TEXTURE_TILES, WILD_TEXTURE_TILES } from './groundTextures';
import { facilityScaleOf, fitMatrixOf } from './modelFit';
import { ModelLibrary } from './modelLibrary';
import { facilityFootprint, modelOfBuilding, renderItemsOf, type HarvestedTile } from './renderItems';
import { ServiceVehicleLayer } from './ServiceVehicleLayer';
import { CongestionLayer } from './CongestionLayer';
import { PedestrianLayer } from './PedestrianLayer';
import { BoatLayer } from './BoatLayer';
import { BridgeLayer } from './BridgeLayer';
import { TrafficLayer } from './TrafficLayer';
import { renderPixelRatio, shouldRenderFrame, watchPageHidden, wantsAntialias } from './renderBudget';
import { ServiceCoverageLayer } from './ServiceCoverageLayer';

const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;
const GROUND_FADE_TILES = 24;
const GROUND_SIZE = MAP_TILES + 2 * (WILD_RIM_TILES + GROUND_FADE_TILES);
const SELECTION_COLOR = 0x4da3ff;
const FLASH_COLOR = 0xffd23f;
const FLASH_DURATION_MS = 2000;
const FLASH_INTERVAL_MS = 250;
const ARROW_MIN_HEIGHT = 1.5;
const FALLBACK_HEIGHT = 1.5;
const HORIZON_COLOR = 0x9ec5e8;
const STREET_FOG_NEAR = 8;
const STREET_FOG_FAR = 40;

export interface SceneHandlers {
  onTap: (tile: Coord, shiftKey: boolean, buildingId: number | null) => void;
  onLongPress: (buildingId: number) => boolean;
  onCenterTileChange: (tile: Coord) => void;
  onMouseMove: (tile: Coord) => void;
  onPointerKind: (pointerType: string) => void;
  onSecondaryClick: () => void;
  onGrabStart: (tile: Coord) => boolean;
  onGrabMove: (tile: Coord) => void;
  onBrushStart: (tile: Coord) => void;
  onBrushMove: (tile: Coord) => void;
  onBrushEnd: () => void;
  onBrushCancel: () => void;
}

export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private library = new ModelLibrary();
  private world = new ChunkedWorld(this.library);
  private scenery = new WildScenery(this.library, wantsAntialias() ? 'full' : 'light');
  private groundSignature = '';
  private ground!: THREE.Mesh<THREE.BufferGeometry>;
  private groundGrid!: Int32Array;
  private parcels = new THREE.Group();
  private tendedMaterial = this.buildTendedMaterial();
  private ghostLayer = new GhostLayer();
  private selectionLayer = new GhostLayer(SELECTION_COLOR, { underBuildings: true });
  private flashLayer = new GhostLayer(FLASH_COLOR);
  private flashTimers: number[] = [];
  private ecologyLayer = new EcologyLayer(this.library);
  private selectedId: number | null = null;
  private serviceCoverageType: FacilityType | null = null;
  private serviceCoverageLayer = new ServiceCoverageLayer();
  private coverageFocus: { type: FacilityType; facilityId: number } | null = null;
  private afterHarvest: readonly HarvestedTile[] = [];
  private ecologicalState: GameState | null = null;
  private congestion = new CongestionLayer();
  private traffic = new TrafficLayer(this.library);
  private pedestrians = new PedestrianLayer();
  private serviceVehicles = new ServiceVehicleLayer(this.library);
  private boats = new BoatLayer(this.library);
  private bridges = new BridgeLayer(this.library);
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private lastCenterTile = '';
  private handlers: SceneHandlers = {
    onTap: () => {},
    onLongPress: () => false,
    onCenterTileChange: () => {},
    onMouseMove: () => {},
    onPointerKind: () => {},
    onSecondaryClick: () => {},
    onGrabStart: () => false,
    onGrabMove: () => {},
    onBrushStart: () => {},
    onBrushMove: () => {},
    onBrushEnd: () => {},
    onBrushCancel: () => {},
  };
  private ownedSignature = '';
  private controller: CameraController;
  private streetView: StreetViewController;
  private latest: GameState | null = null;
  private currentBuildings: readonly Building[] = [];
  private modelHeights = new Map<string, number>();
  private syncing = false;
  private frameHandle = 0;
  private paused = false;
  private hidden = document.hidden;
  private stopWatchingHidden: () => void;
  private markReady: () => void = () => {};
  onLoadProgress(listener: (finished: number, requested: number) => void): () => void {
    return this.library.onProgress(listener);
  }

  readonly ready = new Promise<void>((resolve) => (this.markReady = resolve));
  private lastFrame = performance.now();
  private resizeObserver: ResizeObserver;
  private canvasRect!: DOMRect;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: wantsAntialias(), powerPreference: 'low-power' });
    this.renderer.setPixelRatio(renderPixelRatio());
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.scene.background = new THREE.Color(HORIZON_COLOR);
    this.scene.environment = this.buildEnvironment();
    this.scene.environmentIntensity = 0.25;
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.7);
    sun.position.set(20, 40, 10);
    const sky = new THREE.HemisphereLight(0xbcd8f5, 0x8a7a64, 0.5);
    this.scene.add(sun, sky, this.buildGround(), this.parcels, this.scenery.root, this.world.root, this.ecologyLayer.root, this.congestion.root, this.traffic.root, this.pedestrians.root, this.serviceVehicles.root, this.boats.root, this.bridges.root, this.selectionLayer.root, this.flashLayer.root, this.ghostLayer.root, this.serviceCoverageLayer.root);

    this.controller = new CameraController(canvas, { min: 0, max: MAP_TILES });
    this.streetView = new StreetViewController(canvas);
    this.scene.add(this.streetView.markers);
    this.controller.onTap = (clientX, clientY, shiftKey) =>
      this.withTileAt(clientX, clientY, (tile) => this.handlers.onTap(tile, shiftKey, this.buildingOnTile(tile)));
    this.controller.onLongPress = (clientX, clientY) => {
      let handled = false;
      this.withTileAt(clientX, clientY, (tile) => {
        const buildingId = this.buildingOnTile(tile);
        handled = buildingId !== null && this.handlers.onLongPress(buildingId);
      });
      return handled;
    };
    this.controller.onMouseMove = (clientX, clientY) => this.withTileAt(clientX, clientY, (tile) => this.handlers.onMouseMove(tile));
    this.controller.onPointerKind = (pointerType) => this.handlers.onPointerKind(pointerType);
    this.controller.onSecondaryClick = () => this.handlers.onSecondaryClick();
    this.controller.onGrabStart = (clientX, clientY) => {
      let grabbed = false;
      this.withTileAt(clientX, clientY, (tile) => (grabbed = this.handlers.onGrabStart(tile)));
      return grabbed;
    };
    this.controller.onGrabMove = (clientX, clientY) => this.withTileAt(clientX, clientY, (tile) => this.handlers.onGrabMove(tile));
    this.controller.onBrushStart = (clientX, clientY) => this.withTileAt(clientX, clientY, (tile) => this.handlers.onBrushStart(tile));
    this.controller.onBrushMove = (clientX, clientY) => this.withTileAt(clientX, clientY, (tile) => this.handlers.onBrushMove(tile));
    this.controller.onBrushEnd = () => this.handlers.onBrushEnd();
    this.controller.onBrushCancel = () => this.handlers.onBrushCancel();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.stopWatchingHidden = watchPageHidden((hidden) => {
      this.hidden = hidden;
      this.restartLoop();
    });
    this.restartLoop();
  }

  get camera(): CameraController {
    return this.controller;
  }

  get inStreetView(): boolean {
    return this.streetView.active;
  }

  setStreetViewExit(onExit: () => void): void {
    this.streetView.onExit = onExit;
  }

  enterStreetView(at?: Coord): boolean {
    const state = this.ecologicalState;
    if (!state || this.streetView.active) return false;
    const { x, z } = at ? { x: at.x + 0.5, z: at.y + 0.5 } : this.controller.center;
    if (!this.streetView.enter(pedestrianGraph(state), bridgeElevation(state.bridges), x, z, this.controller.heading)) return false;
    this.controller.setEnabled(false);
    this.scene.fog = new THREE.Fog(HORIZON_COLOR, STREET_FOG_NEAR, STREET_FOG_FAR);
    return true;
  }

  exitStreetView(): void {
    if (!this.streetView.active) return;
    this.streetView.exit();
    this.scene.fog = null;
    this.controller.setEnabled(true);
  }

  private get activeCamera(): THREE.Camera {
    return this.streetView.active ? this.streetView.camera : this.controller.camera;
  }

  setHandlers(handlers: SceneHandlers): void {
    this.handlers = handlers;
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    this.restartLoop();
  }

  private restartLoop(): void {
    cancelAnimationFrame(this.frameHandle);
    if (this.paused || this.hidden) return;
    this.lastFrame = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  setTrafficEnabled(enabled: boolean): void {
    this.traffic.setEnabled(enabled);
    this.pedestrians.setEnabled(enabled);
    this.serviceVehicles.setEnabled(enabled);
  }

  setAfterHarvest(tiles: readonly HarvestedTile[]): void {
    this.afterHarvest = tiles;
    if (!this.ecologicalState) return;
    this.latest = this.ecologicalState;
    void this.drain();
  }

  setServiceCoverage(type: FacilityType | null): void {
    if (this.serviceCoverageType === type) return;
    this.serviceCoverageType = type;
    if (!this.ecologicalState) return;
    this.latest = this.ecologicalState;
    void this.drain();
  }

  setCoverageFocus(focus: { type: FacilityType; facilityId: number } | null): void {
    if (this.coverageFocus?.facilityId === focus?.facilityId && this.coverageFocus?.type === focus?.type) return;
    this.coverageFocus = focus;
    if (!this.ecologicalState) return;
    this.latest = this.ecologicalState;
    void this.drain();
  }

  setBrushMode(enabled: boolean): void {
    this.controller.brushMode = enabled;
  }

  setGhost(ghost: GhostSpec | null): void {
    this.ghostLayer.set(ghost);
  }

  setEcologicalSelection(id: number | null): void {
    this.selectedId = id;
    if (this.ecologicalState) this.ecologyLayer.sync(this.ecologicalState,id);
  }

  setSelection(selection: GhostSpec | null): void {
    this.selectionLayer.set(selection);
  }

  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    const point = new THREE.Vector3(x, y, z).project(this.activeCamera);
    const rect = this.canvasRect;
    return {
      x: ((point.x + 1) / 2) * rect.width + rect.left,
      y: ((1 - point.y) / 2) * rect.height + rect.top,
      visible: point.z >= -1 && point.z <= 1,
    };
  }

  focusOnTile(tile: Coord): void {
    this.controller.focusOn(tile.x + 0.5, tile.y + 0.5);
  }

  flash(ghost: GhostSpec | null, durationMs = FLASH_DURATION_MS): void {
    this.stopFlash();
    if (!ghost) return;
    this.flashLayer.set(ghost);
    let visible = true;
    this.flashTimers = [
      window.setInterval(() => {
        visible = !visible;
        this.flashLayer.root.visible = visible;
      }, FLASH_INTERVAL_MS),
      window.setTimeout(() => this.stopFlash(), durationMs),
    ];
  }

  private stopFlash(): void {
    for (const timer of this.flashTimers) { window.clearInterval(timer); window.clearTimeout(timer); }
    this.flashTimers = [];
    this.flashLayer.set(null);
    this.flashLayer.root.visible = true;
  }

  get centerTile(): Coord {
    const { x, z } = this.controller.center;
    return { x: Math.floor(x), y: Math.floor(z) };
  }

  setState(state: GameState): void {
    this.ecologicalState = state;
    this.ecologyLayer.sync(state,this.selectedId);
    this.latest = state;
    this.currentBuildings = state.buildings;
    if (this.streetView.active) this.streetView.setWorld(pedestrianGraph(state), bridgeElevation(state.bridges));
    void this.drain();
  }

  dispose(): void {
    this.streetView.dispose();
    cancelAnimationFrame(this.frameHandle);
    this.stopWatchingHidden();
    this.resizeObserver.disconnect();
    this.controller.dispose();
    this.ghostLayer.dispose();
    this.stopFlash();
    this.selectionLayer.dispose();
    this.flashLayer.dispose();
    this.congestion.dispose();
    this.traffic.dispose();
    this.pedestrians.dispose();
    this.serviceVehicles.dispose();
    this.boats.dispose();
    this.bridges.dispose();
    this.ecologyLayer.dispose();
    this.serviceCoverageLayer.dispose();
    this.renderer.dispose();
  }

  private async drain(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      while (this.latest) {
        const state = this.latest;
        this.latest = null;
        const serviceType = this.serviceCoverageType;
        const roadTints = congestionTints(congestionStats(state));
        const items = renderItemsOf(state, this.afterHarvest, roadTints);
        await this.library.ensure(items.map((item) => item.model));
        await this.library.ensureTextureVariants(items.flatMap(item => item.textureVariant ? [item.textureVariant] : []));
        this.world.sync(items);
        const focus = serviceType ? null : this.coverageFocus;
        this.serviceCoverageLayer.sync(state, serviceType ?? focus?.type ?? null, focus?.facilityId ?? null);
        await this.scenery.sync(state);
        this.shapeGround(state);
        this.syncParcels(state);
        this.congestion.sync(state);
        this.traffic.sync(state);
    this.pedestrians.sync(state);
        this.serviceVehicles.sync(state);
        this.boats.sync(state);
        this.bridges.sync(state, roadTints);
        this.markReady();
      }
    } finally {
      this.syncing = false;
    }
  }

  private buildEnvironment(): THREE.Texture {
    const generator = new THREE.PMREMGenerator(this.renderer);
    const texture = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    generator.dispose();
    return texture;
  }

  private buildGround(): THREE.Mesh<THREE.BufferGeometry> {
    const texture = createWildGroundTexture();
    texture.repeat.set(GROUND_SIZE / WILD_TEXTURE_TILES, GROUND_SIZE / WILD_TEXTURE_TILES);
    const { geometry, grid } = groundGeometry(MAP_TILES / 2, GROUND_SIZE);
    this.groundGrid = grid;
    this.ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, vertexColors: true, transparent: true }));
    this.ground.position.y = -0.02;
    return this.ground;
  }

  private shapeGround(state: GameState): void {
    const signature = `${state.seed}|${state.ownedParcels.map(parcel => `${parcel.x},${parcel.y}`).join(';')}`;
    if (signature === this.groundSignature) return;
    this.groundSignature = signature;
    const terrain = wildTerrain(state.seed, state.ownedParcels);
    const geometry = this.ground.geometry;
    const position = geometry.attributes.position!;
    const color = geometry.attributes.color as THREE.BufferAttribute;
    const reach = GROUND_SIZE / 2 - GROUND_FADE_TILES;
    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index);
      const z = position.getZ(index);
      position.setY(index, terrain.vertexHeight(this.groundGrid[index * 2]!, this.groundGrid[index * 2 + 1]!));
      const noise = wildNoiseAt(state.seed, x, z);
      const dry = Math.max(0, 0.45 - noise) * 1.6 + position.getY(index) * 0.08;
      const lush = Math.max(0, noise - 0.55) * 1.2;
      const distance = Math.max(Math.abs(x - MAP_TILES / 2), Math.abs(z - MAP_TILES / 2));
      const alpha = 1 - THREE.MathUtils.smoothstep(distance, reach, reach + GROUND_FADE_TILES);
      color.setXYZW(index, 1 + dry * 0.25 - lush * 0.12, 1 - dry * 0.1 - lush * 0.08, 1 - dry * 0.35 - lush * 0.15, alpha);
    }
    for (let face = 0; face < position.count; face += 3) {
      const shade = 1 + (((Math.sin(face * 12.9898 + state.seed.length) * 43758.5453) % 1) - 0.5) * 0.2;
      for (let corner = face; corner < face + 3; corner++) color.setXYZ(corner, color.getX(corner) * shade, color.getY(corner) * shade, color.getZ(corner) * shade);
    }
    position.needsUpdate = true;
    color.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  }

  private buildTendedMaterial(): THREE.MeshStandardMaterial {
    const texture = createTendedGroundTexture();
    const repeat = GAME_CONFIG.parcelSizeInTiles / TENDED_TEXTURE_TILES;
    texture.repeat.set(repeat, repeat);
    return new THREE.MeshStandardMaterial({ map: texture });
  }

  private syncParcels(state: GameState): void {
    const signature = state.ownedParcels.map((parcel) => `${parcel.x},${parcel.y}`).join('|');
    if (signature === this.ownedSignature) return;
    this.ownedSignature = signature;
    for (const child of [...this.parcels.children]) {
      this.parcels.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    const size = GAME_CONFIG.parcelSizeInTiles;
    for (const parcel of state.ownedParcels) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size - 0.1, size - 0.1), this.tendedMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(parcel.x * size + size / 2, -0.01, parcel.y * size + size / 2);
      this.parcels.add(mesh);
    }
  }

  private buildingOnTile(tile: Coord): number | null {
    const building = this.currentBuildings.find((candidate) => footprintTiles(candidate).some((t) => t.x === tile.x && t.y === tile.y));
    return building?.id ?? null;
  }

  arrowAnchorOf(building: Building): { x: number; y: number; z: number } {
    const model = modelOfBuilding(building);
    const topY = facilityFootprint(building) === null && this.library.has(model)
      ? new THREE.Box3().setFromObject(this.library.get(model)).applyMatrix4(fitMatrixOf(model)).max.y
      : 0;
    const tiles = footprintTiles(building);
    return {
      x: tiles.reduce((sum, tile) => sum + tile.x + 0.5, 0) / tiles.length,
      y: Math.max(topY, ARROW_MIN_HEIGHT),
      z: tiles.reduce((sum, tile) => sum + tile.y + 0.5, 0) / tiles.length,
    };
  }

  drawnExtentOf(building: Building): DrawnExtent | null {
    const model = modelOfBuilding(building);
    if (facilityFootprint(building) !== null || !this.library.has(model)) return null;
    const box = new THREE.Box3().setFromObject(this.library.get(model)).applyMatrix4(fitMatrixOf(model));
    const angle = (building.rotation * Math.PI) / 2;
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    const swapped = building.rotation % 2 === 1;
    return {
      width: swapped ? box.max.z - box.min.z : box.max.x - box.min.x,
      depth: swapped ? box.max.x - box.min.x : box.max.z - box.min.z,
      offsetX: centerX * Math.cos(angle) + centerZ * Math.sin(angle),
      offsetY: -centerX * Math.sin(angle) + centerZ * Math.cos(angle),
    };
  }

  buildingHeight(building: Building): number {
    const model = modelOfBuilding(building);
    const footprint = facilityFootprint(building);
    if (footprint === null || !this.library.has(model)) return this.heightOf(model);
    const box = new THREE.Box3().setFromObject(this.library.get(model)).applyMatrix4(fitMatrixOf(model));
    return box.max.y * facilityScaleOf(box, footprint).vertical;
  }

  private heightOf(model: string): number {
    const cached = this.modelHeights.get(model);
    if (cached !== undefined) return cached;
    if (!this.library.has(model)) return FALLBACK_HEIGHT;
    const box = new THREE.Box3().setFromObject(this.library.get(model)).applyMatrix4(fitMatrixOf(model));
    this.modelHeights.set(model, box.max.y);
    return box.max.y;
  }

  private withTileAt(clientX: number, clientY: number, use: (tile: Coord) => void): void {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.controller.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
    if (!hit) return;
    use({ x: Math.floor(hit.x), y: Math.floor(hit.z) });
  }

  private resize(): void {
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.controller.resize();
    this.streetView.resize();
  }

  private notifyCenterTile(): void {
    const tile = this.centerTile;
    const key = `${tile.x},${tile.y}`;
    if (key === this.lastCenterTile) return;
    this.lastCenterTile = key;
    this.handlers.onCenterTileChange(tile);
  }

  private frame = (now: number): void => {
    const elapsed = now - this.lastFrame;
    if (!shouldRenderFrame(elapsed)) {
      this.frameHandle = requestAnimationFrame(this.frame);
      return;
    }
    const delta = Math.max(0, Math.min(0.1, elapsed / 1000));
    this.lastFrame = now;
    this.controller.update(delta);
    this.streetView.update(delta);
    this.notifyCenterTile();
    this.ecologyLayer.update(delta);
    this.traffic.priorityTiles = this.ecologyLayer.transit.priorityTiles;
    this.pedestrians.update(delta);
    this.bridges.update(delta, this.boats.waiting, this.boats.occupied, [...this.traffic.vehicleList, ...this.serviceVehicles.activeVehicles]);
    this.traffic.stopTiles = new Set([...this.pedestrians.crossingTiles, ...this.bridges.stopTiles]);
    this.serviceVehicles.trafficVehicles = this.traffic.vehicleList;
    this.serviceVehicles.stopTiles = new Set([...this.pedestrians.crossingTiles, ...this.ecologyLayer.transit.priorityTiles]);
    this.serviceVehicles.gateTiles = this.bridges.stopTiles;
    this.traffic.externalVehicles = this.serviceVehicles.followingVehicles;
    this.traffic.update(delta, this.activeCamera);
    this.serviceVehicles.update(delta);
    this.boats.update(delta, this.bridges.closedTiles);
    this.renderer.render(this.scene, this.activeCamera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

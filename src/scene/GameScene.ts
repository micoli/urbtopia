import { EcologyLayer } from './EcologyLayer';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GAME_CONFIG, type Building, type GameState } from '../core';
import { CameraController } from './CameraController';
import type { Coord } from '../core';
import type { GhostSpec } from '../tools/tools';
import { buildingBoxes, pickBuilding } from './buildingPicking';
import { ChunkedWorld } from './ChunkedWorld';
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

const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;
const GROUND_SIZE = MAP_TILES * 3;
const SELECTION_COLOR = 0x4da3ff;
const FALLBACK_HEIGHT = 1.5;

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
  private parcels = new THREE.Group();
  private tendedMaterial = this.buildTendedMaterial();
  private ghostLayer = new GhostLayer();
  private selectionLayer = new GhostLayer(SELECTION_COLOR, { underBuildings: true });
  private ecologyLayer = new EcologyLayer(this.library);
  private selectedId: number | null = null;
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
  private latest: GameState | null = null;
  private currentBuildings: readonly Building[] = [];
  private modelHeights = new Map<string, number>();
  private syncing = false;
  private frameHandle = 0;
  private paused = false;
  private markReady: () => void = () => {};
  readonly ready = new Promise<void>((resolve) => (this.markReady = resolve));
  private lastFrame = performance.now();
  private resizeObserver: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.scene.background = new THREE.Color(0x9ec5e8);
    this.scene.environment = this.buildEnvironment();
    this.scene.environmentIntensity = 0.35;
    const sun = new THREE.DirectionalLight(0xfff2d6, 2.0);
    sun.position.set(20, 40, 10);
    const sky = new THREE.HemisphereLight(0xbcd8f5, 0x8a7a64, 0.5);
    this.scene.add(sun, sky, this.buildGround(), this.parcels, this.world.root, this.ecologyLayer.root, this.congestion.root, this.traffic.root, this.pedestrians.root, this.serviceVehicles.root, this.boats.root, this.bridges.root, this.selectionLayer.root, this.ghostLayer.root);

    this.controller = new CameraController(canvas, { min: 0, max: MAP_TILES });
    this.controller.onTap = (clientX, clientY, shiftKey) =>
      this.withTileAt(clientX, clientY, (tile) => this.handlers.onTap(tile, shiftKey, this.pickBuildingAt(clientX, clientY)));
    this.controller.onLongPress = (clientX, clientY) => {
      const buildingId = this.pickBuildingAt(clientX, clientY);
      return buildingId !== null && this.handlers.onLongPress(buildingId);
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
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  get camera(): CameraController {
    return this.controller;
  }

  setHandlers(handlers: SceneHandlers): void {
    this.handlers = handlers;
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) return cancelAnimationFrame(this.frameHandle);
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
    const point = new THREE.Vector3(x, y, z).project(this.controller.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((point.x + 1) / 2) * rect.width + rect.left,
      y: ((1 - point.y) / 2) * rect.height + rect.top,
      visible: point.z >= -1 && point.z <= 1,
    };
  }

  focusOnTile(tile: Coord): void {
    this.controller.focusOn(tile.x + 0.5, tile.y + 0.5);
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
    void this.drain();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controller.dispose();
    this.ghostLayer.dispose();
    this.selectionLayer.dispose();
    this.congestion.dispose();
    this.traffic.dispose();
    this.pedestrians.dispose();
    this.serviceVehicles.dispose();
    this.boats.dispose();
    this.bridges.dispose();
    this.ecologyLayer.dispose();
    this.renderer.dispose();
  }

  private async drain(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      while (this.latest) {
        const state = this.latest;
        this.latest = null;
        const items = renderItemsOf(state, this.afterHarvest);
        await this.library.ensure(items.map((item) => item.model));
        await this.library.ensureTextureVariants(items.flatMap(item => item.textureVariant ? [item.textureVariant] : []));
        this.world.sync(items);
        this.syncParcels(state);
        this.congestion.sync(state);
        this.traffic.sync(state);
    this.pedestrians.sync(state);
        this.serviceVehicles.sync(state);
        this.boats.sync(state);
        this.bridges.sync(state);
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

  private buildGround(): THREE.Mesh {
    const texture = createWildGroundTexture();
    texture.repeat.set(GROUND_SIZE / WILD_TEXTURE_TILES, GROUND_SIZE / WILD_TEXTURE_TILES);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), new THREE.MeshStandardMaterial({ map: texture }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(MAP_TILES / 2, -0.02, MAP_TILES / 2);
    return ground;
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

  private pickBuildingAt(clientX: number, clientY: number): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.controller.camera);
    return pickBuilding(this.raycaster.ray, buildingBoxes(this.currentBuildings, (building) => this.buildingHeight(building)));
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
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.controller.resize();
  }

  private notifyCenterTile(): void {
    const tile = this.centerTile;
    const key = `${tile.x},${tile.y}`;
    if (key === this.lastCenterTile) return;
    this.lastCenterTile = key;
    this.handlers.onCenterTileChange(tile);
  }

  private frame = (now: number): void => {
    const delta = Math.max(0, Math.min(0.1, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.controller.update(delta);
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
    this.traffic.update(delta, this.controller.camera);
    this.serviceVehicles.update(delta);
    this.boats.update(delta, this.bridges.closedTiles);
    this.renderer.render(this.scene, this.controller.camera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

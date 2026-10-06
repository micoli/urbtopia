import * as THREE from 'three';
import { congestionStats, hashSeed, nextRandom, tileKey, transportStats, type Coord, type GameState } from '../core';
import { BUS_MODEL } from './busModel';
import type { ModelLibrary } from './modelLibrary';
import { buildRoadGraph, emptyRoadGraph, type RoadGraph } from './roadGraph';
import { targetVehicleCount } from './trafficTarget';
import { VEHICLE_MODELS } from './vehicleModels';
import { poseOf } from './vehicleMotion';
import { advanceTrafficVehicle, isOnTrafficRoad, isSpotFree, laneTileCount, startBusVehicle, startTrafficVehicle, type TrafficVehicle } from './vehicleTraffic';

const VEHICLE_SCALE = 0.25;
const ROAD_SURFACE_HEIGHT = 0.02;
const BUS_LENGTH = 0.72;
const BUS_SPEED = 1.5;
const MODEL_KEYS: readonly string[] = [...VEHICLE_MODELS, BUS_MODEL];
const BUS_MODEL_INDEX = VEHICLE_MODELS.length;
const BASE_SPEED = 2;
const SPEED_VARIATION = 0.2;
const MAX_VEHICLES = 150;
const SPAWN_ATTEMPTS = 8;

interface ModelMeshes {
  meshes: THREE.Mesh[];
  instances: THREE.InstancedMesh[];
  fit: THREE.Matrix4;
}

export class TrafficLayer {
  readonly root = new THREE.Group();
  priorityTiles: ReadonlySet<string> = new Set();
  stopTiles: ReadonlySet<string> = new Set();
  private models: ModelMeshes[] = [];
  private vehicles: TrafficVehicle[] = [];
  private nextVehicleId = 1;
  private laneTiles = 0;
  private tiers: ReadonlyMap<string, number> = new Map();
  private graph: RoadGraph = emptyRoadGraph();
  private roadTiles: Coord[] = [];
  private roads: GameState['roads'] | null = null;
  private roundabouts: GameState['roundabouts'] | null = null;
  private rngState = 0;
  private seed = '';
  private target = 0;
  private enabled = true;
  private ready = false;
  private frustum = new THREE.Frustum();
  private projection = new THREE.Matrix4();
  private placement = new THREE.Matrix4();
  private combined = new THREE.Matrix4();
  private carFit = new THREE.Matrix4().makeScale(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE);
  private fitted = new THREE.Matrix4();
  private busSignature = '';
  private probe = new THREE.Vector3();
  private touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  constructor(private library: ModelLibrary) {
    this.root.visible = false;
    void this.load();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled && this.ready;
  }

  sync(state: GameState): void {
    if (state.seed !== this.seed) this.reset(state.seed);
    if (state.roads !== this.roads || state.roundabouts !== this.roundabouts) this.rebuildGraph(state);
    this.syncBuses(state);
    this.target = targetVehicleCount({ commuters: congestionStats(state).commuters, laneTiles: this.laneTiles, touch: this.touch });
  }

  update(deltaSeconds: number, camera: THREE.Camera): void {
    if (!this.enabled || !this.ready) return;
    this.updateFrustum(camera);
    this.moveVehicles(deltaSeconds);
    this.adjustCount();
    this.draw();
  }

  dispose(): void {
    for (const model of this.models) for (const instanced of model.instances) instanced.dispose();
  }

  private async load(): Promise<void> {
    await this.library.ensure(MODEL_KEYS);
    this.models = MODEL_KEYS.map((key) => this.buildModel(key));
    this.ready = true;
    this.root.visible = this.enabled;
  }

  private buildModel(key: string): ModelMeshes {
    const meshes: THREE.Mesh[] = [];
    this.library.get(key).traverse((node) => {
      if ((node as THREE.Mesh).isMesh) meshes.push(node as THREE.Mesh);
    });
    const instances = meshes.map((mesh) => {
      const instanced = new THREE.InstancedMesh(mesh.geometry, mesh.material, MAX_VEHICLES);
      instanced.frustumCulled = false;
      instanced.count = 0;
      this.root.add(instanced);
      return instanced;
    });
    return { meshes, instances, fit: key === BUS_MODEL ? this.busFit(key) : this.carFit };
  }

  private busFit(key: string): THREE.Matrix4 {
    const bounds = new THREE.Box3().setFromObject(this.library.get(key));
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = BUS_LENGTH / bounds.getSize(new THREE.Vector3()).z;
    return new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
  }

  private syncBuses(state: GameState): void {
    const lines = transportStats(state).lines.filter((line) => line.mode === 'bus' && line.active && line.route !== null && line.route.length > 1);
    const signature = lines.map((line) => `${line.id}:${line.route!.map(tileKey).join(';')}`).join('|');
    if (signature === this.busSignature) return;
    this.busSignature = signature;
    this.vehicles = this.vehicles.filter((vehicle) => !vehicle.run);
    for (const line of lines) {
      const bus = startBusVehicle(line.route!, this.nextVehicleId, BUS_MODEL_INDEX, BUS_SPEED, this.lanesAt, line.id);
      if (!bus || !isSpotFree(bus, this.vehicles)) continue;
      this.nextVehicleId++;
      this.vehicles.push(bus);
    }
  }

  private carCount(): number {
    return this.vehicles.reduce((count, vehicle) => (vehicle.run ? count : count + 1), 0);
  }

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(seed);
    this.vehicles = [];
    this.busSignature = '';
  }

  private rebuildGraph(state: GameState): void {
    this.roads = state.roads;
    this.roundabouts = state.roundabouts;
    this.graph = buildRoadGraph(state);
    this.roadTiles = [...this.graph.keys()].filter((key) => (this.graph.get(key)?.length ?? 0) > 0).map(parseTile);
    this.tiers = new Map(state.roads.map((road) => [tileKey(road), road.tier ?? 1]));
    this.laneTiles = laneTileCount(this.tiers, this.roadTiles);
    this.vehicles = this.vehicles.filter((vehicle) => isOnTrafficRoad(this.graph, vehicle));
  }

  private lanesAt = (tile: Coord): number => this.tiers.get(tileKey(tile)) ?? 1;

  private random = (): number => {
    const next = nextRandom(this.rngState);
    this.rngState = next.rngState;
    return next.value;
  };

  private updateFrustum(camera: THREE.Camera): void {
    camera.updateMatrixWorld();
    this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection);
  }

  private isInView(tile: Coord): boolean {
    return this.frustum.containsPoint(this.probe.set(tile.x + 0.5, 0, tile.y + 0.5));
  }

  private moveVehicles(deltaSeconds: number): void {
    this.vehicles = this.vehicles.filter((vehicle) => (vehicle.progress < .5 && this.priorityTiles.has(tileKey(vehicle.to))) || advanceTrafficVehicle(this.graph, vehicle, deltaSeconds, this.random, this.vehicles, this.lanesAt, this.stopTiles));
  }

  private adjustCount(): void {
    while (this.carCount() > this.target) this.removeOne();
    while (this.carCount() < this.target) {
      const before = this.vehicles.length;
      this.spawnOne();
      if (this.vehicles.length === before) return;
    }
  }

  private removeOne(): void {
    const hiddenIndex = this.vehicles.findIndex((vehicle) => !vehicle.run && !this.isInView(vehicle.from));
    const lastCar = this.vehicles.map((vehicle) => !vehicle.run).lastIndexOf(true);
    this.vehicles.splice(hiddenIndex >= 0 ? hiddenIndex : lastCar, 1);
  }

  private spawnOne(): void {
    if (this.roadTiles.length === 0) return;
    let tile = this.randomRoadTile();
    for (let attempt = 1; attempt < SPAWN_ATTEMPTS && this.isInView(tile); attempt++) tile = this.randomRoadTile();
    const speed = BASE_SPEED * (1 - SPEED_VARIATION + 2 * SPEED_VARIATION * this.random());
    const model = Math.floor(this.random() * VEHICLE_MODELS.length);
    const vehicle = startTrafficVehicle(this.graph, tile, this.nextVehicleId, model, speed, this.lanesAt, this.random);
    if (!vehicle || !isSpotFree(vehicle, this.vehicles)) return;
    this.nextVehicleId++;
    this.vehicles.push(vehicle);
  }

  private randomRoadTile(): Coord {
    return this.roadTiles[Math.floor(this.random() * this.roadTiles.length)] ?? { x: 0, y: 0 };
  }

  private draw(): void {
    const counts = this.models.map(() => 0);
    for (const vehicle of this.vehicles) {
      const pose = poseOf(vehicle);
      this.placement.makeRotationY(pose.yaw).setPosition(pose.x, ROAD_SURFACE_HEIGHT, pose.z);
      const model = this.models[vehicle.model];
      if (!model) continue;
      this.fitted.multiplyMatrices(this.placement, model.fit);
      const slot = counts[vehicle.model] ?? 0;
      model.instances.forEach((instanced, index) => {
        const mesh = model.meshes[index];
        if (!mesh) return;
        this.combined.multiplyMatrices(this.fitted, mesh.matrixWorld);
        instanced.setMatrixAt(slot, this.combined);
      });
      counts[vehicle.model] = slot + 1;
    }
    this.models.forEach((model, index) => {
      for (const instanced of model.instances) {
        instanced.count = counts[index] ?? 0;
        instanced.instanceMatrix.needsUpdate = true;
      }
    });
  }
}

function parseTile(key: string): Coord {
  const [x = 0, y = 0] = key.split(',').map(Number);
  return { x, y };
}

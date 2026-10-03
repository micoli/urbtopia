import * as THREE from 'three';
import { hashSeed, nextRandom, totalCitizens, transportStats, type Coord, type GameState } from '../core';
import type { ModelLibrary } from './modelLibrary';
import { buildRoadGraph, emptyRoadGraph, type RoadGraph } from './roadGraph';
import { targetVehicleCount } from './trafficTarget';
import { VEHICLE_MODELS } from './vehicleModels';
import { advanceVehicle, isOnRoad, poseOf, startVehicle, type Vehicle } from './vehicleMotion';

const VEHICLE_SCALE = 0.25;
const ROAD_SURFACE_HEIGHT = 0.02;
const BASE_SPEED = 2;
const SPEED_VARIATION = 0.2;
const MAX_VEHICLES = 150;
const SPAWN_ATTEMPTS = 8;

interface ModelMeshes {
  meshes: THREE.Mesh[];
  instances: THREE.InstancedMesh[];
}

export class TrafficLayer {
  readonly root = new THREE.Group();
  private models: ModelMeshes[] = [];
  private vehicles: Vehicle[] = [];
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
  private scale = new THREE.Matrix4().makeScale(VEHICLE_SCALE, VEHICLE_SCALE, VEHICLE_SCALE);
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
    this.target = targetVehicleCount({ citizens: Math.max(0,totalCitizens(state)-transportStats(state).riders), roadTiles: this.roadTiles.length, touch: this.touch });
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
    await this.library.ensure(VEHICLE_MODELS);
    this.models = VEHICLE_MODELS.map((key) => this.buildModel(key));
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
    return { meshes, instances };
  }

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(seed);
    this.vehicles = [];
  }

  private rebuildGraph(state: GameState): void {
    this.roads = state.roads;
    this.roundabouts = state.roundabouts;
    this.graph = buildRoadGraph(state);
    this.roadTiles = [...this.graph.keys()].filter((key) => (this.graph.get(key)?.length ?? 0) > 0).map(parseTile);
    this.vehicles = this.vehicles.filter((vehicle) => isOnRoad(this.graph, vehicle));
  }

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
    this.vehicles = this.vehicles.filter((vehicle) => advanceVehicle(this.graph, vehicle, deltaSeconds, this.random));
  }

  private adjustCount(): void {
    while (this.vehicles.length > this.target) this.removeOne();
    while (this.vehicles.length < this.target) {
      const before = this.vehicles.length;
      this.spawnOne();
      if (this.vehicles.length === before) return;
    }
  }

  private removeOne(): void {
    const hiddenIndex = this.vehicles.findIndex((vehicle) => !this.isInView(vehicle.from));
    this.vehicles.splice(hiddenIndex >= 0 ? hiddenIndex : this.vehicles.length - 1, 1);
  }

  private spawnOne(): void {
    if (this.roadTiles.length === 0) return;
    let tile = this.randomRoadTile();
    for (let attempt = 1; attempt < SPAWN_ATTEMPTS && this.isInView(tile); attempt++) tile = this.randomRoadTile();
    const speed = BASE_SPEED * (1 - SPEED_VARIATION + 2 * SPEED_VARIATION * this.random());
    const model = Math.floor(this.random() * VEHICLE_MODELS.length);
    const vehicle = startVehicle(this.graph, tile, model, speed, this.random);
    if (vehicle) this.vehicles.push(vehicle);
  }

  private randomRoadTile(): Coord {
    return this.roadTiles[Math.floor(this.random() * this.roadTiles.length)] ?? { x: 0, y: 0 };
  }

  private draw(): void {
    const counts = this.models.map(() => 0);
    for (const vehicle of this.vehicles) {
      const pose = poseOf(vehicle);
      this.placement.makeRotationY(pose.yaw).setPosition(pose.x, ROAD_SURFACE_HEIGHT, pose.z);
      this.placement.multiply(this.scale);
      const model = this.models[vehicle.model];
      if (!model) continue;
      const slot = counts[vehicle.model] ?? 0;
      model.instances.forEach((instanced, index) => {
        const mesh = model.meshes[index];
        if (!mesh) return;
        this.combined.multiplyMatrices(this.placement, mesh.matrixWorld);
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

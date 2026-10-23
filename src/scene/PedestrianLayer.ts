import * as THREE from 'three';
import { congestionStats, hashSeed, nextRandom, pedestrianGraph, type GameState, type PedestrianGraph } from '../core';
import { stickCyclist, stickPedestrian } from './stickFigures';
import { bridgeElevation, type ElevationAt } from './bridgeElevation';
import { MAX_CYCLISTS, tileOfNode, MAX_PEDESTRIANS, advancePedestrian, crossedTile, isOnGraph, pedestrianPose, startPedestrian, targetPedestrianCount, type Pedestrian } from './pedestrianWalk';

const SIDEWALK_HEIGHT = 0.03;
const BASE_SPEED = 0.35;
const CYCLING_SPEED_FACTOR = 2.5;
const SPEED_VARIATION = 0.25;
const SPAWN_ATTEMPTS = 8;

interface Fleet {
  mesh: THREE.InstancedMesh;
  figures: Pedestrian[];
  target: number;
  speedFactor: number;
}

function createFleet(geometry: THREE.BufferGeometry, material: THREE.Material, capacity: number, speedFactor: number): Fleet {
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  return { mesh, figures: [], target: 0, speedFactor };
}

export class PedestrianLayer {
  readonly root = new THREE.Group();
  crossingTiles: ReadonlySet<string> = new Set();
  private material = new THREE.MeshBasicMaterial({ vertexColors: true });
  private walkers = createFleet(stickPedestrian(), this.material, MAX_PEDESTRIANS, 1);
  private cyclists = createFleet(stickCyclist(), this.material, MAX_CYCLISTS, CYCLING_SPEED_FACTOR);
  private graph: PedestrianGraph = new Map();
  private nodes: string[] = [];
  private nextId = 1;
  private rngState = 0;
  private seed = '';
  private roads: GameState['roads'] | null = null;
  private brtRoads: GameState['brtRoads'] = undefined;
  private pedestrianWays: GameState['pedestrianWays'] | undefined;
  private enabled = true;
  private bridges: GameState['bridges'] = undefined;
  private elevation: ElevationAt = () => 0;
  private placement = new THREE.Object3D();
  private touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  constructor() {
    this.root.add(this.walkers.mesh, this.cyclists.mesh);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled;
  }

  sync(state: GameState): void {
    if (state.seed !== this.seed) this.reset(state.seed);
    if (state.bridges !== this.bridges) {
      this.bridges = state.bridges;
      this.elevation = bridgeElevation(state.bridges);
    }
    if (state.roads !== this.roads || state.pedestrianWays !== this.pedestrianWays || state.brtRoads !== this.brtRoads) this.rebuildGraph(state);
    const stats = congestionStats(state);
    const walking = stats.walkers + tripsTotal(stats.walkingTrips);
    const cycling = stats.cyclists + tripsTotal(stats.cyclingTrips);
    this.walkers.target = targetPedestrianCount({ people: walking, nodes: this.nodes.length, touch: this.touch });
    this.cyclists.target = targetPedestrianCount({ people: cycling, nodes: this.nodes.length, touch: this.touch, max: MAX_CYCLISTS });
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) return;
    const fleets = [this.walkers, this.cyclists];
    fleets.forEach((fleet) => this.advance(fleet, deltaSeconds));
    this.crossingTiles = new Set(fleets.flatMap((fleet) => fleet.figures.map((figure) => crossedTile(this.graph, figure)).filter((tile): tile is string => tile !== null)));
    fleets.forEach((fleet) => this.draw(fleet));
  }

  dispose(): void {
    [this.walkers, this.cyclists].forEach((fleet) => {
      fleet.mesh.dispose();
      fleet.mesh.geometry.dispose();
    });
    this.material.dispose();
  }

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(seed);
    this.walkers.figures = [];
    this.cyclists.figures = [];
  }

  private rebuildGraph(state: GameState): void {
    this.roads = state.roads;
    this.brtRoads = state.brtRoads;
    this.pedestrianWays = state.pedestrianWays;
    this.graph = pedestrianGraph(state);
    this.nodes = [...this.graph.keys()].sort();
    this.walkers.figures = this.walkers.figures.filter((figure) => isOnGraph(this.graph, figure));
    this.cyclists.figures = this.cyclists.figures.filter((figure) => isOnGraph(this.graph, figure));
  }

  private random = (): number => {
    const next = nextRandom(this.rngState);
    this.rngState = next.rngState;
    return next.value;
  };

  private advance(fleet: Fleet, deltaSeconds: number): void {
    fleet.figures = fleet.figures.filter((figure) => advancePedestrian(this.graph, figure, deltaSeconds, this.random));
    while (fleet.figures.length > fleet.target) fleet.figures.pop();
    for (let attempt = 0; fleet.figures.length < fleet.target && attempt < SPAWN_ATTEMPTS; attempt++) this.spawnOne(fleet);
  }

  private spawnOne(fleet: Fleet): void {
    if (this.nodes.length === 0) return;
    const node = this.nodes[Math.floor(this.random() * this.nodes.length)] ?? '';
    const speed = BASE_SPEED * fleet.speedFactor * (1 - SPEED_VARIATION + 2 * SPEED_VARIATION * this.random());
    const figure = startPedestrian(this.graph, node, this.nextId, speed, this.random);
    if (!figure) return;
    this.nextId++;
    fleet.figures.push(figure);
  }

  private draw(fleet: Fleet): void {
    fleet.figures.forEach((figure, index) => {
      const pose = pedestrianPose(figure);
      this.placement.position.set(pose.x, SIDEWALK_HEIGHT + this.elevation(pose.x, pose.z, tileOfNode(figure.from), tileOfNode(figure.to)), pose.z);
      this.placement.rotation.set(0, pose.yaw, 0);
      this.placement.updateMatrix();
      fleet.mesh.setMatrixAt(index, this.placement.matrix);
    });
    fleet.mesh.count = fleet.figures.length;
    fleet.mesh.instanceMatrix.needsUpdate = true;
  }
}

function tripsTotal(trips: Record<string, number>): number {
  return Object.values(trips).reduce((sum, count) => sum + count, 0);
}

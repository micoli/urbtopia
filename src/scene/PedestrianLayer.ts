import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { congestionStats, hashSeed, nextRandom, pedestrianGraph, type GameState, type PedestrianGraph } from '../core';
import { MAX_PEDESTRIANS, advancePedestrian, crossedTile, isOnGraph, pedestrianPose, startPedestrian, targetPedestrianCount, type Pedestrian } from './pedestrianWalk';

const FIGURE_COLOR = 0x2b2b2b;
const SIDEWALK_HEIGHT = 0.03;
const BASE_SPEED = 0.35;
const SPEED_VARIATION = 0.25;
const SPAWN_ATTEMPTS = 8;

function stickFigure(): THREE.BufferGeometry {
  const part = (width: number, height: number, x: number, y: number, tilt = 0) => {
    const box = new THREE.BoxGeometry(width, height, width);
    box.rotateZ(tilt);
    return box.translate(x, y, 0);
  };
  const head = new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.27, 0);
  const geometries = [head, part(0.016, 0.12, 0, 0.18), part(0.014, 0.1, -0.025, 0.1, 0.25), part(0.014, 0.1, 0.025, 0.1, -0.25), part(0.012, 0.09, -0.04, 0.19, 0.6), part(0.012, 0.09, 0.04, 0.19, -0.6)];
  return mergeGeometries(geometries) ?? head;
}

export class PedestrianLayer {
  readonly root = new THREE.Group();
  crossingTiles: ReadonlySet<string> = new Set();
  private mesh: THREE.InstancedMesh;
  private geometry = stickFigure();
  private material = new THREE.MeshBasicMaterial({ color: FIGURE_COLOR });
  private graph: PedestrianGraph = new Map();
  private nodes: string[] = [];
  private walkers: Pedestrian[] = [];
  private nextId = 1;
  private target = 0;
  private rngState = 0;
  private seed = '';
  private roads: GameState['roads'] | null = null;
  private enabled = true;
  private placement = new THREE.Object3D();
  private touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  constructor() {
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_PEDESTRIANS);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.root.add(this.mesh);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled;
  }

  sync(state: GameState): void {
    if (state.seed !== this.seed) this.reset(state.seed);
    if (state.roads !== this.roads) this.rebuildGraph(state);
    const stats = congestionStats(state);
    const trips = Object.values(stats.walkingTrips).reduce((sum, count) => sum + count, 0);
    this.target = targetPedestrianCount({ people: stats.walkers + trips, nodes: this.nodes.length, touch: this.touch });
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) return;
    this.walkers = this.walkers.filter((walker) => advancePedestrian(this.graph, walker, deltaSeconds, this.random));
    while (this.walkers.length > this.target) this.walkers.pop();
    for (let attempt = 0; this.walkers.length < this.target && attempt < SPAWN_ATTEMPTS; attempt++) this.spawnOne();
    this.crossingTiles = new Set(this.walkers.map((walker) => crossedTile(this.graph, walker)).filter((tile): tile is string => tile !== null));
    this.draw();
  }

  dispose(): void {
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(seed);
    this.walkers = [];
  }

  private rebuildGraph(state: GameState): void {
    this.roads = state.roads;
    this.graph = pedestrianGraph(state);
    this.nodes = [...this.graph.keys()].sort();
    this.walkers = this.walkers.filter((walker) => isOnGraph(this.graph, walker));
  }

  private random = (): number => {
    const next = nextRandom(this.rngState);
    this.rngState = next.rngState;
    return next.value;
  };

  private spawnOne(): void {
    if (this.nodes.length === 0) return;
    const node = this.nodes[Math.floor(this.random() * this.nodes.length)] ?? '';
    const speed = BASE_SPEED * (1 - SPEED_VARIATION + 2 * SPEED_VARIATION * this.random());
    const walker = startPedestrian(this.graph, node, this.nextId, speed, this.random);
    if (!walker) return;
    this.nextId++;
    this.walkers.push(walker);
  }

  private draw(): void {
    this.walkers.forEach((walker, index) => {
      const pose = pedestrianPose(walker);
      this.placement.position.set(pose.x, SIDEWALK_HEIGHT, pose.z);
      this.placement.rotation.set(0, pose.yaw, 0);
      this.placement.updateMatrix();
      this.mesh.setMatrixAt(index, this.placement.matrix);
    });
    this.mesh.count = this.walkers.length;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

import * as THREE from 'three';
import { congestionStats, hashSeed, nextRandom, pedestrianGraph, undergroundWalkGraph, type GameState, type PedestrianGraph } from '../core';
import { AVATAR_HEIGHT, avatarScale, avatarsReady } from './avatarModels';
import type { PedestrianModel } from '../i18n/prefsStore';
import { AvatarActors, type Actor } from './AvatarActors';
import type { ModelLibrary } from './modelLibrary';
import { stickCyclist, stickPedestrian } from './stickFigures';
import { bridgeElevation, type ElevationAt } from './bridgeElevation';
import { MAX_CYCLISTS, tileOfNode, MAX_PEDESTRIANS, advancePedestrian, crossedTile, isOnGraph, pedestrianPose, startPedestrian, targetPedestrianCount, type Pedestrian } from './pedestrianWalk';

const SIDEWALK_HEIGHT = 0.03;
const BASE_SPEED = 0.35;
const CYCLING_SPEED_FACTOR = 2.5;
const SPEED_VARIATION = 0.25;
const SPAWN_ATTEMPTS = 8;
// Walkers and cyclists number their figures apart: an avatar keeps its skin whatever the other fleet does.
const CYCLIST_ID_OFFSET = 1_000_000;

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

// What a layer walks on: the graph, and the parts of the state that change it.
export interface WalkSurface {
  graphOf: (state: GameState) => PedestrianGraph;
  changesOf: (state: GameState) => readonly unknown[];
  share: number;
}

export const SURFACE_WALK: WalkSurface = {
  graphOf: pedestrianGraph,
  changesOf: (state) => [state.roads, state.pedestrianWays, state.brtRoads],
  share: 1,
};

// Level -1: the Citizens who take the walkways are a share of those who walk.
export const UNDERGROUND_WALK: WalkSurface = {
  graphOf: undergroundWalkGraph,
  changesOf: (state) => [state.walkways],
  share: 0.5,
};

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
  private changes: readonly unknown[] = [];
  private enabled = true;
  private bridges: GameState['bridges'] = undefined;
  private elevation: ElevationAt = () => 0;
  private placement = new THREE.Object3D();
  private touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  private avatars: AvatarActors | null = null;
  private model: PedestrianModel = 'stickman';
  private avatarScale = 1;

  constructor(private walkSurface: WalkSurface = SURFACE_WALK, private library?: ModelLibrary) {
    this.root.add(this.walkers.mesh, this.cyclists.mesh);
    this.avatars = library ? new AvatarActors(library, MAX_PEDESTRIANS + MAX_CYCLISTS) : null;
    if (this.avatars) this.root.add(this.avatars.root);
  }

  // The walkers and the cyclists are stick figures, or the avatars of the players, the cyclists on a bicycle, once their models are in the library.
  setModel(model: PedestrianModel): void {
    this.model = model;
    this.walkers.mesh.visible = !this.showsAvatars();
    this.cyclists.mesh.visible = !this.showsAvatars();
    if (this.avatars) this.avatars.root.visible = this.showsAvatars();
  }

  private showsAvatars(): boolean {
    return this.model === 'avatar' && avatarsReady(this.library);
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
    const changes = this.walkSurface.changesOf(state);
    if (changes.length !== this.changes.length || changes.some((change, index) => change !== this.changes[index])) this.rebuildGraph(state, changes);
    const stats = congestionStats(state);
    const share = this.walkSurface.share;
    const walking = (stats.walkers + tripsTotal(stats.walkingTrips)) * share;
    const cycling = (stats.cyclists + tripsTotal(stats.cyclingTrips)) * share;
    this.walkers.target = targetPedestrianCount({ people: walking, nodes: this.nodes.length, touch: this.touch });
    this.cyclists.target = targetPedestrianCount({ people: cycling, nodes: this.nodes.length, touch: this.touch, max: MAX_CYCLISTS });
  }

  update(deltaSeconds: number): void {
    if (!this.enabled) return;
    const fleets = [this.walkers, this.cyclists];
    fleets.forEach((fleet) => this.advance(fleet, deltaSeconds));
    this.crossingTiles = new Set(fleets.flatMap((fleet) => fleet.figures.map((figure) => crossedTile(this.graph, figure)).filter((tile): tile is string => tile !== null)));
    fleets.forEach((fleet) => this.draw(fleet));
    this.setModel(this.model);
    if (this.showsAvatars()) this.drawAvatars(deltaSeconds);
  }

  dispose(): void {
    [this.walkers, this.cyclists].forEach((fleet) => {
      fleet.mesh.dispose();
      fleet.mesh.geometry.dispose();
    });
    this.material.dispose();
    this.avatars?.dispose();
  }

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(seed);
    this.walkers.figures = [];
    this.cyclists.figures = [];
  }

  private rebuildGraph(state: GameState, changes: readonly unknown[]): void {
    this.changes = changes;
    this.graph = this.walkSurface.graphOf(state);
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

  private drawAvatars(deltaSeconds: number): void {
    if (this.avatarScale === 1 && this.library) this.avatarScale = avatarScale(this.library, AVATAR_HEIGHT);
    const actors: Actor[] = this.walkers.figures.map((figure) => {
      const pose = pedestrianPose(figure);
      const y = SIDEWALK_HEIGHT + this.elevation(pose.x, pose.z, tileOfNode(figure.from), tileOfNode(figure.to));
      return { id: figure.id, x: pose.x, y, z: pose.z, yaw: pose.yaw, scale: this.avatarScale, walking: true, pace: figure.speed / BASE_SPEED };
    });
    const riders: Actor[] = this.cyclists.figures.map((figure) => {
      const pose = pedestrianPose(figure);
      const y = SIDEWALK_HEIGHT + this.elevation(pose.x, pose.z, tileOfNode(figure.from), tileOfNode(figure.to));
      return { id: CYCLIST_ID_OFFSET + figure.id, x: pose.x, y, z: pose.z, yaw: pose.yaw, scale: this.avatarScale, walking: true, cyclist: true, pace: (0.7 * figure.speed) / (BASE_SPEED * CYCLING_SPEED_FACTOR) };
    });
    this.avatars?.update([...actors, ...riders], deltaSeconds);
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

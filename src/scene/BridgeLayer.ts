import * as THREE from 'three';
import { bridgeTiles, bridgesOf, roadPiece, tileKey, type Bridge, type GameState } from '../core';
import { fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';
import { BRIDGE_DECK_MODEL } from './renderItems';
import { boatsMayPass, closedBridge, deckBusy, gateEdges, isStoppingTraffic, leafAngle, leafLayout, stepOpening, type BridgeOpening } from './bridgeOpening';
import type { TrafficVehicle } from './vehicleTraffic';

const ROAD_MODEL = 'roads/road-straight';
const DECK_THICKNESS = 0.1;

interface Leaf {
  group: THREE.Group;
  sign: 1 | -1;
}

interface Drawbridge {
  bridge: Bridge;
  deck: ReadonlySet<string>;
  gates: readonly string[];
  opening: BridgeOpening;
  leaves: Leaf[];
}

export class BridgeLayer {
  readonly root = new THREE.Group();
  stopTiles: ReadonlySet<string> = new Set();
  closedTiles: ReadonlySet<string> = new Set();
  private bridges: Drawbridge[] = [];
  private roads: GameState['roads'] | null = null;
  private source: GameState['bridges'] | null = null;
  private ready = false;
  private pending: GameState | null = null;

  constructor(private library: ModelLibrary) {
    void this.load();
  }

  sync(state: GameState): void {
    if (!this.ready) {
      this.pending = state;
      return;
    }
    if (state.bridges === this.source && state.roads === this.roads) return;
    this.source = state.bridges;
    this.roads = state.roads;
    const previous = new Map(this.bridges.map((entry) => [`${entry.bridge.x},${entry.bridge.y},${entry.bridge.length},${entry.bridge.axis}`, entry.opening]));
    this.root.clear();
    this.bridges = bridgesOf(state).map((bridge) => this.build(bridge, previous.get(`${bridge.x},${bridge.y},${bridge.length},${bridge.axis}`)));
  }

  update(deltaSeconds: number, waiting: ReadonlySet<string>, occupied: ReadonlySet<string>, vehicles: readonly TrafficVehicle[]): void {
    const stop = new Set<string>();
    const closed = new Set<string>();
    for (const entry of this.bridges) {
      const decks = [...entry.deck];
      const requested = decks.some((key) => waiting.has(key) || occupied.has(key));
      stepOpening(entry.opening, deltaSeconds, { requested, occupied: decks.some((key) => occupied.has(key)), deckBusy: deckBusy(vehicles, entry.deck) });
      const angle = leafAngle(entry.opening.openness);
      for (const leaf of entry.leaves) this.tilt(leaf, entry.bridge.axis, angle);
      if (isStoppingTraffic(entry.opening)) for (const gate of entry.gates) stop.add(gate);
      if (!boatsMayPass(entry.opening)) for (const key of entry.deck) closed.add(key);
    }
    this.stopTiles = stop;
    this.closedTiles = closed;
  }

  dispose(): void {
    this.root.clear();
    this.bridges = [];
  }

  private tilt({ group, sign }: Leaf, axis: Bridge['axis'], angle: number): void {
    if (axis === 'x') group.rotation.z = sign * angle;
    else group.rotation.x = -sign * angle;
  }

  private build(bridge: Bridge, opening: BridgeOpening = closedBridge()): Drawbridge {
    const tiles = bridgeTiles(bridge);
    const leaves: Leaf[] = leafLayout(bridge.length).map(({ hinge, direction, tiles: count }) => {
      const group = new THREE.Group();
      const [hingeX, hingeZ] = bridge.axis === 'x' ? [bridge.x + hinge, bridge.y + 0.5] : [bridge.x + 0.5, bridge.y + hinge];
      group.position.set(hingeX, 0, hingeZ);
      for (let step = 0; step < count; step++) {
        const piece = this.tile(bridge.axis);
        const along = direction * (step + 0.5);
        if (bridge.axis === 'x') piece.position.x = along;
        else piece.position.z = along;
        group.add(piece);
      }
      this.root.add(group);
      return { group, sign: direction };
    });
    return { bridge, deck: new Set(tiles.map(tileKey)), gates: gateEdges(bridge), opening, leaves };
  }

  private tile(axis: Bridge['axis']): THREE.Group {
    const group = new THREE.Group();
    group.add(this.clone(BRIDGE_DECK_MODEL));
    const road = this.clone(ROAD_MODEL);
    road.position.y = DECK_THICKNESS;
    road.rotation.y = (roadPiece(axis === 'x' ? ['E', 'W'] : ['N', 'S']).rotation * Math.PI) / 2;
    group.add(road);
    return group;
  }

  private clone(model: string): THREE.Object3D {
    const object = this.library.get(model).clone(true);
    object.applyMatrix4(fitMatrixOf(model));
    return object;
  }

  private async load(): Promise<void> {
    await this.library.ensure([ROAD_MODEL, BRIDGE_DECK_MODEL]);
    this.ready = true;
    const pending = this.pending;
    this.pending = null;
    if (pending) this.sync(pending);
  }
}


import * as THREE from 'three';
import { PEDESTRIAN_ACCESS_MODEL, TUNNEL_MODELS, WALKWAY_MODELS } from '../core/infrastructure/infrastructure';
import { ModelInstances, type Placement } from './ModelInstances';
import type { ModelLibrary } from './modelLibrary';
import { DIRECTIONS, neighbour, pedestrianAccessRotation, roadPiece, SURFACE, disconnectedWalkways, footprintTiles, isMetroStationActive, metroStations, tileKey, type GameState, type Level } from '../core';

// A walkway no access reaches is tinted red.
const DISCONNECTED_TINT = 0xff8a80;
const MAX_TILES = 4096;
const PLATFORM_COLOR = 0x4fa3a5;
const PLATFORM_INACTIVE_COLOR = 0x7a7f86;
const PLATFORM_HEIGHT = 0.2;

// What lies under the Surface: the walkways and the stairs are models, the Tunnels and the platforms plain boxes until their models are made.
export class UndergroundLayer {
  readonly walkwaysRoot = new THREE.Group();
  readonly accessesRoot = new THREE.Group();
  readonly tunnelsRoot = new THREE.Group();
  private walkways: Record<string, ModelInstances>;
  private accesses: ModelInstances;
  private tunnels: Record<string, ModelInstances>;
  private platformMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private platforms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, PLATFORM_HEIGHT, 0.96), this.platformMaterial, MAX_TILES);
  private matrix = new THREE.Matrix4();
  private color = new THREE.Color();
  private walkwaysState: GameState['walkways'];
  private accessesState: GameState['pedestrianAccesses'];
  private tunnelsState: GameState['tunnels'];
  private stationsState: GameState['buildings'] | undefined;

  constructor(library: ModelLibrary) {
    this.walkways = Object.fromEntries(Object.entries(WALKWAY_MODELS).map(([piece, model]) => [piece, new ModelInstances(library, model, MAX_TILES)]));
    this.accesses = new ModelInstances(library, PEDESTRIAN_ACCESS_MODEL, MAX_TILES);
    this.tunnels = Object.fromEntries(Object.entries(TUNNEL_MODELS).map(([piece, model]) => [piece, new ModelInstances(library, model, MAX_TILES)]));
    this.platforms.frustumCulled = false;
    this.platforms.count = 0;
    for (const instances of Object.values(this.walkways)) this.walkwaysRoot.add(instances.root);
    this.accessesRoot.add(this.accesses.root);
    for (const instances of Object.values(this.tunnels)) this.tunnelsRoot.add(instances.root);
    this.tunnelsRoot.add(this.platforms);
    this.walkwaysRoot.visible = false;
    this.tunnelsRoot.visible = false;
  }

  setLevel(level: Level): void {
    this.walkwaysRoot.visible = level === -1;
    this.accessesRoot.visible = level === SURFACE || level === -1;
    this.tunnelsRoot.visible = level === -2;
  }

  sync(state: GameState): void {
    if (state.walkways !== this.walkwaysState || state.pedestrianAccesses !== this.accessesState || state.buildings !== this.stationsState) {
      this.walkwaysState = state.walkways;
      this.accessesState = state.pedestrianAccesses;
      this.drawWalkways(state);
      this.drawAccesses(state);
    }
    if (state.tunnels !== this.tunnelsState || state.buildings !== this.stationsState) {
      this.tunnelsState = state.tunnels;
      this.drawTunnels(state);
      this.drawPlatforms(state);
    }
    this.stationsState = state.buildings;
  }

  dispose(): void {
    for (const instances of [...Object.values(this.walkways), ...Object.values(this.tunnels), this.accesses]) instances.dispose();
    for (const mesh of [this.platforms]) {
      mesh.dispose();
      mesh.geometry.dispose();
    }
    this.platformMaterial.dispose();
  }

  // Each tile takes the piece of its shape, as a road tile does, and is tinted when no access reaches it.
  private drawWalkways(state: GameState): void {
    const keys = new Set((state.walkways ?? []).map(tileKey));
    const disconnected = new Set(disconnectedWalkways(state).map(tileKey));
    const byPiece = new Map<string, Placement[]>();
    for (const tile of state.walkways ?? []) {
      const exits = DIRECTIONS.filter((direction) => keys.has(tileKey(neighbour(tile, direction))));
      const { piece, rotation } = roadPiece(exits);
      const list = byPiece.get(piece) ?? [];
      list.push({ x: tile.x + 0.5, z: tile.y + 0.5, rotation, ...(disconnected.has(tileKey(tile)) ? { color: DISCONNECTED_TINT } : {}) });
      byPiece.set(piece, list);
    }
    for (const [piece, instances] of Object.entries(this.walkways)) instances.update(byPiece.get(piece) ?? []);
  }

  private drawAccesses(state: GameState): void {
    this.accesses.update((state.pedestrianAccesses ?? []).map((tile) => ({ x: tile.x + 0.5, z: tile.y + 0.5, rotation: pedestrianAccessRotation(state, tile) })));
  }

  // A Tunnel tile takes the piece of the exits it is joined by, as a road tile does.
  private drawTunnels(state: GameState): void {
    const byPiece = new Map<string, Placement[]>();
    for (const tile of state.tunnels ?? []) {
      const { piece, rotation } = roadPiece(tile.exits);
      const list = byPiece.get(piece) ?? [];
      list.push({ x: tile.x + 0.5, z: tile.y + 0.5, rotation });
      byPiece.set(piece, list);
    }
    for (const [piece, instances] of Object.entries(this.tunnels)) instances.update(byPiece.get(piece) ?? []);
  }

  private drawPlatforms(state: GameState): void {
    let count = 0;
    for (const station of metroStations(state)) {
      const color = isMetroStationActive(state, station) ? PLATFORM_COLOR : PLATFORM_INACTIVE_COLOR;
      for (const tile of footprintTiles(station)) {
        if (count >= MAX_TILES) break;
        this.matrix.makeTranslation(tile.x + 0.5, PLATFORM_HEIGHT / 2, tile.y + 0.5);
        this.platforms.setMatrixAt(count, this.matrix);
        this.platforms.setColorAt(count++, this.color.setHex(color));
      }
    }
    this.platforms.count = count;
    this.platforms.instanceMatrix.needsUpdate = true;
    if (this.platforms.instanceColor) this.platforms.instanceColor.needsUpdate = true;
  }
}

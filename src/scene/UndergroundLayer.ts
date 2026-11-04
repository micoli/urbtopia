import * as THREE from 'three';
import { PEDESTRIAN_ACCESS_MODEL } from '../core/infrastructure/infrastructure';
import { fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';
import { DIRECTION_VECTORS, pedestrianAccessRotation, SURFACE, activeAccesses, disconnectedWalkways, footprintTiles, isMetroStationActive, metroStations, tileKey, type GameState, type Level } from '../core';

const WALKWAY_HEIGHT = 0.1;
const WALKWAY_COLOR = 0xcfc6b4;
const ACCESS_WALKWAY_COLOR = 0xe0a030;
const DISCONNECTED_COLOR = 0xb85450;
const MAX_TILES = 4096;
const MAX_TUNNEL_PIECES = MAX_TILES * 5;
const TUNNEL_HEIGHT = 0.14;
const TUNNEL_WIDTH = 0.5;
const TUNNEL_COLOR = 0x3d4350;
const PLATFORM_COLOR = 0x4fa3a5;
const PLATFORM_INACTIVE_COLOR = 0x7a7f86;
const PLATFORM_HEIGHT = 0.2;

// What lies under the Surface, drawn with plain boxes until the models of the walkways and the stairs are made.
export class UndergroundLayer {
  readonly walkwaysRoot = new THREE.Group();
  readonly accessesRoot = new THREE.Group();
  readonly tunnelsRoot = new THREE.Group();
  private walkwayMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private walkways = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, WALKWAY_HEIGHT, 0.94), this.walkwayMaterial, MAX_TILES);
  private accessMeshes: { mesh: THREE.InstancedMesh; base: THREE.Matrix4 }[] = [];
  private tunnelMaterial = new THREE.MeshLambertMaterial({ color: TUNNEL_COLOR });
  private tunnels = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.tunnelMaterial, MAX_TUNNEL_PIECES);
  private platformMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private platforms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, PLATFORM_HEIGHT, 0.96), this.platformMaterial, MAX_TILES);
  private matrix = new THREE.Matrix4();
  private color = new THREE.Color();
  private walkwaysState: GameState['walkways'];
  private accessesState: GameState['pedestrianAccesses'];
  private tunnelsState: GameState['tunnels'];
  private stationsState: GameState['buildings'] | undefined;

  constructor(private library: ModelLibrary) {
    for (const mesh of [this.walkways, this.tunnels, this.platforms]) {
      mesh.frustumCulled = false;
      mesh.count = 0;
    }
    this.walkwaysRoot.add(this.walkways);
    this.tunnelsRoot.add(this.tunnels, this.platforms);
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
    for (const { mesh } of this.accessMeshes) {
      mesh.dispose();
    }
    for (const mesh of [this.walkways, this.tunnels, this.platforms]) {
      mesh.dispose();
      mesh.geometry.dispose();
    }
    this.walkwayMaterial.dispose();
    this.tunnelMaterial.dispose();
    this.platformMaterial.dispose();
  }

  private drawWalkways(state: GameState): void {
    const tiles = (state.walkways ?? []).slice(0, MAX_TILES);
    const disconnected = new Set(disconnectedWalkways(state).map(tileKey));
    const stairs = new Set(activeAccesses(state).map(tileKey));
    tiles.forEach((tile, index) => {
      this.matrix.makeTranslation(tile.x + 0.5, WALKWAY_HEIGHT / 2, tile.y + 0.5);
      this.walkways.setMatrixAt(index, this.matrix);
      const key = tileKey(tile);
      this.walkways.setColorAt(index, this.color.setHex(disconnected.has(key) ? DISCONNECTED_COLOR : stairs.has(key) ? ACCESS_WALKWAY_COLOR : WALKWAY_COLOR));
    });
    this.walkways.count = tiles.length;
    this.walkways.instanceMatrix.needsUpdate = true;
    if (this.walkways.instanceColor) this.walkways.instanceColor.needsUpdate = true;
  }

  // One box per tile centre and one per exit, reaching the middle of the edge.
  private drawTunnels(state: GameState): void {
    let count = 0;
    const place = (x: number, z: number, sizeX: number, sizeZ: number) => {
      if (count >= MAX_TUNNEL_PIECES) return;
      this.matrix.makeScale(sizeX, TUNNEL_HEIGHT, sizeZ).setPosition(x, TUNNEL_HEIGHT / 2, z);
      this.tunnels.setMatrixAt(count++, this.matrix);
    };
    for (const tile of state.tunnels ?? []) {
      const x = tile.x + 0.5, z = tile.y + 0.5;
      place(x, z, TUNNEL_WIDTH, TUNNEL_WIDTH);
      for (const exit of tile.exits) {
        const vector = DIRECTION_VECTORS[exit];
        place(x + vector.x * 0.25, z + vector.y * 0.25, vector.x === 0 ? TUNNEL_WIDTH : 0.5, vector.y === 0 ? TUNNEL_WIDTH : 0.5);
      }
    }
    this.tunnels.count = count;
    this.tunnels.instanceMatrix.needsUpdate = true;
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

  // The stair model is instanced once per sub-mesh; the layer waits for the library to hold it.
  private accessInstances(): { mesh: THREE.InstancedMesh; base: THREE.Matrix4 }[] {
    if (this.accessMeshes.length > 0 || !this.library.has(PEDESTRIAN_ACCESS_MODEL)) return this.accessMeshes;
    const fit = fitMatrixOf(PEDESTRIAN_ACCESS_MODEL);
    this.library.get(PEDESTRIAN_ACCESS_MODEL).updateMatrixWorld(true);
    this.library.get(PEDESTRIAN_ACCESS_MODEL).traverse((node) => {
      const source = node as THREE.Mesh;
      if (!source.isMesh) return;
      const mesh = new THREE.InstancedMesh(source.geometry, source.material, MAX_TILES);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.accessesRoot.add(mesh);
      this.accessMeshes.push({ mesh, base: fit.clone().multiply(source.matrixWorld) });
    });
    return this.accessMeshes;
  }

  private drawAccesses(state: GameState): void {
    const tiles = (state.pedestrianAccesses ?? []).slice(0, MAX_TILES);
    const placement = new THREE.Matrix4();
    for (const { mesh, base } of this.accessInstances()) {
      tiles.forEach((tile, index) => {
        placement.makeRotationY((pedestrianAccessRotation(state, tile) * Math.PI) / 2).setPosition(tile.x + 0.5, 0, tile.y + 0.5);
        mesh.setMatrixAt(index, placement.clone().multiply(base));
      });
      mesh.count = tiles.length;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

import * as THREE from 'three';
import { SURFACE, activeAccesses, disconnectedWalkways, tileKey, type GameState, type Level } from '../core';

const WALKWAY_HEIGHT = 0.1;
const ACCESS_HEIGHT = 0.3;
const WALKWAY_COLOR = 0xcfc6b4;
const ACCESS_WALKWAY_COLOR = 0xe0a030;
const DISCONNECTED_COLOR = 0xb85450;
const ACCESS_COLOR = 0xd9a441;
const ACCESS_HOLE_COLOR = 0x2b2620;
const MAX_TILES = 4096;

// What lies under the Surface, drawn with plain boxes until the models of the walkways and the stairs are made.
export class UndergroundLayer {
  readonly walkwaysRoot = new THREE.Group();
  readonly accessesRoot = new THREE.Group();
  private walkwayMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private walkways = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, WALKWAY_HEIGHT, 0.94), this.walkwayMaterial, MAX_TILES);
  private accessMaterial = new THREE.MeshLambertMaterial({ color: ACCESS_COLOR });
  private holeMaterial = new THREE.MeshBasicMaterial({ color: ACCESS_HOLE_COLOR });
  private accesses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, ACCESS_HEIGHT, 0.8), this.accessMaterial, MAX_TILES);
  private holes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), this.holeMaterial, MAX_TILES);
  private matrix = new THREE.Matrix4();
  private color = new THREE.Color();
  private walkwaysState: GameState['walkways'];
  private accessesState: GameState['pedestrianAccesses'];

  constructor() {
    for (const mesh of [this.walkways, this.accesses, this.holes]) {
      mesh.frustumCulled = false;
      mesh.count = 0;
    }
    this.walkwaysRoot.add(this.walkways);
    this.accessesRoot.add(this.accesses, this.holes);
    this.walkwaysRoot.visible = false;
  }

  setLevel(level: Level): void {
    this.walkwaysRoot.visible = level === -1;
    this.accessesRoot.visible = level === SURFACE || level === -1;
  }

  sync(state: GameState): void {
    if (state.walkways === this.walkwaysState && state.pedestrianAccesses === this.accessesState) return;
    this.walkwaysState = state.walkways;
    this.accessesState = state.pedestrianAccesses;
    this.drawWalkways(state);
    this.drawAccesses(state);
  }

  dispose(): void {
    for (const mesh of [this.walkways, this.accesses, this.holes]) {
      mesh.dispose();
      mesh.geometry.dispose();
    }
    this.walkwayMaterial.dispose();
    this.accessMaterial.dispose();
    this.holeMaterial.dispose();
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

  private drawAccesses(state: GameState): void {
    const tiles = (state.pedestrianAccesses ?? []).slice(0, MAX_TILES);
    tiles.forEach((tile, index) => {
      this.matrix.makeTranslation(tile.x + 0.5, ACCESS_HEIGHT / 2, tile.y + 0.5);
      this.accesses.setMatrixAt(index, this.matrix);
      this.matrix.makeTranslation(tile.x + 0.5, ACCESS_HEIGHT + 0.01, tile.y + 0.5);
      this.holes.setMatrixAt(index, this.matrix);
    });
    this.accesses.count = tiles.length;
    this.holes.count = tiles.length;
    this.accesses.instanceMatrix.needsUpdate = true;
    this.holes.instanceMatrix.needsUpdate = true;
  }
}

import * as THREE from 'three';
import { GAME_CONFIG, type Level } from '../core';
import { LEVEL_FLOOR_COLORS } from './levelDisplay';

const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;
const FLOOR_Y = -0.03;
const GRID_COLOR = 0x000000;
const GRID_OPACITY = 0.12;

// The earth cut open under the city: a flat floor and a tile grid, shown on an underground Level only.
export class LevelFloor {
  readonly root = new THREE.Group();
  private floorMaterial = new THREE.MeshBasicMaterial({ color: LEVEL_FLOOR_COLORS[-1] });
  private floor = new THREE.Mesh(new THREE.PlaneGeometry(MAP_TILES, MAP_TILES), this.floorMaterial);
  private grid = new THREE.GridHelper(MAP_TILES, MAP_TILES, GRID_COLOR, GRID_COLOR);

  constructor() {
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(MAP_TILES / 2, FLOOR_Y, MAP_TILES / 2);
    this.grid.position.set(MAP_TILES / 2, FLOOR_Y + 0.005, MAP_TILES / 2);
    const gridMaterial = this.grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = GRID_OPACITY;
    this.root.add(this.floor, this.grid);
    this.root.visible = false;
  }

  setLevel(level: Level): void {
    this.root.visible = level !== 0;
    if (level !== 0) this.floorMaterial.color.setHex(LEVEL_FLOOR_COLORS[level]);
  }

  dispose(): void {
    this.floor.geometry.dispose();
    this.floorMaterial.dispose();
    this.grid.geometry.dispose();
    (this.grid.material as THREE.Material).dispose();
  }
}

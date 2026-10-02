import * as THREE from 'three';
import { GAME_CONFIG, type GameState } from '../core';
import { CameraController } from './CameraController';
import type { Coord } from '../core';
import type { GhostSpec } from '../tools/tools';
import { ChunkedWorld } from './ChunkedWorld';
import { GhostLayer } from './GhostLayer';
import { ModelLibrary } from './modelLibrary';
import { renderItemsOf } from './renderItems';

const MAP_TILES = GAME_CONFIG.mapSizeInParcels * GAME_CONFIG.parcelSizeInTiles;
const UNOWNED_COLOR = 0x6f8f5a;
const OWNED_COLOR = 0x92c36f;

export interface SceneHandlers {
  onTap: (tile: Coord) => void;
  onCenterTileChange: (tile: Coord) => void;
}

export class GameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private library = new ModelLibrary();
  private world = new ChunkedWorld(this.library);
  private parcels = new THREE.Group();
  private ghostLayer = new GhostLayer();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private lastCenterTile = '';
  private handlers: SceneHandlers = { onTap: () => {}, onCenterTileChange: () => {} };
  private ownedSignature = '';
  private controller: CameraController;
  private latest: GameState | null = null;
  private syncing = false;
  private frameHandle = 0;
  private lastFrame = performance.now();
  private resizeObserver: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(0x9ec5e8);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(20, 40, 10);
    this.scene.add(sun, new THREE.AmbientLight(0xffffff, 1.2), this.buildGround(), this.parcels, this.world.root, this.ghostLayer.root);

    this.controller = new CameraController(canvas, { min: 0, max: MAP_TILES });
    this.controller.onTap = (clientX, clientY) => this.handleTap(clientX, clientY);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  get camera(): CameraController {
    return this.controller;
  }

  setHandlers(handlers: SceneHandlers): void {
    this.handlers = handlers;
  }

  setGhost(ghost: GhostSpec | null): void {
    this.ghostLayer.set(ghost);
  }

  focusOnTile(tile: Coord): void {
    this.controller.focusOn(tile.x + 0.5, tile.y + 0.5);
  }

  get centerTile(): Coord {
    const { x, z } = this.controller.center;
    return { x: Math.floor(x), y: Math.floor(z) };
  }

  setState(state: GameState): void {
    this.latest = state;
    void this.drain();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controller.dispose();
    this.ghostLayer.dispose();
    this.renderer.dispose();
  }

  private async drain(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      while (this.latest) {
        const state = this.latest;
        this.latest = null;
        const items = renderItemsOf(state);
        await this.library.ensure(items.map((item) => item.model));
        this.world.sync(items);
        this.syncParcels(state);
      }
    } finally {
      this.syncing = false;
    }
  }

  private buildGround(): THREE.Mesh {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP_TILES, MAP_TILES), new THREE.MeshStandardMaterial({ color: UNOWNED_COLOR }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(MAP_TILES / 2, -0.02, MAP_TILES / 2);
    return ground;
  }

  private syncParcels(state: GameState): void {
    const signature = state.ownedParcels.map((parcel) => `${parcel.x},${parcel.y}`).join('|');
    if (signature === this.ownedSignature) return;
    this.ownedSignature = signature;
    for (const child of [...this.parcels.children]) {
      this.parcels.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    const size = GAME_CONFIG.parcelSizeInTiles;
    const material = new THREE.MeshStandardMaterial({ color: OWNED_COLOR });
    for (const parcel of state.ownedParcels) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size - 0.1, size - 0.1), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(parcel.x * size + size / 2, -0.01, parcel.y * size + size / 2);
      this.parcels.add(mesh);
    }
  }

  private handleTap(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.controller.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
    if (!hit) return;
    this.handlers.onTap({ x: Math.floor(hit.x), y: Math.floor(hit.z) });
  }

  private resize(): void {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.controller.resize();
  }

  private notifyCenterTile(): void {
    const tile = this.centerTile;
    const key = `${tile.x},${tile.y}`;
    if (key === this.lastCenterTile) return;
    this.lastCenterTile = key;
    this.handlers.onCenterTileChange(tile);
  }

  private frame = (now: number): void => {
    const delta = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.controller.update(delta);
    this.notifyCenterTile();
    this.renderer.render(this.scene, this.controller.camera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };
}

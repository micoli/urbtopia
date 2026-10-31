import * as THREE from 'three';
import { BOAT_MODEL_FILES, boatModelOf, bridgeKeys, hashSeed, isGatheringActive, navigableWaterKeys, nextRandom, pirateCoveOf, type GameState } from '../core';
import type { ModelLibrary } from './modelLibrary';
import { GUNS_PER_SIDE, cannonPuff } from './cannonFire';
import { PIRATE_PACE, USUAL_PACE, advanceDrift, driftPosition, keyOf, releaseDrift, startDrift, waitingFor, type DriftBoat } from './boatDrift';

const BOAT_ELEVATION = 0.04;
const BOB_HEIGHT = 0.012;
const BOB_SPEED = 1.4;
const MAX_PUFFS = 96;
const GUN_HEIGHT = 0.14;
const HULL_HALF_WIDTH = 0.16;
const GUN_SPACING = 0.16;
const SMOKE_COLOR = new THREE.Color(0xe8e4dc);
const FLASH_COLOR = new THREE.Color(0xffa23f);

interface Floating {
  drift: DriftBoat;
  object: THREE.Object3D;
}

export class BoatLayer {
  readonly root = new THREE.Group();
  private floating = new Map<number, Floating>();
  private reserved = new Map<string, number>();
  private water: ReadonlySet<string> = new Set();
  private bridges: ReadonlySet<string> = new Set();
  private rngState = 0;
  private seed = '';
  private clock = 0;
  private ready = false;
  private enabled = true;
  private pending: GameState | null = null;
  private firing: ReadonlySet<number> = new Set();
  private calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private puffMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private puffs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), this.puffMaterial, MAX_PUFFS);
  private placement = new THREE.Object3D();
  waiting: ReadonlySet<string> = new Set();
  occupied: ReadonlySet<string> = new Set();

  constructor(private library: ModelLibrary) {
    this.puffs.frustumCulled = false;
    this.puffs.count = 0;
    // Colours exist from the start: the material is compiled once, with them.
    this.puffs.setColorAt(0, SMOKE_COLOR);
    this.root.add(this.puffs);
    void this.load();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.root.visible = enabled;
  }

  sync(state: GameState): void {
    if (!this.ready) {
      this.pending = state;
      return;
    }
    if (state.seed !== this.seed) this.reset(state.seed);
    this.water = navigableWaterKeys(state);
    this.bridges = bridgeKeys(state);
    const boats = state.boats ?? [];
    const ids = new Set(boats.map((boat) => boat.id));
    for (const [id, entry] of this.floating) {
      if (ids.has(id)) continue;
      releaseDrift(entry.drift, this.reserved);
      this.root.remove(entry.object);
      this.floating.delete(id);
    }
    for (const boat of boats) {
      if (this.floating.has(boat.id)) continue;
      const object = this.library.get(boatModelOf(state, boat)).clone(true);
      this.root.add(object);
      this.floating.set(boat.id, { drift: startDrift(boat.id, { x: boat.x, y: boat.y }, this.reserved, this.random, boat.family === 'pirate' ? PIRATE_PACE : USUAL_PACE), object });
    }
    this.firing = new Set(boats.filter((boat) => {
      const cove = boat.family === 'pirate' ? pirateCoveOf(state, boat.marinaId) : undefined;
      return cove !== undefined && isGatheringActive(cove, state.lastSeen);
    }).map((boat) => boat.id));
  }

  update(deltaSeconds: number, closedTiles: ReadonlySet<string> = new Set()): void {
    if (!this.enabled || !this.ready) return;
    this.clock += deltaSeconds;
    const context = { water: this.water, reserved: this.reserved, closedTiles, random: this.random };
    const waiting = new Set<string>();
    const occupied = new Set<string>();
    let puffs = 0;
    for (const { drift, object } of this.floating.values()) {
      advanceDrift(drift, deltaSeconds, context);
      const blocked = waitingFor(drift, closedTiles);
      if (blocked) waiting.add(blocked);
      for (const tile of [drift.from, drift.to]) if (tile && this.bridges.has(keyOf(tile))) occupied.add(keyOf(tile));
      const { x, z } = driftPosition(drift);
      object.position.set(x, BOAT_ELEVATION + Math.sin(this.clock * BOB_SPEED + drift.id) * BOB_HEIGHT, z);
      object.rotation.y = drift.heading;
      if (this.firing.has(drift.id) && !this.calm) puffs = this.drawGuns(drift, object, puffs);
    }
    this.puffs.count = puffs;
    this.puffs.instanceMatrix.needsUpdate = true;
    if (this.puffs.instanceColor) this.puffs.instanceColor.needsUpdate = true;
    this.waiting = waiting;
    this.occupied = occupied;
  }

  dispose(): void {
    this.floating.clear();
    this.root.clear();
    this.puffs.dispose();
    this.puffs.geometry.dispose();
    this.puffMaterial.dispose();
  }

  private drawGuns(drift: DriftBoat, object: THREE.Object3D, first: number): number {
    const forwardX = Math.sin(drift.heading);
    const forwardZ = Math.cos(drift.heading);
    let index = first;
    for (const side of [1, -1] as const) {
      for (let gun = 0; gun < GUNS_PER_SIDE && index < MAX_PUFFS; gun++) {
        const puff = cannonPuff(drift.id, side, gun, this.clock);
        if (!puff) continue;
        const along = (gun - (GUNS_PER_SIDE - 1) / 2) * GUN_SPACING;
        const out = side * (HULL_HALF_WIDTH + puff.travel);
        this.placement.position.set(object.position.x + forwardX * along + forwardZ * out, BOAT_ELEVATION + GUN_HEIGHT + puff.rise, object.position.z + forwardZ * along - forwardX * out);
        this.placement.scale.setScalar(puff.size);
        this.placement.updateMatrix();
        this.puffs.setMatrixAt(index, this.placement.matrix);
        this.puffs.setColorAt(index, puff.flash ? FLASH_COLOR : SMOKE_COLOR);
        index++;
      }
    }
    return index;
  }

  private random = (): number => {
    const draw = nextRandom(this.rngState);
    this.rngState = draw.rngState;
    return draw.value;
  };

  private reset(seed: string): void {
    this.seed = seed;
    this.rngState = hashSeed(`${seed}:boats`);
    this.root.clear();
    this.root.add(this.puffs);
    this.floating.clear();
    this.reserved.clear();
  }

  private async load(): Promise<void> {
    await this.library.ensure([...BOAT_MODEL_FILES]);
    this.ready = true;
    const pending = this.pending;
    this.pending = null;
    if (pending) this.sync(pending);
  }
}

import * as THREE from 'three';
import { bridgeKeys, hashSeed, nextRandom, waterKeys, type GameState } from '../core';
import { BOAT_MODELS } from './renderItems';
import type { ModelLibrary } from './modelLibrary';
import { advanceDrift, driftPosition, keyOf, releaseDrift, startDrift, type DriftBoat } from './boatDrift';

const BOAT_ELEVATION = 0.04;
const BOB_HEIGHT = 0.012;
const BOB_SPEED = 1.4;

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

  constructor(private library: ModelLibrary) {
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
    this.water = waterKeys(state);
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
      const object = this.library.get(BOAT_MODELS[boat.family]).clone(true);
      this.root.add(object);
      this.floating.set(boat.id, { drift: startDrift(boat.id, { x: boat.x, y: boat.y }, this.reserved, this.random), object });
    }
  }

  update(deltaSeconds: number): void {
    if (!this.enabled || !this.ready) return;
    this.clock += deltaSeconds;
    const context = { water: this.water, reserved: this.reserved, random: this.random };
    for (const { drift, object } of this.floating.values()) {
      advanceDrift(drift, deltaSeconds, context);
      const { x, z } = driftPosition(drift);
      object.visible = !this.bridges.has(keyOf({ x: Math.floor(x), y: Math.floor(z) }));
      object.position.set(x, BOAT_ELEVATION + Math.sin(this.clock * BOB_SPEED + drift.id) * BOB_HEIGHT, z);
      object.rotation.y = drift.heading;
    }
  }

  dispose(): void {
    this.floating.clear();
    this.root.clear();
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
    this.floating.clear();
    this.reserved.clear();
  }

  private async load(): Promise<void> {
    await this.library.ensure(Object.values(BOAT_MODELS));
    this.ready = true;
    const pending = this.pending;
    this.pending = null;
    if (pending) this.sync(pending);
  }
}

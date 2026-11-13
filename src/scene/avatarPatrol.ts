import * as THREE from 'three';

interface Tile {
  x: number;
  z: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  depth: number;
}

const WALK_SPEED = 0.55;
const MAX_STEPS = 6;

const ringAround = ({ x, y, width, depth }: Box): Tile[] => [
  ...Array.from({ length: width + 2 }, (_, k) => ({ x: x - 1 + k, z: y - 1 })),
  ...Array.from({ length: depth + 1 }, (_, k) => ({ x: x + width, z: y + k })),
  ...Array.from({ length: width + 1 }, (_, k) => ({ x: x + width - 1 - k, z: y + depth })),
  ...Array.from({ length: depth }, (_, k) => ({ x: x - 1, z: y + depth - 1 - k })),
];

// The free tiles of the ring around a Fixture, in a run that a person can walk along without crossing another Fixture.
export function patrolRoute(box: Box, isFree: (x: number, z: number) => boolean): Tile[] {
  const ring = ringAround(box);
  const free = ring.map(tile => isFree(tile.x + 0.5, tile.z + 0.5));
  const start = free.findIndex((isTileFree, index) => isTileFree && !free[(index + ring.length - 1) % ring.length]);
  const from = start === -1 ? free.indexOf(true) : start;
  if (from === -1) return [];
  const route: Tile[] = [];
  for (let step = 0; step < ring.length && route.length < MAX_STEPS; step++) {
    const tile = ring[(from + step) % ring.length]!;
    if (!free[(from + step) % ring.length]) break;
    route.push({ x: tile.x + 0.5, z: tile.z + 0.5 });
  }
  return route;
}

// A person who walks to and fro along a route and stops for a while at each end and now and then in between, turned toward what they attend.
export class AvatarPatrol {
  private index: number;
  private direction = 1;
  private pause: number;
  private walking = false;
  private readonly idle: THREE.AnimationAction | undefined;
  private readonly walk: THREE.AnimationAction | undefined;

  constructor(
    readonly holder: THREE.Object3D,
    readonly mixer: THREE.AnimationMixer,
    clips: readonly THREE.AnimationClip[],
    private readonly route: readonly Tile[],
    private readonly focus: Tile,
    seed: number,
  ) {
    this.index = seed % Math.max(1, route.length);
    this.pause = 1 + (seed % 5) * 0.6;
    this.idle = this.action(clips, 'idle');
    this.walk = this.action(clips, 'walk');
    this.place();
    this.idle?.play();
  }

  get moves(): boolean {
    return this.route.length > 1;
  }

  update(delta: number): void {
    this.mixer.update(delta);
    if (!this.moves) return;
    if (!this.walking) {
      this.pause -= delta;
      if (this.pause > 0) return;
      this.setWalking(true);
    }
    const target = this.route[this.nextIndex()]!;
    const dx = target.x - this.holder.position.x;
    const dz = target.z - this.holder.position.z;
    const distance = Math.hypot(dx, dz);
    const step = WALK_SPEED * delta;
    if (distance > step) {
      this.holder.position.x += (dx / distance) * step;
      this.holder.position.z += (dz / distance) * step;
      this.holder.rotation.y = Math.atan2(dx, dz);
      return;
    }
    this.index = this.nextIndex();
    this.place();
    this.setWalking(false);
    this.pause = 1.5 + Math.random() * 3;
    this.holder.rotation.y = Math.atan2(this.focus.x - this.holder.position.x, this.focus.z - this.holder.position.z);
  }

  private nextIndex(): number {
    if (this.index + this.direction < 0 || this.index + this.direction >= this.route.length) this.direction = -this.direction;
    return this.index + this.direction;
  }

  private place(): void {
    const tile = this.route[this.index];
    if (!tile) return;
    this.holder.position.set(tile.x, 0, tile.z);
    this.holder.rotation.y = Math.atan2(this.focus.x - tile.x, this.focus.z - tile.z);
  }

  private setWalking(walking: boolean): void {
    this.walking = walking;
    const [from, to] = walking ? [this.idle, this.walk] : [this.walk, this.idle];
    from?.fadeOut(0.2);
    to?.reset().fadeIn(0.2).play();
  }

  private action(clips: readonly THREE.AnimationClip[], name: string): THREE.AnimationAction | undefined {
    const clip = clips.find(candidate => candidate.name === name);
    return clip && this.mixer.clipAction(clip);
  }
}

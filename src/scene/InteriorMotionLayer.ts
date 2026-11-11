import * as THREE from 'three';

type Turn = 'cw' | 'ccw';

// What a Fixture turns with: one turn, or for a bevel gear the turn of each of its cones.
export type FixtureMotion = Turn | Readonly<Partial<Record<'front' | 'right' | 'back' | 'left', Turn>>>;

// The cone of a bevel gear that each turning part belongs to.
const CONE_SIDE: Record<string, 'front' | 'right' | 'left'> = { 'spin-y': 'front', 'spin-x': 'right', 'spin-nx': 'left' };

// The turning parts of a model are children named after the axis they turn on, with their origin on it; the part of a press that falls
// and the part of a lathe that slides are children named `slide-up` and `slide-x`.
const AXES: Record<string, THREE.Vector3> = {
  'spin-x': new THREE.Vector3(1, 0, 0),
  // The left cone of a tee turns about the same axis as the right one: the two sides of the tee are one line, and they turn the same way.
  'spin-nx': new THREE.Vector3(1, 0, 0),
  'spin-y': new THREE.Vector3(0, 0, 1),
  'spin-up': new THREE.Vector3(0, 1, 0),
};

// A turn is told about the +x or +z axis of the floor, whatever way the Fixture faces: a Shaft turned half a turn still turns the same way as the Shaft next to it.
function orientationOf(spinner: Spinner): number {
  if (spinner.orientation !== undefined) return spinner.orientation;
  const world = spinner.axis.clone().applyQuaternion(spinner.part.parent!.getWorldQuaternion(new THREE.Quaternion()));
  spinner.orientation = spinner.axis.y !== 0 || world.x + world.z >= 0 ? 1 : -1;
  return spinner.orientation;
}

// How far a sliding part goes from its place in the model, and along which axis.
const SLIDES: Record<string, { axis: THREE.Vector3; travel: number; falls: boolean }> = {
  'slide-up': { axis: new THREE.Vector3(0, 1, 0), travel: 0.12, falls: true },
  'slide-x': { axis: new THREE.Vector3(1, 0, 0), travel: 0.06, falls: false },
};

const RADIANS_PER_SECOND = 1.6;
const PUFFS = 4;
const PUFF_RISE = 0.7;
const PUFF_SECONDS = 2.8;
const PUFF_GEOMETRY = new THREE.IcosahedronGeometry(0.07, 0);

interface Spinner {
  fixtureId: number;
  part: THREE.Object3D;
  axis: THREE.Vector3;
  // 1 when the axis of the part points toward +x or +z of the floor once the Fixture is turned, -1 when it points away.
  orientation?: number;
}

interface Slider {
  fixtureId: number;
  part: THREE.Object3D;
  home: THREE.Vector3;
  axis: THREE.Vector3;
  travel: number;
  falls: boolean;
}

interface Smoke {
  fixtureId: number;
  puffs: THREE.Mesh[];
  origin: THREE.Vector3;
}

// Moves the parts of the Fixtures of a Factory floor that run: what turns, what slides, and the smoke of a Boiler. A picture only, never saved,
// off under reduced motion. Its pace follows the speed bonus of the floor.
export class FloorMotionLayer {
  private spinners: Spinner[] = [];
  private sliders: Slider[] = [];
  private smokes: Smoke[] = [];
  private motion: ReadonlyMap<number, FixtureMotion> = new Map();
  private speed = 1;
  private time = 0;
  private calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  clear(): void {
    this.spinners = [];
    this.sliders = [];
    for (const smoke of this.smokes) for (const puff of smoke.puffs) {
      puff.parent?.remove(puff);
      (puff.material as THREE.Material).dispose();
    }
    this.smokes = [];
  }

  bind(fixtureId: number, model: THREE.Object3D, smoke?: readonly [number, number, number]): void {
    model.traverse(node => {
      const axis = AXES[node.name];
      if (axis) this.spinners.push({ fixtureId, part: node, axis });
      const slide = SLIDES[node.name];
      if (slide) this.sliders.push({ fixtureId, part: node, home: node.position.clone(), ...slide });
    });
    if (!smoke) return;
    const puffs = Array.from({ length: PUFFS }, () => {
      const puff = new THREE.Mesh(PUFF_GEOMETRY, new THREE.MeshBasicMaterial({ color: 0xd8d8dc, transparent: true, opacity: 0, depthWrite: false }));
      puff.visible = false;
      model.add(puff);
      return puff;
    });
    this.smokes.push({ fixtureId, puffs, origin: new THREE.Vector3(...smoke) });
  }

  setMotion(motion: ReadonlyMap<number, FixtureMotion>): void {
    this.motion = motion;
  }

  // The pace of everything that moves, 1 with no bonus.
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  get active(): boolean {
    if (this.calm) return false;
    const running = (fixtureId: number) => this.motion.has(fixtureId);
    return this.spinners.some(({ fixtureId }) => running(fixtureId)) || this.sliders.some(({ fixtureId }) => running(fixtureId)) || this.smokes.some(({ fixtureId }) => running(fixtureId));
  }

  update(delta: number): void {
    if (this.calm) return;
    const step = delta * this.speed;
    this.time += step;
    for (const spinner of this.spinners) {
      const motion = this.motion.get(spinner.fixtureId);
      const turn = typeof motion === 'string' ? motion : motion?.[CONE_SIDE[spinner.part.name]!];
      if (turn) spinner.part.rotateOnAxis(spinner.axis, (turn === 'cw' ? -1 : 1) * orientationOf(spinner) * RADIANS_PER_SECOND * step);
    }
    for (const { fixtureId, part, home, axis, travel, falls } of this.sliders) {
      const running = this.motion.has(fixtureId);
      const wave = running ? (falls ? -0.5 + 0.5 * Math.cos(this.time * RADIANS_PER_SECOND * 1.5) : Math.sin(this.time * RADIANS_PER_SECOND)) : 0;
      part.position.copy(home).addScaledVector(axis, wave * travel);
    }
    for (const { fixtureId, puffs, origin } of this.smokes) this.puff(puffs, origin, this.motion.has(fixtureId));
  }

  private puff(puffs: readonly THREE.Mesh[], origin: THREE.Vector3, running: boolean): void {
    puffs.forEach((puff, index) => {
      const age = (this.time / PUFF_SECONDS + index / PUFFS) % 1;
      puff.visible = running;
      if (!running) return;
      puff.position.set(origin.x + age * 0.14, origin.y + age * PUFF_RISE, origin.z);
      puff.scale.setScalar(0.6 + age * 1.5);
      (puff.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - age);
    });
  }
}

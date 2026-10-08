import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { fixtureTiles, type Coord, type VenueFixture } from '../core';
import type { ModelLibrary } from './modelLibrary';
import { VENUE_CROWD_MODELS } from './renderItems';
import { clipSeconds, makeWorld, pickClip, reconcile, repath, stepAgent, type Agent, type Dice, type World } from './venueAgents';
import type { Figure } from './venueCrowd';

const CROWD_SCALE = 0.7;
const BAR = { width: 0.46, height: 0.07, lift: 0.8, background: 0x10131c };
const RECONCILE_EVERY = 0.9;
const FADE = 0.2;

interface Visual {
  holder: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  clip: string;
  mode: Agent['mode'] | '';
  until: number;
  speed: number;
  bar: { group: THREE.Group; fill: THREE.Mesh; material: THREE.MeshBasicMaterial } | null;
}

const barGeometry = new THREE.PlaneGeometry(1, 1);
const backgroundMaterial = new THREE.MeshBasicMaterial({ color: BAR.background, transparent: true, opacity: 0.5, depthTest: false });

// The people of a Venue: they walk in, play, queue and leave, and the employees make their rounds. All of it is drawn from
// the aggregate model and never saved.
export class VenueCrowdLayer {
  readonly root = new THREE.Group();
  private agents: Agent[] = [];
  private visuals = new Map<number, Visual>();
  private world: World;
  private plan: readonly Figure[] = [];
  private mood = 0.7;
  private fixtures: readonly VenueFixture[] = [];
  private nextId = 1;
  private dice: Dice;
  private clock = 0;
  private enabled = false;
  private started = false;

  constructor(private library: ModelLibrary, private size: number, private entrance: Coord, seed: number) {
    this.dice = { rng: seed >>> 0 };
    this.world = makeWorld(size, entrance, [], []);
  }

  enable(): void {
    this.enabled = true;
    this.reconcile(!this.started);
  }

  setSize(size: number): void {
    this.size = size;
    this.rebuildWorld();
  }

  setFixtures(fixtures: readonly VenueFixture[]): void {
    this.fixtures = fixtures;
    this.rebuildWorld();
  }

  setPlan(plan: readonly Figure[], mood: number): void {
    this.plan = plan;
    this.mood = mood;
    if (this.enabled) this.reconcile(!this.started);
  }

  get active(): boolean {
    return this.agents.length > 0;
  }

  update(delta: number, camera: THREE.Camera): void {
    if (!this.enabled) return;
    this.clock += delta;
    if (this.clock >= RECONCILE_EVERY) {
      this.clock = 0;
      this.reconcile(false, 1);
    }
    this.agents = this.agents.flatMap(agent => stepAgent(agent, this.world, delta, this.dice, this.mood) ?? []);
    this.syncVisuals(delta, camera);
  }

  dispose(): void {
    for (const visual of this.visuals.values()) this.release(visual);
    this.visuals.clear();
    this.agents = [];
  }

  private rebuildWorld(): void {
    const blocked = this.fixtures.flatMap(fixtureTiles);
    const taken = new Set(blocked.map(cell => `${cell.x}:${cell.y}`));
    taken.add(`${this.entrance.x}:${this.entrance.y}`);
    const errands: Coord[] = [];
    for (const fixture of this.fixtures) {
      const front = fixtureTiles(fixture)
        .flatMap(tile => [{ x: tile.x, y: tile.y + 1 }, { x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y }, { x: tile.x, y: tile.y - 1 }])
        .find(cell => cell.x >= 0 && cell.y >= 0 && cell.x < this.size && cell.y < this.size && !taken.has(`${cell.x}:${cell.y}`));
      if (front && !errands.some(cell => cell.x === front.x && cell.y === front.y)) errands.push(front);
    }
    this.world = makeWorld(this.size, this.entrance, blocked, errands);
    this.agents = repath(this.agents, this.world);
  }

  private reconcile(initial: boolean, spawns = 0): void {
    const result = reconcile(this.agents, this.plan, this.world, this.nextId, this.dice, { initial, spawns }, this.mood);
    this.agents = result.agents;
    this.nextId = result.nextId;
    if (initial && this.plan.length > 0) this.started = true;
  }

  private visualOf(agent: Agent): Visual {
    const known = this.visuals.get(agent.id);
    if (known) return known;
    const model = VENUE_CROWD_MODELS[agent.kind === 'employee' ? 'employee' : 'gamer'];
    const holder = new THREE.Group();
    const body = cloneModel(this.library.get(model));
    holder.add(body);
    holder.scale.setScalar(CROWD_SCALE);
    const mixer = new THREE.AnimationMixer(body);
    const actions = new Map(this.library.clipsOf(model).map(clip => [clip.name, mixer.clipAction(clip)]));
    let bar: Visual['bar'] = null;
    if (agent.kind === 'customer') {
      const group = new THREE.Group();
      const background = new THREE.Mesh(barGeometry, backgroundMaterial);
      background.scale.set(BAR.width, BAR.height, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x35d07f, transparent: true, opacity: 0.95, depthTest: false });
      const fill = new THREE.Mesh(barGeometry, material);
      fill.position.z = 0.001;
      group.add(background, fill);
      group.renderOrder = 20;
      background.renderOrder = 20;
      fill.renderOrder = 21;
      this.root.add(group);
      bar = { group, fill, material };
    }
    this.root.add(holder);
    const visual: Visual = { holder, mixer, actions, clip: '', mode: '', until: 0, speed: 0.88 + Math.random() * 0.26, bar };
    this.visuals.set(agent.id, visual);
    return visual;
  }

  private syncVisuals(delta: number, camera: THREE.Camera): void {
    const alive = new Set<number>();
    for (const agent of this.agents) {
      alive.add(agent.id);
      const visual = this.visualOf(agent);
      visual.holder.position.set(agent.x, 0, agent.y);
      visual.holder.rotation.y = agent.facing;
      this.choose(visual, agent, delta);
      visual.mixer.update(delta * visual.speed);
      if (!visual.bar) continue;
      const level = Math.min(1, Math.max(0, agent.satisfaction));
      visual.bar.group.position.set(agent.x, BAR.lift, agent.y);
      visual.bar.group.quaternion.copy(camera.quaternion);
      visual.bar.fill.scale.set(Math.max(0.001, (BAR.width - 0.02) * level), BAR.height - 0.03, 1);
      visual.bar.fill.position.x = -((BAR.width - 0.02) - (BAR.width - 0.02) * level) / 2;
      visual.bar.material.color.setHSL(0.02 + 0.3 * level, 0.55, 0.5);
    }
    for (const [id, visual] of this.visuals) {
      if (alive.has(id)) continue;
      this.release(visual);
      this.visuals.delete(id);
    }
  }

  // A person keeps a gesture for a few seconds, then draws another; a new activity draws at once.
  private choose(visual: Visual, agent: Agent, delta: number): void {
    const moving = agent.mode === 'walking' || agent.mode === 'leaving' || agent.mode === 'errand';
    if (moving) {
      visual.until = 0;
      visual.mode = agent.mode;
      this.play(visual, 'walk');
      return;
    }
    visual.until -= delta;
    if (visual.until > 0 && visual.mode === agent.mode) return;
    visual.mode = agent.mode;
    visual.until = clipSeconds(Math.random());
    this.play(visual, pickClip(agent.mode, agent.kind, agent.satisfaction, Math.random()));
  }

  private play(visual: Visual, clip: string): void {
    if (visual.clip === clip) return;
    const next = visual.actions.get(clip) ?? visual.actions.get('idle');
    if (!next) return;
    const previous = visual.actions.get(visual.clip);
    next.reset().fadeIn(FADE).play();
    next.time = Math.random() * next.getClip().duration;
    if (previous && previous !== next) previous.fadeOut(FADE);
    visual.clip = clip;
  }

  private release(visual: Visual): void {
    visual.mixer.stopAllAction();
    this.root.remove(visual.holder);
    if (visual.bar) {
      this.root.remove(visual.bar.group);
      visual.bar.material.dispose();
    }
  }
}

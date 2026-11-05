import * as THREE from 'three';
import { clone as cloneModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BICYCLE_MODEL } from '../core/infrastructure/infrastructure';
import { AVATAR_MODELS } from './avatarModels';
import type { ModelLibrary } from './modelLibrary';

export interface Actor {
  // Stable: an actor keeps its avatar and its pace from one frame to the next.
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  walking: boolean;
  // On a bicycle: the avatar sits on it and pedals.
  cyclist?: boolean;
  // How fast it goes, as a share of the pace the walk clip is drawn at.
  pace?: number;
}

interface Visual {
  holder: THREE.Group;
  mixer: THREE.AnimationMixer;
  walk: THREE.AnimationAction | null;
  idle: THREE.AnimationAction | null;
  walking: boolean;
  cyclist: boolean;
}

const FADE = 0.15;
// The walk clip is drawn for a person who takes about one stride a second.
const STRIDE_RATE = 1.4;
// A bicycle drawn at human size is as long as a person is tall: shrunk to the size of the character, it carries it on the saddle.
const BICYCLE_SCALE = 0.52;
// The saddle is behind the middle of the bicycle, at the height of the hips of the character.
const SADDLE = { behind: 0.17, up: 0.25 };

// A cyclist sits on the saddle, leans a little towards the handlebar, holds it with both hands (the arms of the "holding-both" clip) and
// pedals: its legs swing in turn around a slope that reaches the pedals. The angles turn a limb about the side axis, positive towards the
// back for a leg (the bind pose of the legs is a half turn, hence the sign) and towards the front for the torso.
const PEDAL = { slope: -0.45, swing: 0.28, lean: 0.25, steps: 16, seconds: 0.8 };

function legTrack(bone: string, offset: number): THREE.QuaternionKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];
  for (let step = 0; step <= PEDAL.steps; step++) {
    const angle = PEDAL.slope + PEDAL.swing * Math.sin((2 * Math.PI * step) / PEDAL.steps + offset);
    times.push((PEDAL.seconds * step) / PEDAL.steps);
    values.push(Math.cos(angle / 2), 0, 0, -Math.sin(angle / 2));
  }
  return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, values);
}

function pedalling(mixer: THREE.AnimationMixer, clips: readonly THREE.AnimationClip[]): THREE.AnimationAction | null {
  const hold = clips.find((clip) => clip.name === 'holding-both');
  const walk = clips.find((clip) => clip.name === 'walk');
  if (!hold) return walk ? mixer.clipAction(walk) : null;
  const kept = hold.tracks.filter((track) => !(track.name.startsWith('leg') || track.name.startsWith('torso')) || !track.name.endsWith('.quaternion'));
  const torso = new THREE.QuaternionKeyframeTrack('torso.quaternion', [0, PEDAL.seconds], [Math.sin(PEDAL.lean / 2), 0, 0, Math.cos(PEDAL.lean / 2), Math.sin(PEDAL.lean / 2), 0, 0, Math.cos(PEDAL.lean / 2)]);
  return mixer.clipAction(new THREE.AnimationClip('pedalling', PEDAL.seconds, [...kept, torso, legTrack('leg-left', 0), legTrack('leg-right', Math.PI)]));
}

// The avatars of the players as figures that walk: each actor is a clone of its character model with its own animation mixer,
// kept in a pool so that a figure that goes away leaves its clone to the next one.
export class AvatarActors {
  readonly root = new THREE.Group();
  private active = new Map<number, Visual>();
  private pool: Visual[][] = [];

  constructor(private library: ModelLibrary, private capacity: number) {
    this.resetPool();
  }

  update(actors: readonly Actor[], delta: number): void {
    const wanted = new Map(actors.slice(0, this.capacity).map((actor) => [actor.id, actor]));
    for (const [id, visual] of this.active) {
      if (wanted.has(id)) continue;
      visual.holder.visible = false;
      this.pool[this.poolOf(id, visual.cyclist)]!.push(visual);
      this.active.delete(id);
    }
    for (const actor of wanted.values()) {
      const visual = this.active.get(actor.id) ?? this.take(actor.id, actor.cyclist === true);
      this.active.set(actor.id, visual);
      visual.holder.visible = true;
      visual.holder.position.set(actor.x, actor.y, actor.z);
      visual.holder.rotation.y = actor.yaw;
      visual.holder.scale.setScalar(actor.scale);
      this.pose(visual, actor.walking || visual.cyclist, actor.pace ?? 1);
      visual.mixer.update(delta);
    }
  }

  dispose(): void {
    for (const visual of [...this.active.values(), ...this.pool.flat()]) {
      visual.mixer.stopAllAction();
      visual.mixer.uncacheRoot(visual.holder);
    }
    this.active.clear();
    this.resetPool();
  }

  // Walkers and cyclists keep apart: a cyclist's clone carries its bicycle.
  private resetPool(): void {
    this.pool = [...AVATAR_MODELS, ...AVATAR_MODELS].map(() => []);
  }

  private poolOf(id: number, cyclist: boolean): number {
    return (id % AVATAR_MODELS.length) + (cyclist ? AVATAR_MODELS.length : 0);
  }

  private take(id: number, cyclist: boolean): Visual {
    const index = id % AVATAR_MODELS.length;
    const reused = this.pool[this.poolOf(id, cyclist)]!.pop();
    if (reused) return reused;
    const model = AVATAR_MODELS[index]!;
    const holder = new THREE.Group();
    const body = cloneModel(this.library.get(model));
    // The glTF axes: the front of the models is +Z, so "forward" along the bicycle is +Z too.
    if (cyclist) {
      body.position.set(0, SADDLE.up, -SADDLE.behind);
      const bicycle = cloneModel(this.library.get(BICYCLE_MODEL));
      bicycle.scale.setScalar(BICYCLE_SCALE);
      holder.add(bicycle);
    }
    holder.add(body);
    this.root.add(holder);
    const mixer = new THREE.AnimationMixer(holder);
    const clips = this.library.clipsOf(model);
    const play = (name: string) => {
      const clip = clips.find((candidate) => candidate.name === name);
      return clip ? mixer.clipAction(clip) : null;
    };
    const walk = cyclist ? pedalling(mixer, clips) : play('walk');
    const idle = cyclist ? null : play('idle');
    // Each figure starts at its own point of the stride, so that a crowd does not step in unison.
    if (walk) { walk.play(); walk.time = (id * 0.37) % walk.getClip().duration; }
    return { holder, mixer, walk, idle, walking: true, cyclist };
  }

  private pose(visual: Visual, walking: boolean, pace: number): void {
    if (visual.walk) visual.walk.timeScale = STRIDE_RATE * pace;
    if (walking === visual.walking) return;
    visual.walking = walking;
    const [on, off] = walking ? [visual.walk, visual.idle] : [visual.idle, visual.walk];
    off?.fadeOut(FADE);
    on?.reset().fadeIn(FADE).play();
  }
}

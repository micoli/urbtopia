import * as THREE from 'three'

// One model with its glTF clips. A clip that is not in the model is skipped, so a passive Part has no idle.
export class Actor {
  private readonly mixer: THREE.AnimationMixer

  constructor(readonly root: THREE.Object3D, private readonly clips: readonly THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root)
  }

  rest() {
    this.mixer.stopAllAction()
  }

  loop(name: string) {
    const action = this.start(name, THREE.LoopRepeat)
    if (!action) this.rest()
  }

  // Shows the pose a clip ends on, with no motion: the state of a lit candle or a switched lever.
  hold(name: string) {
    const action = this.start(name, THREE.LoopOnce)
    if (!action) return this.rest()
    action.time = action.getClip().duration
    this.mixer.update(0)
  }

  // Plays a clip once, then loops `then` when there is one, else stays on its last pose.
  once(name: string, then?: string) {
    const action = this.start(name, THREE.LoopOnce)
    if (!action || !then) return
    const finished = (event: { action: THREE.AnimationAction }) => {
      if (event.action !== action) return
      this.mixer.removeEventListener('finished', finished)
      this.loop(then)
    }
    this.mixer.addEventListener('finished', finished)
  }

  update(seconds: number) {
    this.mixer.update(seconds)
  }

  private start(name: string, loop: THREE.AnimationActionLoopStyles): THREE.AnimationAction | undefined {
    const clip = this.clips.find((candidate) => candidate.name === name)
    if (!clip) return undefined
    this.mixer.stopAllAction()
    const action = this.mixer.clipAction(clip).reset()
    action.setLoop(loop, loop === THREE.LoopRepeat ? Infinity : 1)
    action.clampWhenFinished = true
    action.play()
    return action
  }
}

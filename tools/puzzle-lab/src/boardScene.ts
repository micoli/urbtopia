import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { lightingOf } from '../../../src/scene/dayLighting'
import { ModelLibrary } from '../../../src/scene/modelLibrary'
import { cellKey, progressAt } from '../../../src/core/dailyPuzzle/progress'
import { fanBlowsOn } from '../../../src/core/dailyPuzzle/simulate'
import type { Cell, PlacedPart, Puzzle } from '../../../src/core/dailyPuzzle/types'
import { Actor } from './actor'
import { aimModels, MODEL_KEYS, partLook } from './partModels'

const BALL_RADIUS = 0.14
// Mostly in front of the board, so that the shadows fall short on the backdrop.
const SUN_OFFSET = new THREE.Vector3(-8, 16, 30)
const CAMERA_DISTANCE = 30
const CAMERA_PITCH_DEGREES = 20
const BACKDROP = 0x9ec3e6
const GRID_LINES = 0x7aa3cc
const BACKDROP_DEPTH = -0.6

interface Placed {
  actor: Actor
  cell: Cell
  kind: string
}

// The board in front view: x to the right, y up, the models as the glTF files draw them (the front of a model faces the camera).
export class BoardScene {
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100)
  private readonly controls: OrbitControls
  private readonly scene = new THREE.Scene()
  private readonly content = new THREE.Group()
  private readonly sun = new THREE.DirectionalLight()
  private readonly clock = new THREE.Clock()
  private readonly library = new ModelLibrary('/glb/')
  private actors: Actor[] = []
  private parts: Placed[] = []
  private candles: Placed[] = []
  private switches: Placed[] = []
  private stars: Placed[] = []
  private targets: Placed[] = []
  private ball: Actor | undefined
  private ballRoll = new THREE.Group()
  private puzzle: Puzzle | undefined
  private path: Cell[] = []
  private solved = false
  private tick = 0
  private move = { from: new THREE.Vector3(), to: new THREE.Vector3(), elapsed: 1, duration: 1 }
  private boardSize = { width: 1, height: 1 }
  private loaded: Promise<void> | undefined

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 0.8
    this.renderer.shadowMap.enabled = true
    const generator = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = generator.fromScene(new RoomEnvironment(), 0.04).texture
    generator.dispose()
    this.scene.background = new THREE.Color()
    const sky = new THREE.HemisphereLight()
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    this.scene.add(this.sun, this.sun.target, sky, this.content)
    const lighting = lightingOf(1, true)
    this.sun.color.setHex(lighting.sunColor)
    this.sun.intensity = lighting.sunIntensity
    sky.color.setHex(lighting.skyColor)
    sky.groundColor.setHex(lighting.groundColor)
    sky.intensity = lighting.hemisphereIntensity
    this.scene.environmentIntensity = lighting.environmentIntensity
    ;(this.scene.background as THREE.Color).setHex(lighting.background)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = false
    canvas.addEventListener('dblclick', () => this.frame())
    this.renderer.setAnimationLoop(() => this.draw())
  }

  load(): Promise<void> {
    this.loaded ??= this.library.ensure(MODEL_KEYS)
    return this.loaded
  }

  async show(puzzle: Puzzle, parts: PlacedPart[], path: Cell[], solved: boolean) {
    await this.load()
    this.puzzle = puzzle
    this.path = path
    this.solved = solved
    this.boardSize = { width: puzzle.board.width, height: puzzle.board.height }
    this.build(parts)
    this.frame()
    this.seek(0)
  }

  // Jumps to a tick: every Part, candle, switch and star shows its state at that tick, with no motion.
  seek(tick: number) {
    if (!this.puzzle) return
    this.tick = tick
    const progress = progressAt(this.puzzle.board, this.partsOf(), this.path, tick)
    for (const { actor, kind, cell } of this.parts) {
      const turns = progress.seesawTurns[cellKey(cell)] ?? 0
      if (kind.startsWith('seesaw-') && turns % 2 === 1) actor.hold('flip-left')
      else actor.loop('idle')
    }
    for (const { actor, cell } of this.candles) {
      if (progress.litCandles.some((lit) => cellKey(lit) === cellKey(cell))) actor.loop('burn')
      else actor.rest()
    }
    for (const { actor, cell } of this.switches) {
      if (progress.activeSwitches.some((active) => cellKey(active) === cellKey(cell))) actor.hold('on')
      else actor.rest()
    }
    for (const { actor, cell } of this.stars) {
      if (progress.takenStars.some((taken) => cellKey(taken) === cellKey(cell))) actor.hold('collect')
      else actor.loop('idle')
    }
    for (const { actor } of this.targets) actor.loop('idle')
    this.ball?.loop('idle')
    this.placeBall(this.path[tick])
  }

  // Moves to the next tick the way the game will: the ball travels, the Part it reaches plays its clip, an aim element changes state.
  step(tick: number, milliseconds: number) {
    if (!this.puzzle || tick !== this.tick + 1) return this.seek(tick)
    const cell = this.path[tick] as Cell
    const before = progressAt(this.puzzle.board, this.partsOf(), this.path, this.tick)
    const after = progressAt(this.puzzle.board, this.partsOf(), this.path, tick)
    this.tick = tick
    const newly = (now: Cell[], was: Cell[], target: Cell) => now.some((c) => cellKey(c) === cellKey(target)) !== was.some((c) => cellKey(c) === cellKey(target))
    for (const { actor, kind, cell: at } of this.parts) {
      const here = cellKey(at) === cellKey(cell)
      if (kind.startsWith('trampoline-') && here) actor.once('bounce', 'idle')
      if (kind.startsWith('spring-') && here) actor.once('launch', 'idle')
      if (kind.startsWith('ramp-') && here) actor.once('hit')
      if (kind.startsWith('conveyor-')) actor.loop(here ? 'run' : 'idle')
      if (kind.startsWith('fan-')) actor.loop(fanBlowsOn({ kind, at }, cell) ? 'blow' : 'idle')
      if (kind.startsWith('seesaw-') && here) actor.once((after.seesawTurns[cellKey(at)] ?? 0) % 2 === 1 ? 'flip-left' : 'flip-right', 'idle')
    }
    for (const { actor, cell: at } of this.candles) if (newly(after.litCandles, before.litCandles, at)) actor.once('light', 'burn')
    for (const { actor, cell: at } of this.switches) {
      if (newly(after.activeSwitches, before.activeSwitches, at)) actor.once(after.activeSwitches.some((c) => cellKey(c) === cellKey(at)) ? 'on' : 'off')
    }
    for (const { actor, cell: at } of this.stars) if (newly(after.takenStars, before.takenStars, at)) actor.once('collect')
    if (this.solved && tick === this.path.length - 1) for (const { actor } of this.targets) actor.once('reach', 'idle')
    this.travelTo(cell, milliseconds)
  }

  frame() {
    const { width, height } = this.boardSize
    this.controls.target.set(width / 2, height / 2, 0)
    const lift = CAMERA_DISTANCE * Math.tan((CAMERA_PITCH_DEGREES * Math.PI) / 180)
    this.camera.position.set(width / 2, height / 2 + lift, CAMERA_DISTANCE)
    this.camera.zoom = 1
    this.camera.up.set(0, 1, 0)
    this.controls.update()
    this.resize()
  }

  private partsOf(): PlacedPart[] {
    return this.parts.map(({ kind, cell }) => ({ kind, at: cell }))
  }

  private position(cell: Cell): THREE.Vector3 {
    return new THREE.Vector3(cell.x + 0.5, this.boardSize.height - 1 - cell.y, 0)
  }

  private place(model: string, cell: Cell, mirrored = false): Actor {
    const holder = new THREE.Group()
    holder.position.copy(this.position(cell))
    holder.scale.x = mirrored ? -1 : 1
    const root = this.library.get(model).clone(true)
    root.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    holder.add(root)
    this.content.add(holder)
    const actor = new Actor(root, this.library.clipsOf(model))
    this.actors.push(actor)
    return actor
  }

  private build(parts: PlacedPart[]) {
    this.content.clear()
    this.actors = []
    const board = this.puzzle!.board
    this.drawBackdrop()
    this.parts = parts.map(({ kind, at }) => ({ kind, cell: at, actor: this.place(partLook(kind).model, at, partLook(kind).mirrored) }))
    this.candles = []
    this.switches = []
    this.stars = []
    this.targets = []
    for (const aim of board.aims) {
      const make = (cell: Cell): Placed => ({ cell, kind: aim.kind, actor: this.place(aimModels[aim.kind], cell) })
      if (aim.kind === 'deliver') this.targets.push(make(aim.target))
      if (aim.kind === 'light') this.candles.push(...aim.candles.map(make))
      if (aim.kind === 'flip') this.switches.push(...aim.switches.map(make))
      if (aim.kind === 'collect') {
        this.stars.push(...aim.stars.map(make))
        this.targets.push({ cell: aim.exit, kind: 'exit', actor: this.place('puzzle/target', aim.exit) })
      }
    }
    this.ballRoll = new THREE.Group()
    const holder = new THREE.Group()
    const root = this.library.get('puzzle/ball').clone(true)
    root.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (mesh.isMesh) mesh.castShadow = true
    })
    this.ballRoll.add(root)
    holder.add(this.ballRoll)
    this.content.add(holder)
    this.ball = new Actor(root, this.library.clipsOf('puzzle/ball'))
    this.actors.push(this.ball)
    this.ballHolder = holder
    const { width, height } = this.boardSize
    const reach = Math.hypot(width, height) / 2 + 2
    Object.assign(this.sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 120 })
    this.sun.shadow.camera.updateProjectionMatrix()
    this.sun.position.copy(SUN_OFFSET).add(new THREE.Vector3(width / 2, height / 2, 0))
    this.sun.target.position.set(width / 2, height / 2, 0)
  }

  private ballHolder: THREE.Object3D | undefined

  private drawBackdrop() {
    const { width, height } = this.boardSize
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width + 2, height + 2), new THREE.MeshStandardMaterial({ color: BACKDROP }))
    plane.position.set(width / 2, height / 2, BACKDROP_DEPTH)
    plane.receiveShadow = true
    const points: THREE.Vector3[] = []
    for (let x = 0; x <= width; x += 1) points.push(new THREE.Vector3(x, 0, BACKDROP_DEPTH + 0.01), new THREE.Vector3(x, height, BACKDROP_DEPTH + 0.01))
    for (let y = 0; y <= height; y += 1) points.push(new THREE.Vector3(0, y, BACKDROP_DEPTH + 0.01), new THREE.Vector3(width, y, BACKDROP_DEPTH + 0.01))
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: GRID_LINES }))
    this.content.add(plane, grid)
  }

  // The ball model is grounded on its own base: the cell centre is half a cell above the cell floor, minus the radius.
  private ballPosition(cell: Cell): THREE.Vector3 {
    return this.position(cell).add(new THREE.Vector3(0, 0.5 - BALL_RADIUS, 0))
  }

  private placeBall(cell: Cell | undefined) {
    if (!cell || !this.ballHolder) return
    const target = this.ballPosition(cell)
    this.ballHolder.position.copy(target)
    this.move = { from: target, to: target, elapsed: 1, duration: 1 }
  }

  private travelTo(cell: Cell, milliseconds: number) {
    if (!this.ballHolder) return
    this.move = { from: this.ballHolder.position.clone(), to: this.ballPosition(cell), elapsed: 0, duration: Math.max(1, milliseconds) }
  }

  private resize() {
    const width = this.canvas.clientWidth || 1
    const height = this.canvas.clientHeight || 1
    const board = this.boardSize
    const aspect = width / height
    const half = Math.max(board.height / 2 + 1, (board.width / 2 + 1) / aspect)
    this.camera.left = -half * aspect
    this.camera.right = half * aspect
    this.camera.top = half
    this.camera.bottom = -half
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private draw() {
    const { clientWidth, clientHeight } = this.canvas
    const ratio = this.renderer.getPixelRatio()
    if (this.canvas.width !== Math.round(clientWidth * ratio) || this.canvas.height !== Math.round(clientHeight * ratio)) this.resize()
    const seconds = this.clock.getDelta()
    for (const actor of this.actors) actor.update(seconds)
    this.advanceBall(seconds * 1000)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private advanceBall(milliseconds: number) {
    if (!this.ballHolder || this.move.elapsed >= this.move.duration) return
    const before = this.ballHolder.position.x
    this.move.elapsed = Math.min(this.move.duration, this.move.elapsed + milliseconds)
    this.ballHolder.position.lerpVectors(this.move.from, this.move.to, this.move.elapsed / this.move.duration)
    this.ballRoll.rotation.z -= (this.ballHolder.position.x - before) / BALL_RADIUS
  }
}

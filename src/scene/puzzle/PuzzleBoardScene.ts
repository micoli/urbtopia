import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ballAt, cellKey, progressAt } from '../../core/dailyPuzzle/progress'
import { PHYSICS } from '../../core/dailyPuzzle/simulate'
import type { BallEvent, Cell, PlacedPart, Puzzle, Trajectory } from '../../core/dailyPuzzle/types'
import { ModelLibrary } from '../modelLibrary'
import { renderPixelRatio, shouldRenderFrame, wantsAntialias } from '../renderBudget'
import { PUZZLE_LIGHTINGS, type PuzzleLightingName } from '../puzzleLighting'
import { Actor } from './puzzleActor'
import { aimModels, MODEL_KEYS, partLook } from './puzzleModels'

const BALL_RADIUS = PHYSICS.ballRadius
// Mostly in front of the board, so that the shadows fall short on the backdrop.
const SUN_OFFSET = new THREE.Vector3(-8, 16, 30)
const CAMERA_DISTANCE = 30
// The fixed point of view of the game, as the lab shows it: the camera turned and raised in degrees, and the view moved from the centre of the board in cells.
const CAMERA_YAW_DEGREES = 10.4
const CAMERA_PITCH_DEGREES = 16.1
const CAMERA_OFFSET = { x: 0.01, y: 0.4 }
const SHADOW_MAP_SIZE = 512
const BACKDROP = 0xe6d3a8
const GRID_LINES = 0xc4ab78
const BACKDROP_DEPTH = -0.6
// Room kept around the board in the view, in cells: a cell above and a cell under it, and the thickness of the walls on each side, and how far the backdrop reaches past it so that no edge of the plane shows.
const VIEW_SIDE = 0.45
const VIEW_VERTICAL = 1
const BACKDROP_REACH = 40
// How many wall segments stand above the top of the board.
const WALL_ABOVE = 1
// The confetti of a solved puzzle: how many pieces, how long they fly, and the pull on them, in cells and seconds.
const CONFETTI_PIECES = 150
const CONFETTI_SECONDS = 2.6
const CONFETTI_GRAVITY = 9
const CONFETTI_COLORS = [0xffc61a, 0xff4f4f, 0x7be01f, 0x2456d6, 0xff2d95, 0xfff1c9]
const TAP_DISTANCE = 6
const MARK_DEPTH = 0.45
const INVALID_COLOR = 0xff3b3b
const SELECTED_COLOR = 0xffe14d
const FREE_COLOR = 0xffffff

// What the view shows of the board, in cells: its height with a cell above and a cell under it, as the camera sees it, tilted; and the shape of the picture it makes, to give to the canvas.
const viewHeight = (height: number): number => (height + 2 * VIEW_VERTICAL) * Math.cos((CAMERA_PITCH_DEGREES * Math.PI) / 180)
export const puzzleViewRatio = (width: number, height: number): number => (width + 2 * VIEW_SIDE) / viewHeight(height)

export interface PuzzleSceneOptions {
  // Where the models are served from: the game's own folder by default, the lab serves them at /glb/.
  modelsUrl?: string
  // The lab lets the camera turn; the game keeps it still.
  orbit?: boolean
}

export interface PuzzleGhost {
  kind: string
  cell: Cell
  valid: boolean
}

interface Placed {
  actor: Actor
  cell: Cell
  kind: string
}

// The board in front view: x to the right, y up, the models as the glTF files draw them (the front of a model faces the camera).
export class PuzzleBoardScene {
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100)
  private readonly controls: OrbitControls | undefined
  private readonly scene = new THREE.Scene()
  private readonly content = new THREE.Group()
  private readonly sun = new THREE.DirectionalLight()
  private readonly sky = new THREE.HemisphereLight()
  private readonly clock = new THREE.Clock()
  private readonly library: ModelLibrary
  private readonly marks = new THREE.Group()
  private readonly ghostGroup = new THREE.Group()
  private readonly raycaster = new THREE.Raycaster()
  private readonly boardPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private tapHandler: ((cell: Cell | undefined) => void) | undefined
  private hoverHandler: ((cell: Cell | undefined) => void) | undefined
  private pressHandler: ((cell: Cell | undefined, x: number, y: number) => void) | undefined
  private pointerDown: { x: number; y: number } | undefined
  private disposed = false
  private actors: Actor[] = []
  private parts: Placed[] = []
  private candles: Placed[] = []
  private switches: Placed[] = []
  private stars: Placed[] = []
  private targets: Placed[] = []
  private walls = new Map<string, Actor>()
  private confetti: { mesh: THREE.InstancedMesh; origin: THREE.Vector3; velocity: THREE.Vector3[]; spin: number[]; age: number } | undefined
  private ball: Actor | undefined
  private ballRoll = new THREE.Group()
  private puzzle: Puzzle | undefined
  private trajectory: Trajectory | undefined
  private trail: THREE.Line | undefined
  private trailVisible = false
  private solved = false
  private time = 0
  private playing = false
  private nextEvent = 0
  private endHandler: (() => void) | undefined
  private timeHandler: ((time: number) => void) | undefined
  private boardSize = { width: 1, height: 1 }
  private loaded: Promise<void> | undefined
  private modelsReady = false
  // The scene is drawn at 30 frames a second while something moves and only when something changed otherwise.
  private dirty = true
  private lastDrawn = 0

  constructor(private readonly canvas: HTMLCanvasElement, options: PuzzleSceneOptions = {}) {
    this.library = options.modelsUrl === undefined ? new ModelLibrary() : new ModelLibrary(options.modelsUrl)
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: wantsAntialias() })
    this.renderer.setPixelRatio(renderPixelRatio())
    this.renderer.shadowMap.enabled = true
    const generator = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = generator.fromScene(new RoomEnvironment(), 0.04).texture
    generator.dispose()
    this.scene.background = new THREE.Color()
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.03
    this.scene.add(this.sun, this.sun.target, this.sky, this.content, this.marks, this.ghostGroup)
    this.setLighting('vivid')
    if (options.orbit ?? false) {
      this.controls = new OrbitControls(this.camera, canvas)
      this.controls.enableDamping = false
      canvas.addEventListener('dblclick', this.handleDoubleClick)
    }
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerleave', this.handlePointerLeave)
    this.renderer.setAnimationLoop((now) => this.draw(now))
  }

  setLighting(name: PuzzleLightingName) {
    this.dirty = true
    const lighting = PUZZLE_LIGHTINGS[name]
    this.renderer.toneMapping = lighting.toneMapping
    this.renderer.toneMappingExposure = lighting.exposure
    this.sun.color.setHex(lighting.sunColor)
    this.sun.intensity = lighting.sunIntensity
    this.sky.color.setHex(lighting.skyColor)
    this.sky.groundColor.setHex(lighting.groundColor)
    this.sky.intensity = lighting.hemisphereIntensity
    this.scene.environmentIntensity = lighting.environmentIntensity
    ;(this.scene.background as THREE.Color).setHex(lighting.background)
  }

  // Paints flat swatches facing the camera in front of the board, renders, and reads back what the screen shows at the centre of each: the colour as drawn against the colour as painted.
  measure(swatches: Record<string, number>): Record<string, { painted: number; rendered: number }> {
    const gl = this.renderer.getContext()
    const names = Object.keys(swatches)
    const group = new THREE.Group()
    const { width, height } = this.boardSize
    const positions = names.map((name, index) => {
      const at = new THREE.Vector3(width / 2 + (index - (names.length - 1) / 2) * 1.2, height / 2, 3)
      const swatch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: swatches[name] }))
      swatch.position.copy(at)
      group.add(swatch)
      return at
    })
    this.scene.add(group)
    this.renderer.render(this.scene, this.camera)
    const result: Record<string, { painted: number; rendered: number }> = {}
    const pixel = new Uint8Array(4)
    names.forEach((name, index) => {
      const ndc = positions[index]!.clone().project(this.camera)
      gl.readPixels(Math.round((ndc.x * 0.5 + 0.5) * this.canvas.width), Math.round((ndc.y * 0.5 + 0.5) * this.canvas.height), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
      result[name] = { painted: swatches[name]!, rendered: (pixel[0]! << 16) | (pixel[1]! << 8) | pixel[2]! }
    })
    this.scene.remove(group)
    return result
  }

  load(): Promise<void> {
    this.loaded ??= this.library.ensure(MODEL_KEYS).then(() => {
      this.modelsReady = true
    })
    return this.loaded
  }

  async show(puzzle: Puzzle, parts: PlacedPart[], trajectory: Trajectory, solved: boolean) {
    await this.load()
    this.puzzle = puzzle
    this.trajectory = trajectory
    this.solved = solved
    this.boardSize = { width: puzzle.board.width, height: puzzle.board.height }
    this.clearConfetti()
    this.build(parts)
    this.drawTrail()
    this.frame()
    this.seek(0)
  }

  // Draws the whole path of the ball over the board, to judge a trajectory at a glance.
  setTrail(visible: boolean) {
    this.dirty = true
    this.trailVisible = visible
    if (this.trail) this.trail.visible = visible
  }

  private drawTrail() {
    const trajectory = this.trajectory
    if (!trajectory) return
    const points = trajectory.xs.map((x, index) => new THREE.Vector3(x, this.boardSize.height - (trajectory.ys[index] as number), MARK_DEPTH))
    this.trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xe8332a }))
    this.trail.visible = this.trailVisible
    this.content.add(this.trail)
  }

  // How long the run lasts, in seconds.
  get duration(): number {
    return this.trajectory ? (this.trajectory.xs.length - 1) * this.trajectory.step : 0
  }

  // Calls the handler as the run goes on, and when it is jumped to a moment.
  onTime(handler: (time: number) => void) {
    this.timeHandler = handler
  }

  // Jumps to a moment of the run: the ball is where it was, and every Part, candle, switch and star shows its state then, with no motion.
  seek(time: number) {
    this.dirty = true
    if (!this.puzzle || !this.trajectory) return
    this.clearConfetti()
    this.playing = false
    this.time = Math.min(Math.max(0, time), this.duration)
    this.nextEvent = this.trajectory.events.findIndex((event) => event.t > this.time)
    if (this.nextEvent < 0) this.nextEvent = this.trajectory.events.length
    const progress = progressAt(this.puzzle.board, this.partsOf(), this.trajectory, this.time)
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
    this.placeBall(ballAt(this.trajectory, this.time), false)
    this.timeHandler?.(this.time)
  }

  // Plays the run in real time from where it stands: the ball travels along its trajectory and the Parts it meets play their clips as it meets them.
  play(onEnd?: () => void) {
    if (!this.trajectory) return
    if (this.time >= this.duration) this.seek(0)
    this.endHandler = onEnd
    this.playing = true
  }

  pause() {
    this.playing = false
  }

  get isPlaying(): boolean {
    return this.playing
  }

  frame() {
    const { width, height } = this.boardSize
    const radians = (degrees: number) => (degrees * Math.PI) / 180
    const target = new THREE.Vector3(width / 2 + CAMERA_OFFSET.x, height / 2 + CAMERA_OFFSET.y, 0)
    const pitch = radians(CAMERA_PITCH_DEGREES)
    const yaw = radians(CAMERA_YAW_DEGREES)
    const flat = CAMERA_DISTANCE * Math.cos(pitch)
    this.camera.position.set(target.x + flat * Math.sin(yaw), target.y + CAMERA_DISTANCE * Math.sin(pitch), flat * Math.cos(yaw))
    this.camera.zoom = 1
    this.camera.up.set(0, 1, 0)
    if (this.controls) {
      this.controls.target.copy(target)
      this.controls.update()
    } else {
      this.camera.lookAt(target)
    }
    this.resize()
  }

  // The lab turns the camera with the pointer; while a Part is being dragged the camera must stay still.
  setOrbit(enabled: boolean) {
    if (this.controls) this.controls.enabled = enabled
  }

  // Where the camera looks from, in degrees: turned around the vertical, raised above the horizon, and rolled about its axis.
  cameraAngles(): { yaw: number; pitch: number; roll: number } {
    const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ')
    const degrees = (radians: number) => (radians * 180) / Math.PI
    return { yaw: degrees(euler.y), pitch: -degrees(euler.x), roll: degrees(euler.z) }
  }

  // How far the view is moved from the centre of the board, in cells: x to the right, y up.
  cameraOffset(): { x: number; y: number } {
    const target = this.controls?.target
    if (!target) return { x: 0, y: 0 }
    return { x: target.x - this.boardSize.width / 2, y: target.y - this.boardSize.height / 2 }
  }

  // The orientation of the camera, for a gizmo that draws the axes as the camera sees them.
  cameraOrientation(): THREE.Quaternion {
    return this.camera.quaternion.clone()
  }

  // Turns the camera around what it looks at, by radians; the lab drives it from its gizmo.
  turnCamera(yaw: number, pitch: number) {
    const controls = this.controls
    if (!controls) return
    const offset = this.camera.position.clone().sub(controls.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    spherical.theta -= yaw
    spherical.phi = Math.min(Math.PI - 0.01, Math.max(0.01, spherical.phi - pitch))
    this.camera.position.copy(controls.target).add(offset.setFromSpherical(spherical))
    controls.update()
    this.dirty = true
  }

  // A tap on the board gives the cell under it, or undefined when it falls outside the board.
  onTap(handler: (cell: Cell | undefined) => void) {
    this.tapHandler = handler
  }

  // A press on the board, before it is known to be a tap or the start of a drag: the cell under it and where it is on the screen.
  onPress(handler: (cell: Cell | undefined, x: number, y: number) => void) {
    this.pressHandler = handler
  }

  // The cell under a point of the screen, or undefined when the point is off the board.
  cellAtPoint(clientX: number, clientY: number): Cell | undefined {
    return this.cellAt(clientX, clientY)
  }

  // The cell under the mouse; a finger has no hover, so a touch screen never calls this.
  onHover(handler: (cell: Cell | undefined) => void) {
    this.hoverHandler = handler
  }

  // The Part held, drawn half transparent on the cell it would take: red when the cell is not free.
  setGhost(ghost: PuzzleGhost | null) {
    this.dirty = true
    this.ghostGroup.clear()
    if (!ghost || !this.modelsReady) return
    const look = partLook(ghost.kind)
    const holder = new THREE.Group()
    holder.position.copy(this.position(ghost.cell))
    holder.scale.x = look.mirrored ? -1 : 1
    const root = this.library.get(look.model).clone(true)
    root.traverse((node) => {
      const mesh = node as THREE.Mesh
      if (!mesh.isMesh) return
      const material = (mesh.material as THREE.MeshStandardMaterial).clone()
      material.transparent = true
      material.opacity = 0.6
      if (!ghost.valid) material.color.setHex(INVALID_COLOR)
      mesh.material = material
    })
    holder.add(root)
    this.ghostGroup.add(holder)
  }

  // Marks the cells a Part may go on with a dot, and outlines the cell of the Part selected.
  setMarks(free: readonly Cell[], selected: Cell | undefined) {
    this.dirty = true
    this.marks.clear()
    const dot = new THREE.CircleGeometry(0.09, 16)
    const dotMaterial = new THREE.MeshBasicMaterial({ color: FREE_COLOR, transparent: true, opacity: 0.55 })
    for (const cell of free) {
      const mark = new THREE.Mesh(dot, dotMaterial)
      mark.position.copy(this.position(cell)).add(new THREE.Vector3(0, 0.5, MARK_DEPTH))
      this.marks.add(mark)
    }
    if (!selected) return
    const corner = this.position(selected)
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(corner.x - 0.46, corner.y + 0.02, MARK_DEPTH),
        new THREE.Vector3(corner.x + 0.46, corner.y + 0.02, MARK_DEPTH),
        new THREE.Vector3(corner.x + 0.46, corner.y + 0.98, MARK_DEPTH),
        new THREE.Vector3(corner.x - 0.46, corner.y + 0.98, MARK_DEPTH),
      ]),
      new THREE.LineBasicMaterial({ color: SELECTED_COLOR }),
    )
    this.marks.add(outline)
  }

  dispose() {
    this.disposed = true
    this.clearConfetti()
    this.renderer.setAnimationLoop(null)
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown)
    this.canvas.removeEventListener('pointerup', this.handlePointerUp)
    this.canvas.removeEventListener('pointermove', this.handlePointerMove)
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave)
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick)
    this.controls?.dispose()
    this.renderer.dispose()
  }

  private readonly handleDoubleClick = () => this.frame()

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.pointerDown = { x: event.clientX, y: event.clientY }
    this.pressHandler?.(this.cellAt(event.clientX, event.clientY), event.clientX, event.clientY)
  }

  private readonly handlePointerUp = (event: PointerEvent) => {
    const down = this.pointerDown
    this.pointerDown = undefined
    if (!down || !this.tapHandler || this.disposed) return
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > TAP_DISTANCE) return
    this.tapHandler(this.cellAt(event.clientX, event.clientY))
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !this.hoverHandler || this.disposed) return
    this.hoverHandler(this.cellAt(event.clientX, event.clientY))
  }

  private readonly handlePointerLeave = () => this.hoverHandler?.(undefined)

  private cellAt(clientX: number, clientY: number): Cell | undefined {
    const rectangle = this.canvas.getBoundingClientRect()
    if (clientX < rectangle.left || clientX > rectangle.right || clientY < rectangle.top || clientY > rectangle.bottom) return undefined
    const pointer = new THREE.Vector2(((clientX - rectangle.left) / rectangle.width) * 2 - 1, -(((clientY - rectangle.top) / rectangle.height) * 2 - 1))
    this.raycaster.setFromCamera(pointer, this.camera)
    const point = this.raycaster.ray.intersectPlane(this.boardPlane, new THREE.Vector3())
    if (!point) return undefined
    const { width, height } = this.boardSize
    const x = Math.floor(point.x)
    const row = Math.floor(point.y)
    if (x < 0 || x >= width || row < 0 || row >= height) return undefined
    return { x, y: height - 1 - row }
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
    this.dirty = true
    this.content.clear()
    this.actors = []
    const board = this.puzzle!.board
    this.drawBackdrop()
    this.buildWalls()
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

  // The side walls: a column of segments on each side of the board, the left-hand model mirrored for the right-hand column. A segment is named by the cell beyond the board and its row, like the `wall` events.
  private buildWalls() {
    this.dirty = true
    this.walls.clear()
    const { width, height } = this.boardSize
    for (let row = -WALL_ABOVE; row < height; row += 1) {
      this.walls.set(`-1,${row}`, this.place('puzzle/wall', { x: -0.5, y: row }))
      this.walls.set(`${width},${row}`, this.place('puzzle/wall', { x: width - 0.5, y: row }, true))
    }
  }

  private drawBackdrop() {
    const { width, height } = this.boardSize
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width + BACKDROP_REACH, height + BACKDROP_REACH), new THREE.MeshStandardMaterial({ color: BACKDROP }))
    plane.position.set(width / 2, height / 2, BACKDROP_DEPTH)
    plane.receiveShadow = true
    const points: THREE.Vector3[] = []
    for (let x = 0; x <= width; x += 1) points.push(new THREE.Vector3(x, 0, BACKDROP_DEPTH + 0.01), new THREE.Vector3(x, height, BACKDROP_DEPTH + 0.01))
    for (let y = 0; y <= height; y += 1) points.push(new THREE.Vector3(0, y, BACKDROP_DEPTH + 0.01), new THREE.Vector3(width, y, BACKDROP_DEPTH + 0.01))
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: GRID_LINES }))
    this.content.add(plane, grid)
  }

  // The ball model stands on its own base: its origin is half a ball under its centre. The board counts y downward, the scene upward.
  private placeBall(position: { x: number; y: number }, roll = true) {
    if (!this.ballHolder) return
    const before = this.ballHolder.position.x
    this.ballHolder.position.set(position.x, this.boardSize.height - position.y - BALL_RADIUS, 0)
    if (roll) this.ballRoll.rotation.z -= (position.x - before) / BALL_RADIUS
  }

  private resize() {
    this.dirty = true
    const width = this.canvas.clientWidth || 1
    const height = this.canvas.clientHeight || 1
    const board = this.boardSize
    const aspect = width / height
    const half = Math.max(viewHeight(board.height) / 2, (board.width / 2 + VIEW_SIDE) / aspect)
    this.camera.left = -half * aspect
    this.camera.right = half * aspect
    this.camera.top = half
    this.camera.bottom = -half
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private draw(now: number) {
    if (!shouldRenderFrame(now - this.lastDrawn)) return
    this.lastDrawn = now
    const { clientWidth, clientHeight } = this.canvas
    const ratio = this.renderer.getPixelRatio()
    if (this.canvas.width !== Math.round(clientWidth * ratio) || this.canvas.height !== Math.round(clientHeight * ratio)) this.resize()
    const seconds = Math.min(0.1, this.clock.getDelta())
    const moving = this.playing || this.confetti !== undefined || this.actors.some((actor) => actor.moving)
    for (const actor of this.actors) actor.update(seconds)
    this.advance(seconds)
    this.flyConfetti(seconds)
    if (this.controls?.update()) this.dirty = true
    if (!moving && !this.dirty) return
    this.dirty = false
    this.renderer.render(this.scene, this.camera)
  }

  private advance(seconds: number) {
    const trajectory = this.trajectory
    if (!this.playing || !trajectory) return
    const next = Math.min(this.duration, this.time + seconds)
    while (this.nextEvent < trajectory.events.length && (trajectory.events[this.nextEvent] as BallEvent).t <= next) {
      this.trigger(this.nextEvent)
      this.nextEvent += 1
    }
    this.time = next
    this.placeBall(ballAt(trajectory, next))
    this.timeHandler?.(next)
    if (next < this.duration) return
    this.playing = false
    if (this.solved) {
      for (const { actor } of this.targets) actor.once('reach', 'idle')
      const landing = trajectory.landing
      if (landing) this.celebrate(landing)
    }
    this.endHandler?.()
  }

  // A burst of confetti out of the cup of the target. It does not play when the system asks for less motion.
  private celebrate(cell: Cell) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.clearConfetti()
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.17, 0.11), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), CONFETTI_PIECES)
    const velocity: THREE.Vector3[] = []
    const spin: number[] = []
    const color = new THREE.Color()
    for (let index = 0; index < CONFETTI_PIECES; index += 1) {
      velocity.push(new THREE.Vector3((Math.random() - 0.5) * 6, 4.5 + Math.random() * 5, (Math.random() - 0.5) * 2))
      spin.push((Math.random() - 0.5) * 18)
      mesh.setColorAt(index, color.setHex(CONFETTI_COLORS[index % CONFETTI_COLORS.length] as number))
    }
    mesh.frustumCulled = false
    this.scene.add(mesh)
    this.confetti = { mesh, origin: this.position(cell).add(new THREE.Vector3(0, 0.4, 0.6)), velocity, spin, age: 0 }
  }

  private clearConfetti() {
    if (!this.confetti) return
    this.scene.remove(this.confetti.mesh)
    this.confetti.mesh.dispose()
    this.confetti = undefined
  }

  private flyConfetti(seconds: number) {
    const confetti = this.confetti
    if (!confetti) return
    confetti.age += seconds
    if (confetti.age >= CONFETTI_SECONDS) return this.clearConfetti()
    const dummy = new THREE.Object3D()
    const age = confetti.age
    const fade = Math.min(1, (CONFETTI_SECONDS - age) / 0.6)
    for (let index = 0; index < CONFETTI_PIECES; index += 1) {
      const velocity = confetti.velocity[index] as THREE.Vector3
      dummy.position.set(confetti.origin.x + velocity.x * age, confetti.origin.y + velocity.y * age - 0.5 * CONFETTI_GRAVITY * age * age, confetti.origin.z + velocity.z * age)
      dummy.rotation.set(age * (confetti.spin[index] as number), age * (confetti.spin[index] as number) * 0.7, 0)
      dummy.scale.setScalar(fade)
      dummy.updateMatrix()
      confetti.mesh.setMatrixAt(index, dummy.matrix)
    }
    confetti.mesh.instanceMatrix.needsUpdate = true
  }

  // What an event of the run does to the Part or the element it happens at.
  private trigger(index: number) {
    const events = (this.trajectory as Trajectory).events
    const { kind, cell } = events[index] as BallEvent
    const same = (event: BallEvent, what: string) => event.kind === what && cellKey(event.cell) === cellKey(cell)
    if (kind === 'wall') this.walls.get(`${cell.x},${Math.min(this.boardSize.height - 1, Math.max(-WALL_ABOVE, cell.y))}`)?.once('bump')
    const part = this.parts.find((candidate) => cellKey(candidate.cell) === cellKey(cell))
    if (part) {
      const family = part.kind.slice(0, part.kind.lastIndexOf('-'))
      if (kind === 'hit' && family === 'trampoline') part.actor.once('bounce', 'idle')
      if (kind === 'hit' && family === 'spring') part.actor.once('launch', 'idle')
      if (kind === 'hit' && family === 'ramp') part.actor.once('hit', 'idle')
      if (kind === 'belt') part.actor.loop('run')
      if (kind === 'belt-end' || kind === 'jet-end') part.actor.loop('idle')
      if (kind === 'jet') part.actor.loop('blow')
      if (kind === 'flip') part.actor.once(events.slice(0, index + 1).filter((event) => same(event, 'flip')).length % 2 === 1 ? 'flip-left' : 'flip-right', 'idle')
    }
    if (kind !== 'enter') return
    const entries = events.slice(0, index + 1).filter((event) => same(event, 'enter')).length
    if (entries === 1) {
      this.candles.find((candidate) => cellKey(candidate.cell) === cellKey(cell))?.actor.once('light', 'burn')
      this.stars.find((candidate) => cellKey(candidate.cell) === cellKey(cell))?.actor.once('collect')
    }
    this.switches.find((candidate) => cellKey(candidate.cell) === cellKey(cell))?.actor.once(entries % 2 === 1 ? 'on' : 'off')
  }
}

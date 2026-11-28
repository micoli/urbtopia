import { generatePuzzle } from '../../../src/core/dailyPuzzle/generate'
import { PHYSICS, runBall, simulate, isMet } from '../../../src/core/dailyPuzzle/simulate'
import type { Aim, Cell, Difficulty, PlacedPart, Puzzle } from '../../../src/core/dailyPuzzle/types'
import { PUZZLE_LIGHTINGS, type PuzzleLightingName } from '../../../src/scene/puzzleLighting'
import { PuzzleBoardScene } from '../../../src/scene/puzzle/PuzzleBoardScene'
import { remainingInventory } from '../../../src/core/dailyPuzzle/contraption'
import { startGizmo } from './gizmo'
import { dragJustEnded, freeCellsFor, puzzleStore } from '../../../src/store/puzzleStore'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const STEP_SECONDS = 0.25

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const seedInput = element<HTMLInputElement>('seed')
const difficultySelect = element<HTMLSelectElement>('difficulty')
const canvas = element<HTMLCanvasElement>('board')
const timeInput = element<HTMLInputElement>('tick')
const timeLabel = element<HTMLSpanElement>('tick-label')
const verdict = element<HTMLParagraphElement>('verdict')
const playButton = element<HTMLButtonElement>('play')
const board = new PuzzleBoardScene(canvas, { modelsUrl: '/glb/', orbit: true })

startGizmo(board, element<HTMLCanvasElement>('gizmo-canvas'), element<HTMLOutputElement>('angles'))

let puzzle: Puzzle

const currentDifficulty = () => difficultySelect.value as Difficulty
// The Parts on the board are the editor of the game, and the lab edits them the way the player does. A Part being dragged is lifted off the board.
const currentParts = (): PlacedPart[] => {
  const { editor, drag } = puzzleStore.getState()
  const lifted = drag?.active && 'cell' in drag.source ? drag.source.cell : undefined
  return lifted ? editor.parts.filter((part) => part.at.x !== lifted.x || part.at.y !== lifted.y) : editor.parts
}

function describeAim(aim: Aim): string {
  const at = (cell: Cell) => `(${cell.x},${cell.y})`
  if (aim.kind === 'deliver') return `Deliver the ball to ${at(aim.target)}`
  if (aim.kind === 'light') return `Light candles ${aim.candles.map(at).join(' ')}`
  if (aim.kind === 'flip') return `Flip switches ${aim.switches.map(at).join(' ')} (odd number of crossings)`
  return `Collect stars ${aim.stars.map(at).join(' ')}, then reach the exit ${at(aim.exit)}`
}

board.onTime((time) => {
  timeLabel.textContent = `${time.toFixed(2)} / ${board.duration.toFixed(2)} s`
  timeInput.value = String(time)
  if (!board.isPlaying) playButton.textContent = 'Play'
})

// Runs the Parts on the board again on the same puzzle: what the sliders of the physics change. A new puzzle is only drawn when the seed or the difficulty changes.
async function rerun() {
  const current = puzzleStore.getState().puzzle
  if (!current) return
  puzzle = current
  playButton.textContent = 'Play'
  const parts = currentParts()
  const trajectory = runBall(puzzle.board, parts)
  const solved = trajectory.landed && puzzle.board.aims.every((aim) => isMet(aim, trajectory))
  const seconds = (trajectory.xs.length - 1) * trajectory.step
  timeInput.max = String(seconds)
  timeInput.step = '0.01'
  verdict.textContent = solved ? `Solved in ${seconds.toFixed(2)} s` : `Not solved (${seconds.toFixed(2)} s)`
  verdict.className = solved ? 'ok' : 'ko'
  await board.show(puzzle, parts, trajectory, solved)
}

async function showPuzzle() {
  puzzleStore.getState().open(seedInput.value, currentDifficulty())
  puzzle = puzzleStore.getState().puzzle as Puzzle
  puzzleStore.getState().solveForDev()
  element('aims').replaceChildren(...puzzle.board.aims.map((aim) => Object.assign(document.createElement('li'), { textContent: describeAim(aim) })))
  await rerun()
}

element('step').addEventListener('click', () => board.seek(Number(timeInput.value) + STEP_SECONDS))
element('reset').addEventListener('click', () => { board.seek(0); playButton.textContent = 'Play' })
playButton.addEventListener('click', () => {
  if (board.isPlaying) {
    board.pause()
    playButton.textContent = 'Play'
    return
  }
  playButton.textContent = 'Pause'
  board.play(() => { playButton.textContent = 'Play' })
})
timeInput.addEventListener('input', () => { board.seek(Number(timeInput.value)); playButton.textContent = 'Play' })
seedInput.addEventListener('change', () => void showPuzzle())
difficultySelect.addEventListener('change', () => void showPuzzle())
element<HTMLInputElement>('show-trail').addEventListener('change', (event) => board.setTrail((event.target as HTMLInputElement).checked))
element('next-seed').addEventListener('click', () => {
  seedInput.value = `lab-${Math.floor(Math.random() * 1_000_000)}`
  void showPuzzle()
})

// Editing. Point and click: tap a Part of the tray, then a free cell; tap a Part of the board to lift it, then another cell to move it, or "Take back". Drag and drop: drag a Part of the tray onto a cell,
// a Part of the board onto another cell, or a Part of the board onto the tray to take it back.
const DRAG_DISTANCE = 6
const chip = Object.assign(document.createElement('div'), { id: 'drag-chip' })
document.body.append(chip)
let hovered: Cell | undefined

board.onTap((cell) => puzzleStore.getState().tapCell(cell))
board.onHover((cell) => {
  hovered = cell
  showHeld()
})
board.onPress((cell, x, y) => {
  const store = puzzleStore.getState()
  if (!cell || !store.editor.parts.some((part) => part.at.x === cell.x && part.at.y === cell.y)) return
  board.setOrbit(false)
  store.armDrag({ cell }, { x, y })
})

function showHeld() {
  const { editor, held, drag, puzzle: current } = puzzleStore.getState()
  if (!current) return
  const dragging = drag?.active ? drag : undefined
  const carried = held ?? (dragging ? dragging.source : null)
  const free = freeCellsFor(current, editor, carried)
  board.setMarks(free, !dragging && held && 'cell' in held ? held.cell : undefined)
  const kindAt = (cell: Cell) => editor.parts.find((part) => part.at.x === cell.x && part.at.y === cell.y)?.kind
  const kind = dragging ? ('kind' in dragging.source ? dragging.source.kind : kindAt(dragging.source.cell)) : held && 'kind' in held ? held.kind : undefined
  const over = dragging ? dragging.over : hovered
  board.setGhost(kind && over ? { kind, cell: over, valid: free.some((cell) => cell.x === over.x && cell.y === over.y) } : null)
}

// The buttons are rebuilt only when what they show changes: a press arms a drag in the store, and replacing the button under the pointer would lose the click that follows.
let trayKey = ''
function renderTray() {
  const { puzzle: current, editor, held } = puzzleStore.getState()
  if (!current) return
  const counts = new Map<string, number>()
  for (const kind of remainingInventory(current, editor)) counts.set(kind, (counts.get(kind) ?? 0) + 1)
  const key = `${[...counts].join(';')}|${held && 'kind' in held ? held.kind : ''}`
  if (key === trayKey) return
  trayKey = key
  const buttons = [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([kind, count]) => {
    const button = Object.assign(document.createElement('button'), { type: 'button', textContent: `${kind} ×${count}`, className: held && 'kind' in held && held.kind === kind ? 'held' : '' })
    button.addEventListener('pointerdown', (event) => puzzleStore.getState().armDrag({ kind }, { x: event.clientX, y: event.clientY }))
    button.addEventListener('click', () => { if (!dragJustEnded()) puzzleStore.getState().pickKind(kind) })
    return button
  })
  element('tray').replaceChildren(...buttons)
}

window.addEventListener('pointermove', (event) => {
  const store = puzzleStore.getState()
  const { drag } = store
  if (!drag) return
  if (!drag.active && Math.hypot(event.clientX - (drag.start?.x ?? event.clientX), event.clientY - (drag.start?.y ?? event.clientY)) > DRAG_DISTANCE) store.activateDrag()
  if (!puzzleStore.getState().drag?.active) return
  const current = puzzleStore.getState().drag
  const source = current?.source
  chip.textContent = source ? ('kind' in source ? source.kind : puzzleStore.getState().editor.parts.find((part) => part.at.x === source.cell.x && part.at.y === source.cell.y)?.kind ?? '') : ''
  chip.style.display = 'block'
  chip.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
  const cell = board.cellAtPoint(event.clientX, event.clientY)
  if (cell?.x !== current?.over?.x || cell?.y !== current?.over?.y) store.dragOver(cell)
})
window.addEventListener('pointerup', (event) => {
  const store = puzzleStore.getState()
  board.setOrbit(true)
  chip.style.display = 'none'
  if (!store.drag) return
  if (!store.drag.active) return store.cancelDrag()
  if (document.elementFromPoint(event.clientX, event.clientY)?.closest('#tray')) return store.dropDrag('tray')
  const cell = board.cellAtPoint(event.clientX, event.clientY)
  store.dropDrag(cell ? { cell } : null)
})
window.addEventListener('pointercancel', () => { board.setOrbit(true); chip.style.display = 'none'; puzzleStore.getState().cancelDrag() })

let shownKey = ''
puzzleStore.subscribe((state) => {
  renderTray()
  const lifted = state.drag?.active && 'cell' in state.drag.source ? `${state.drag.source.cell.x},${state.drag.source.cell.y}` : ''
  const key = `${lifted}|${state.editor.parts.map((part) => `${part.kind}@${part.at.x},${part.at.y}`).join(';')}`
  if (key !== shownKey) {
    shownKey = key
    void rerun().then(showHeld)
  } else showHeld()
})
element('undo').addEventListener('click', () => puzzleStore.getState().undo())
element('clear').addEventListener('click', () => puzzleStore.getState().clear())
element('solve').addEventListener('click', () => puzzleStore.getState().solveForDev())
element('take-back').addEventListener('click', () => puzzleStore.getState().takeBack())

// The constants of the run, all of them, live: a change plays the same puzzle again with the new value. Nothing is saved: Copy values gives the ones that feel right, to put into `PHYSICS`.
const DEFAULTS = { ...PHYSICS }
const RANGES: Partial<Record<keyof typeof PHYSICS, [number, number, number]>> = {
  gravity: [4, 30, 0.5], airDrag: [0, 1, 0.01], ballRadius: [0.05, 0.3, 0.01], slideFriction: [0, 0.6, 0.01], wallBounce: [0, 1, 0.05], floorBounce: [0, 1, 0.05],
  floorFriction: [0, 10, 0.1], restingSpeed: [0, 2, 0.05], beltSpeed: [0.2, 4, 0.1], beltGrip: [0, 20, 0.5], rampBounce: [0, 1, 0.05], seesawBounce: [0, 1, 0.05],
  trampolineBounce: [0.5, 1, 0.01], springBounce: [0, 1, 0.05], springLaunch: [2, 14, 0.1], fanPower: [4, 60, 1], fanReach: [1, 6, 0.5], fanFalloff: [0, 1, 0.05],
  enterRadius: [0.1, 0.7, 0.01], settleSpeed: [0, 1, 0.01], settleTime: [0, 2, 0.05], afterLandingTime: [0, 10, 0.5], stuckSpeed: [0, 1, 0.01], stuckTime: [0, 5, 0.1],
  maxTime: [5, 60, 1], contactGap: [1, 10, 1],
}
const TUNED = (Object.keys(RANGES) as (keyof typeof PHYSICS)[]).map((key) => ({ key, range: RANGES[key] as [number, number, number] }))
const sliders = new Map<keyof typeof PHYSICS, { slider: HTMLInputElement; value: HTMLOutputElement }>()

function buildPhysicsSliders() {
  const rows = TUNED.map(({ key, range: [min, max, step] }) => {
    const row = document.createElement('label')
    const value = document.createElement('output')
    value.textContent = String(PHYSICS[key])
    const slider = Object.assign(document.createElement('input'), { type: 'range', min: String(min), max: String(max), step: String(step), value: String(PHYSICS[key]) })
    slider.addEventListener('input', () => {
      PHYSICS[key] = Number(slider.value)
      value.textContent = slider.value
      void rerun()
    })
    sliders.set(key, { slider, value })
    row.append(`${key} `, value, slider)
    return row
  })
  element('physics').replaceChildren(...rows)
}

element('physics-reset').addEventListener('click', () => {
  Object.assign(PHYSICS, DEFAULTS)
  for (const [key, { slider, value }] of sliders) {
    slider.value = String(PHYSICS[key])
    value.textContent = String(PHYSICS[key])
  }
  void rerun()
})
element('physics-copy').addEventListener('click', () => {
  const changed = Object.fromEntries(TUNED.filter(({ key }) => PHYSICS[key] !== DEFAULTS[key]).map(({ key }) => [key, PHYSICS[key]]))
  void navigator.clipboard.writeText(JSON.stringify(changed, null, 2))
  element('physics-copy').textContent = `Copied ${Object.keys(changed).length}`
  setTimeout(() => { element('physics-copy').textContent = 'Copy values' }, 1500)
})

const cell = (text: string, tag: 'td' | 'th' = 'td') => Object.assign(document.createElement(tag), { textContent: text })

const lightingSelect = element<HTMLSelectElement>('lighting')
lightingSelect.replaceChildren(...Object.keys(PUZZLE_LIGHTINGS).map((name) => new Option(name, name, false, name === 'vivid')))
lightingSelect.addEventListener('change', () => { board.setLighting(lightingSelect.value as PuzzleLightingName); showColours() })

const PALETTE: Record<string, number> = {
  sun: 0xffc61a, coral: 0xff4f4f, lime: 0x7be01f, cobalt: 0x2456d6, magenta: 0xff2d95, cream: 0xfff1c9, graphite: 0x2a2d3a, white: 0xffffff,
}
const hex = (value: number) => `#${value.toString(16).padStart(6, '0')}`
const channelsOf = (value: number) => [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const
const luma = (value: number) => { const [r, g, b] = channelsOf(value); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const saturation = (value: number) => { const [r, g, b] = channelsOf(value); const high = Math.max(r, g, b); return high === 0 ? 0 : (high - Math.min(r, g, b)) / high }

function showColours() {
  const table = element<HTMLTableElement>('colour-table')
  const header = document.createElement('tr')
  header.append(...['colour', 'painted', 'drawn', 'light', 'colour'].map((text) => cell(text, 'th')))
  const rows = Object.entries(board.measure(PALETTE)).map(([name, { painted, rendered }]) => {
    const line = document.createElement('tr')
    const swatch = Object.assign(cell(hex(rendered)), { style: `background:${hex(rendered)};color:${luma(rendered) > 130 ? '#000' : '#fff'}` })
    line.append(cell(name), cell(hex(painted)), swatch, cell(`${Math.round((100 * luma(rendered)) / luma(painted))}%`), cell(`${Math.round((100 * saturation(rendered)) / saturation(painted))}%`))
    return line
  })
  table.replaceChildren(header, ...rows)
}
element('measure').addEventListener('click', showColours)

interface BatchRow { difficulty: Difficulty; generated: number; failed: number; milliseconds: number; seconds: number }

function runBatchFor(difficulty: Difficulty, size: number, failures: string[]): BatchRow {
  const row: BatchRow = { difficulty, generated: 0, failed: 0, milliseconds: 0, seconds: 0 }
  const started = performance.now()
  for (let index = 0; index < size; index += 1) {
    const seed = `batch-${index}`
    try {
      const { board, witness } = generatePuzzle(seed, difficulty)
      const result = simulate(board, witness)
      if (!result.solved) throw new Error('the witness does not solve the puzzle')
      if (simulate(board, []).solved) throw new Error('solved with no Part')
      row.generated += 1
      row.seconds += result.seconds
    } catch (error) {
      row.failed += 1
      failures.push(`${difficulty} ${seed}: ${(error as Error).message}`)
    }
  }
  row.milliseconds = performance.now() - started
  return row
}


async function runBatch() {
  const size = Math.max(1, Number(element<HTMLInputElement>('batch-size').value))
  const table = element<HTMLTableElement>('batch-table')
  const failures: string[] = []
  const header = document.createElement('tr')
  header.append(...['', 'ok', 'failed', 'ms / puzzle', 'avg run (s)'].map((text) => cell(text, 'th')))
  table.replaceChildren(header)
  for (const difficulty of DIFFICULTIES) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const row = runBatchFor(difficulty, size, failures)
    const line = document.createElement('tr')
    line.append(cell(row.difficulty), cell(String(row.generated)), cell(String(row.failed)), cell((row.milliseconds / size).toFixed(2)), cell(row.generated ? (row.seconds / row.generated).toFixed(1) : '-'))
    table.append(line)
  }
  element('batch-failures').replaceChildren(...failures.slice(0, 50).map((text) => Object.assign(document.createElement('li'), { textContent: text })))
}

element('run-batch').addEventListener('click', () => { void runBatch() })
buildPhysicsSliders()
void showPuzzle()

// Reachable from the browser console, to tune a lighting live: change a value of PUZZLE_LIGHTINGS, call board.setLighting(name), then measure.
Object.assign(window, { puzzleLab: { board, PUZZLE_LIGHTINGS, measure: () => board.measure(PALETTE) } })

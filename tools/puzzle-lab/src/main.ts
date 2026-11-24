import { generatePuzzle } from '../../../src/core/dailyPuzzle/generate'
import { runBall, simulate } from '../../../src/core/dailyPuzzle/simulate'
import type { Aim, Cell, Difficulty, PlacedPart, Puzzle } from '../../../src/core/dailyPuzzle/types'

const CELL = 44
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const PLAY_INTERVAL_MS = 350
const FAN_REACH = 3

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const seedInput = element<HTMLInputElement>('seed')
const difficultySelect = element<HTMLSelectElement>('difficulty')
const showWitness = element<HTMLInputElement>('show-witness')
const canvas = element<HTMLCanvasElement>('board')
const tickInput = element<HTMLInputElement>('tick')
const tickLabel = element<HTMLSpanElement>('tick-label')
const verdict = element<HTMLParagraphElement>('verdict')
const context = canvas.getContext('2d') as CanvasRenderingContext2D

const KIND_COLOR: Record<string, string> = {
  ramp: '#8e6bbf', conveyor: '#c98a2b', trampoline: '#2f8fbf', spring: '#3fa56b', seesaw: '#bf5f7a', fan: '#6b7f8e',
}
const KIND_LETTER: Record<string, string> = { ramp: 'R', conveyor: 'C', trampoline: 'T', spring: 'S', seesaw: 'B', fan: 'F' }

let puzzle: Puzzle
let path: Cell[] = []
let tick = 0
let timer: ReturnType<typeof setInterval> | undefined

const currentDifficulty = () => difficultySelect.value as Difficulty
const currentParts = (): PlacedPart[] => (showWitness.checked ? puzzle.witness : [])
const familyOf = (kind: string) => kind.slice(0, kind.lastIndexOf('-'))
const sideOf = (kind: string) => (kind.endsWith('-right') ? '›' : '‹')

function describeAim(aim: Aim): string {
  const at = (cell: Cell) => `(${cell.x},${cell.y})`
  if (aim.kind === 'deliver') return `Deliver the ball to ${at(aim.target)}`
  if (aim.kind === 'light') return `Light candles ${aim.candles.map(at).join(' ')}`
  if (aim.kind === 'flip') return `Flip switches ${aim.switches.map(at).join(' ')} (odd number of crossings)`
  return `Collect stars ${aim.stars.map(at).join(' ')}, then reach the exit ${at(aim.exit)}`
}

function drawGrid() {
  const { width, height } = puzzle.board
  context.strokeStyle = getComputedStyle(document.body).getPropertyValue('--line')
  context.lineWidth = 1
  for (let x = 0; x <= width; x += 1) { context.beginPath(); context.moveTo(x * CELL, 0); context.lineTo(x * CELL, height * CELL); context.stroke() }
  for (let y = 0; y <= height; y += 1) { context.beginPath(); context.moveTo(0, y * CELL); context.lineTo(width * CELL, y * CELL); context.stroke() }
}

const centerOf = (cell: Cell) => ({ x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 })

function drawMarker(cell: Cell, glyph: string, color: string) {
  const { x, y } = centerOf(cell)
  context.fillStyle = color
  context.font = `${CELL * 0.5}px system-ui`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(glyph, x, y)
}

function drawAims() {
  for (const aim of puzzle.board.aims) {
    if (aim.kind === 'deliver') drawMarker(aim.target, '◎', '#c0392b')
    if (aim.kind === 'light') for (const cell of aim.candles) drawMarker(cell, '♦', '#e08a1e')
    if (aim.kind === 'flip') for (const cell of aim.switches) drawMarker(cell, '▣', '#2f6f4f')
    if (aim.kind === 'collect') {
      for (const cell of aim.stars) drawMarker(cell, '★', '#d4a800')
      drawMarker(aim.exit, '◎', '#2f9f5f')
    }
  }
}

function drawParts(parts: PlacedPart[]) {
  for (const part of parts) {
    const family = familyOf(part.kind)
    if (family === 'fan') {
      const side = part.kind.endsWith('-right') ? 1 : -1
      context.fillStyle = 'rgba(107,127,142,0.18)'
      const left = side === 1 ? part.at.x : part.at.x - (FAN_REACH - 1)
      context.fillRect(left * CELL, part.at.y * CELL, FAN_REACH * CELL, CELL)
    }
    context.fillStyle = KIND_COLOR[family] ?? '#888'
    context.fillRect(part.at.x * CELL + 4, part.at.y * CELL + 4, CELL - 8, CELL - 8)
    context.fillStyle = '#fff'
    context.font = `bold ${CELL * 0.4}px system-ui`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const { x, y } = centerOf(part.at)
    context.fillText(`${KIND_LETTER[family] ?? '?'}${sideOf(part.kind)}`, x, y)
  }
}

function drawPath() {
  context.strokeStyle = 'rgba(192,57,43,0.55)'
  context.lineWidth = 3
  context.beginPath()
  path.slice(0, tick + 1).forEach((cell, index) => {
    const { x, y } = centerOf(cell)
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.stroke()
  const ball = path[tick]
  if (!ball) return
  const { x, y } = centerOf(ball)
  context.fillStyle = '#c0392b'
  context.beginPath()
  context.arc(x, y, CELL * 0.18, 0, Math.PI * 2)
  context.fill()
}

function draw() {
  const { width, height } = puzzle.board
  canvas.width = width * CELL
  canvas.height = height * CELL
  drawGrid()
  drawParts(currentParts())
  drawAims()
  drawPath()
  tickLabel.textContent = `${tick} / ${Math.max(0, path.length - 1)}`
  tickInput.value = String(tick)
}

function showPuzzle() {
  stopPlayback()
  puzzle = generatePuzzle(seedInput.value, currentDifficulty())
  const parts = currentParts()
  path = runBall(puzzle.board, parts).path
  tick = 0
  tickInput.max = String(path.length - 1)
  const result = simulate(puzzle.board, parts)
  verdict.textContent = result.solved ? `Solved in ${result.ticks} ticks` : `Not solved (${result.ticks} ticks)`
  verdict.className = result.solved ? 'ok' : 'ko'
  element('aims').replaceChildren(...puzzle.board.aims.map((aim) => Object.assign(document.createElement('li'), { textContent: describeAim(aim) })))
  element('inventory').replaceChildren(...puzzle.inventory.map((kind) => Object.assign(document.createElement('li'), { textContent: kind })))
  draw()
}

function stopPlayback() {
  clearInterval(timer)
  timer = undefined
  element('play').textContent = 'Play'
}

function step() {
  if (tick >= path.length - 1) return stopPlayback()
  tick += 1
  draw()
}

element('step').addEventListener('click', () => { stopPlayback(); step() })
element('reset').addEventListener('click', () => { stopPlayback(); tick = 0; draw() })
element('play').addEventListener('click', () => {
  if (timer) return stopPlayback()
  if (tick >= path.length - 1) tick = 0
  element('play').textContent = 'Pause'
  timer = setInterval(step, PLAY_INTERVAL_MS)
})
tickInput.addEventListener('input', () => { stopPlayback(); tick = Number(tickInput.value); draw() })
seedInput.addEventListener('change', showPuzzle)
difficultySelect.addEventListener('change', showPuzzle)
showWitness.addEventListener('change', showPuzzle)
element('next-seed').addEventListener('click', () => {
  seedInput.value = `lab-${Math.floor(Math.random() * 1_000_000)}`
  showPuzzle()
})

interface BatchRow { difficulty: Difficulty; generated: number; failed: number; milliseconds: number; ticks: number }

function runBatchFor(difficulty: Difficulty, size: number, failures: string[]): BatchRow {
  const row: BatchRow = { difficulty, generated: 0, failed: 0, milliseconds: 0, ticks: 0 }
  const started = performance.now()
  for (let index = 0; index < size; index += 1) {
    const seed = `batch-${index}`
    try {
      const { board, witness } = generatePuzzle(seed, difficulty)
      const result = simulate(board, witness)
      if (!result.solved) throw new Error('the witness does not solve the puzzle')
      if (simulate(board, []).solved) throw new Error('solved with no Part')
      row.generated += 1
      row.ticks += result.ticks
    } catch (error) {
      row.failed += 1
      failures.push(`${difficulty} ${seed}: ${(error as Error).message}`)
    }
  }
  row.milliseconds = performance.now() - started
  return row
}

const cell = (text: string, tag: 'td' | 'th' = 'td') => Object.assign(document.createElement(tag), { textContent: text })

async function runBatch() {
  const size = Math.max(1, Number(element<HTMLInputElement>('batch-size').value))
  const table = element<HTMLTableElement>('batch-table')
  const failures: string[] = []
  const header = document.createElement('tr')
  header.append(...['', 'ok', 'failed', 'ms / puzzle', 'avg ticks'].map((text) => cell(text, 'th')))
  table.replaceChildren(header)
  for (const difficulty of DIFFICULTIES) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const row = runBatchFor(difficulty, size, failures)
    const line = document.createElement('tr')
    line.append(cell(row.difficulty), cell(String(row.generated)), cell(String(row.failed)), cell((row.milliseconds / size).toFixed(2)), cell(row.generated ? (row.ticks / row.generated).toFixed(1) : '-'))
    table.append(line)
  }
  element('batch-failures').replaceChildren(...failures.slice(0, 50).map((text) => Object.assign(document.createElement('li'), { textContent: text })))
}

element('run-batch').addEventListener('click', () => { void runBatch() })
showPuzzle()

import { generatePuzzle } from '../../../src/core/dailyPuzzle/generate'
import { runBall, simulate } from '../../../src/core/dailyPuzzle/simulate'
import type { Aim, Cell, Difficulty, PlacedPart, Puzzle } from '../../../src/core/dailyPuzzle/types'
import { BoardScene } from './boardScene'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const PLAY_INTERVAL_MS = 700

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const seedInput = element<HTMLInputElement>('seed')
const difficultySelect = element<HTMLSelectElement>('difficulty')
const showWitness = element<HTMLInputElement>('show-witness')
const canvas = element<HTMLCanvasElement>('board')
const tickInput = element<HTMLInputElement>('tick')
const tickLabel = element<HTMLSpanElement>('tick-label')
const verdict = element<HTMLParagraphElement>('verdict')
const board = new BoardScene(canvas)

let puzzle: Puzzle
let path: Cell[] = []
let tick = 0
let timer: ReturnType<typeof setInterval> | undefined

const currentDifficulty = () => difficultySelect.value as Difficulty
const currentParts = (): PlacedPart[] => (showWitness.checked ? puzzle.witness : [])

function describeAim(aim: Aim): string {
  const at = (cell: Cell) => `(${cell.x},${cell.y})`
  if (aim.kind === 'deliver') return `Deliver the ball to ${at(aim.target)}`
  if (aim.kind === 'light') return `Light candles ${aim.candles.map(at).join(' ')}`
  if (aim.kind === 'flip') return `Flip switches ${aim.switches.map(at).join(' ')} (odd number of crossings)`
  return `Collect stars ${aim.stars.map(at).join(' ')}, then reach the exit ${at(aim.exit)}`
}

function showTick() {
  tickLabel.textContent = `${tick} / ${Math.max(0, path.length - 1)}`
  tickInput.value = String(tick)
}

async function showPuzzle() {
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
  await board.show(puzzle, parts, path, result.solved)
  showTick()
}

function stopPlayback() {
  clearInterval(timer)
  timer = undefined
  element('play').textContent = 'Play'
}

function step() {
  if (tick >= path.length - 1) return stopPlayback()
  tick += 1
  board.step(tick, PLAY_INTERVAL_MS)
  showTick()
}

element('step').addEventListener('click', () => { stopPlayback(); step() })
element('reset').addEventListener('click', () => { stopPlayback(); tick = 0; board.seek(0); showTick() })
element('play').addEventListener('click', () => {
  if (timer) return stopPlayback()
  if (tick >= path.length - 1) { tick = 0; board.seek(0) }
  element('play').textContent = 'Pause'
  timer = setInterval(step, PLAY_INTERVAL_MS)
})
tickInput.addEventListener('input', () => { stopPlayback(); tick = Number(tickInput.value); board.seek(tick); showTick() })
seedInput.addEventListener('change', () => void showPuzzle())
difficultySelect.addEventListener('change', () => void showPuzzle())
showWitness.addEventListener('change', () => void showPuzzle())
element('next-seed').addEventListener('click', () => {
  seedInput.value = `lab-${Math.floor(Math.random() * 1_000_000)}`
  void showPuzzle()
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
void showPuzzle()

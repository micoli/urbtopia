// PROTOTYPE fake game state: no simulation, just enough data to judge the HUD.
import { useSyncExternalStore } from 'react'
import { CATALOG, itemById, type Resource } from './catalog'
import { isRoad } from './map'

export type Building = { id: number; itemId: string; x: number; z: number; ready: boolean }
export type Ghost = { x: number; z: number; valid: boolean }

export type GameState = {
  stock: Record<Resource, number>
  citizens: number
  nextUnlock: number
  powerUsed: number
  powerCap: number
  waterUsed: number
  waterCap: number
  buildings: Building[]
  selectedId: number | null
  buildItemId: string | null
  ghost: Ghost | null
  toast: string | null
}

let nextId = 1
function initialBuildings(): Building[] {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const pool = ['workshop', 'home', 'home', 'shop', 'factory']
  const list: Building[] = []
  for (let x = -12; x <= 12; x++) for (let z = -12; z <= 12; z++) {
    if (isRoad(x, z) || rnd() > 0.3) continue
    list.push({ id: nextId++, itemId: pool[Math.floor(rnd() * pool.length)], x, z, ready: rnd() < 0.05 })
  }
  return list
}

let state: GameState = {
  stock: { urbs: 600, wood: 4, stone: 2, planks: 0 },
  citizens: 12,
  nextUnlock: 30,
  powerUsed: 6,
  powerCap: 12,
  waterUsed: 6,
  waterCap: 12,
  buildings: initialBuildings(),
  selectedId: null,
  buildItemId: null,
  ghost: null,
  toast: null,
}

const listeners = new Set<() => void>()
function set(patch: Partial<GameState>) {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getState = () => state
export const useGame = () => useSyncExternalStore(subscribe, () => state)
export const subscribeGame = subscribe

let toastTimer = 0
function toast(message: string) {
  set({ toast: message })
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => set({ toast: null }), 1800)
}

export const select = (id: number | null) => set({ selectedId: id })
export const startBuild = (itemId: string) => set({ buildItemId: itemId, selectedId: null })
export const cancelBuild = () => set({ buildItemId: null, ghost: null })
export const setGhost = (ghost: Ghost | null) => set({ ghost })

export function confirmBuild() {
  const { buildItemId, ghost, stock } = state
  if (!buildItemId || !ghost) return
  if (!ghost.valid) return toast('Cannot build here')
  const item = itemById(buildItemId)
  if (stock.urbs < item.cost) return toast('Not enough Urbs')
  set({
    stock: { ...stock, urbs: stock.urbs - item.cost },
    citizens: state.citizens + (item.citizens ?? 0),
    buildings: [...state.buildings, { id: nextId++, itemId: item.id, x: ghost.x, z: ghost.z, ready: false }],
    ghost: { ...ghost, valid: false },
  })
}

export function collect(id: number) {
  const building = state.buildings.find(b => b.id === id)
  if (!building?.ready) return
  const yields = itemById(building.itemId).yields
  if (!yields) return
  set({
    stock: { ...state.stock, [yields.resource]: state.stock[yields.resource] + yields.amount },
    buildings: state.buildings.map(b => (b.id === id ? { ...b, ready: false } : b)),
  })
}

export function sell(id: number) {
  const building = state.buildings.find(b => b.id === id)
  if (!building) return
  const item = itemById(building.itemId)
  set({
    stock: { ...state.stock, urbs: state.stock.urbs + Math.floor(item.cost * 0.75) },
    citizens: state.citizens - (item.citizens ?? 0),
    buildings: state.buildings.filter(b => b.id !== id),
    selectedId: null,
  })
}

window.setInterval(() => {
  const idle = state.buildings.filter(b => !b.ready && itemById(b.itemId).yields)
  if (idle.length === 0) return
  const pick = idle[Math.floor(Math.random() * idle.length)]
  set({ buildings: state.buildings.map(b => (b === pick ? { ...b, ready: true } : b)) })
}, 2500)

export const ALL_MODELS = [...new Set(CATALOG.map(i => i.model))]

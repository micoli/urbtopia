import { create } from 'zustand'

const STORAGE_KEY = 'assets-editor:layout'

export type PanelName = 'left' | 'right' | 'preview'

// Pixels: the width of the list column, the width of the preview column, and the height of the preview.
const DEFAULTS: Record<PanelName, number> = { left: 304, right: 384, preview: 240 }

const LIMITS: Record<PanelName, readonly [number, number]> = { left: [200, 640], right: [280, 960], preview: [120, 800] }

const clamp = (name: PanelName, size: number) => Math.min(LIMITS[name][1], Math.max(LIMITS[name][0], Math.round(size)))

const stored = (): Record<PanelName, number> => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Record<PanelName, unknown>>
    return Object.fromEntries((Object.keys(DEFAULTS) as PanelName[]).map(name => [name, typeof value[name] === 'number' ? clamp(name, value[name]) : DEFAULTS[name]])) as Record<PanelName, number>
  } catch {
    return { ...DEFAULTS }
  }
}

interface LayoutState {
  sizes: Record<PanelName, number>
  resize: (name: PanelName, size: number) => void
  reset: (name: PanelName) => void
}

const save = (sizes: Record<PanelName, number>) => localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes))

// The sizes of the resizable panels, kept in the browser between sessions.
export const useLayout = create<LayoutState>()((set, get) => ({
  sizes: stored(),
  resize: (name, size) => {
    const sizes = { ...get().sizes, [name]: clamp(name, size) }
    save(sizes)
    set({ sizes })
  },
  reset: name => get().resize(name, DEFAULTS[name]),
}))

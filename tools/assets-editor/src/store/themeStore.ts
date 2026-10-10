import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'assets-editor:theme'

const dark = () => window.matchMedia('(prefers-color-scheme: dark)')

const stored = (): ThemeMode => {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

const apply = (mode: ThemeMode) => document.documentElement.classList.toggle('dark', mode === 'dark' || (mode === 'system' && dark().matches))

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useTheme = create<ThemeState>()(set => ({
  mode: stored(),
  setMode: mode => {
    localStorage.setItem(STORAGE_KEY, mode)
    apply(mode)
    set({ mode })
  },
}))

// Applies the stored choice before the first render and follows the system while it is the choice.
export function startTheme(): void {
  apply(useTheme.getState().mode)
  dark().addEventListener('change', () => apply(useTheme.getState().mode))
}

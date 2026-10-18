import { useTheme, type ThemeMode } from '../store/themeStore'

const MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '☀ Light' },
  { mode: 'dark', label: '☾ Dark' },
  { mode: 'system', label: 'System' },
]

export function ThemeSwitch() {
  const mode = useTheme(state => state.mode)
  const setMode = useTheme(state => state.setMode)

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-md bg-zinc-200/60 p-0.5">
      {MODES.map(option => (
        <button
          key={option.mode}
          role="radio"
          aria-checked={mode === option.mode}
          onClick={() => setMode(option.mode)}
          className={`rounded px-2 py-1 text-xs font-medium transition ${mode === option.mode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

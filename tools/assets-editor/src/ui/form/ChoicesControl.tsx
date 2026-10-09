interface Props {
  value: string[] | undefined
  options: readonly string[]
  onChange: (value: string[] | undefined) => void
}

export function ChoicesControl({ value, options, onChange }: Props) {
  const chosen = new Set(value ?? [])
  const toggle = (option: string) => {
    const next = options.filter(candidate => (candidate === option ? !chosen.has(option) : chosen.has(candidate)))
    onChange(next.length ? next : undefined)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(option => (
        <button
          key={option}
          onClick={() => toggle(option)}
          aria-pressed={chosen.has(option)}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${chosen.has(option) ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-zinc-600 ring-zinc-300 hover:bg-zinc-50'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

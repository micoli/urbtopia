import { NumberControl } from './NumberControl'

interface Props {
  value: [number, number] | undefined
  integer: boolean
  min?: number
  parts: [string, string]
  label: string
  onChange: (value: [number, number] | undefined) => void
}

export function PairControl({ value, integer, min, parts, label, onChange }: Props) {
  const fallback = min ?? 0
  const set = (index: 0 | 1) => (part: number | undefined) => {
    const next: [number, number] = [...(value ?? [fallback, fallback])]
    next[index] = part ?? fallback
    onChange(next)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {parts.map((part, index) => (
        <label key={part} className="flex items-center gap-2 text-xs text-zinc-500">
          {part}
          <NumberControl value={value?.[index]} integer={integer} min={min} label={`${label} ${part}`} onChange={set(index as 0 | 1)} />
        </label>
      ))}
    </div>
  )
}

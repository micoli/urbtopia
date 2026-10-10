import { CommitInput } from './CommitInput'

interface Props {
  value: number | undefined
  integer: boolean
  min?: number
  placeholder?: string
  label: string
  onChange: (value: number | undefined) => void
}

export function NumberControl({ value, integer, min, placeholder, label, onChange }: Props) {
  const commit = (text: string) => {
    if (text.trim() === '') return onChange(undefined)
    const parsed = Number(text)
    if (Number.isFinite(parsed)) onChange(parsed)
  }

  return <CommitInput type="number" inputMode={integer ? 'numeric' : 'decimal'} step={integer ? 1 : 'any'} min={min} aria-label={label} placeholder={placeholder} value={value === undefined ? '' : String(value)} onCommit={commit} />
}

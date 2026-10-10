import { CommitInput } from './CommitInput'

interface Props {
  value: number[] | undefined
  label: string
  onChange: (value: number[] | undefined) => void
}

// A short list of numbers, typed comma-separated.
export function NumberListControl({ value, label, onChange }: Props) {
  const commit = (text: string) => {
    const numbers = text.split(',').map(part => part.trim()).filter(Boolean).map(Number)
    if (numbers.some(number => !Number.isFinite(number))) return
    onChange(numbers.length ? numbers : undefined)
  }
  return <CommitInput aria-label={label} placeholder="10, 50, 100" value={(value ?? []).join(', ')} onCommit={commit} />
}

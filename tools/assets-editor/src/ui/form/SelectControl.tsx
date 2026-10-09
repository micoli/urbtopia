import { input } from '../styles'

interface Props {
  value: string | undefined
  options: readonly string[]
  label: string
  required: boolean
  onChange: (value: string | undefined) => void
}

export function SelectControl({ value, options, label, required, onChange }: Props) {
  return (
    <select className={input} aria-label={label} value={value ?? ''} onChange={event => onChange(event.target.value || undefined)}>
      {(!required || value === undefined) && <option value="">—</option>}
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

import { CommitInput } from './CommitInput'

interface Props {
  value: string | undefined
  label: string
  readOnly?: boolean
  onChange: (value: string | undefined) => void
}

export function TextControl({ value, label, readOnly, onChange }: Props) {
  return <CommitInput aria-label={label} readOnly={readOnly} value={value ?? ''} onCommit={next => onChange(next === '' ? undefined : next)} />
}

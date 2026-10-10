import { useEffect, useState } from 'react'
import { input } from '../styles'

interface Props {
  value: number | undefined
  inherited: boolean
  integer: boolean
  label: string
  onCommit: (value: number) => void
}

// Typing stays local; the document changes on blur or Enter, so each cell edit is one undo step.
export function CellInput({ value, inherited, integer, label, onCommit }: Props) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value))
  useEffect(() => setDraft(value === undefined ? '' : String(value)), [value])

  const commit = () => {
    const next = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(next) || (integer && !Number.isInteger(next)) || next === value) return setDraft(value === undefined ? '' : String(value))
    onCommit(next)
  }

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      className={`${input} w-20 text-right tabular-nums ${inherited ? 'text-zinc-400' : ''}`}
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === 'Enter') commit()
        if (event.key === 'Escape') setDraft(value === undefined ? '' : String(value))
      }}
    />
  )
}

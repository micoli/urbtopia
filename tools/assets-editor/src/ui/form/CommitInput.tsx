import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { input } from '../styles'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onCommit: (value: string) => void
}

// Typing stays local; the document changes on blur or Enter, so each field edit is one undo step.
export function CommitInput({ value, onCommit, className, ...rest }: Props) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    if (draft !== value) onCommit(draft)
  }

  return (
    <input
      {...rest}
      className={`${input} ${className ?? ''}`}
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === 'Enter') commit()
        if (event.key === 'Escape') setDraft(value)
      }}
    />
  )
}

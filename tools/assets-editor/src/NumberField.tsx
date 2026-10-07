import { useEffect, useState } from 'react'

interface Props {
  label: string
  value: number | undefined
  placeholder?: string
  onCommit: (value: number | undefined) => void
}

export function NumberField({ label, value, placeholder = '', onCommit }: Props) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value))
  useEffect(() => {
    setDraft(value === undefined ? '' : String(value))
  }, [value])

  return (
    <div className="row">
      {label}:{' '}
      <input type="number" step="any" style={{ width: 60 }} value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(draft === '' ? undefined : Number(draft))} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} />
    </div>
  )
}

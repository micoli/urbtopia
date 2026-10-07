import { Label } from 'radix-ui'
import { useEffect, useId, useState } from 'react'

interface Props {
  label: string
  value: string
  onCommit: (value: string) => void
}

export function TextField({ label, value, onCommit }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <div className="row">
      <Label.Root htmlFor={id}>{label}: </Label.Root>
      <input id={id} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(draft.trim())} onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()} />
    </div>
  )
}

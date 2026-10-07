import { Popover } from 'radix-ui'
import { useState } from 'react'

interface Props {
  onAdd: (name: string) => void
}

export function AddVariantPopover({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button>+ variant</button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="popover-content" sideOffset={4}>
          <input autoFocus placeholder="Variant name" aria-label="Variant name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
          <button onClick={submit}>add</button>
          <Popover.Arrow className="popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

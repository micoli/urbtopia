import { Popover } from 'radix-ui'
import { useState } from 'react'
import { button, input } from './styles'

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
        <button className={button('ghost')}>＋ variant</button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 flex gap-2 rounded-lg bg-white p-2 shadow-lg ring-1 ring-zinc-200" sideOffset={4}>
          <input className={input} autoFocus placeholder="Variant name" aria-label="Variant name" value={name} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === 'Enter' && submit()} />
          <button className={button('primary')} onClick={submit}>Add</button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

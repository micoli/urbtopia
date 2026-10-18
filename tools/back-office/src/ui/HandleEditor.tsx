import { useState } from 'react'
import { resetHandle, setHandle, type AdminClient } from '../api/supabaseAdmin'
import { isValidHandle, neutralHandle } from '../domain/handle'
import { button, input } from './styles'
import { TypedConfirmDialog } from './TypedConfirmDialog'

interface Props {
  client: AdminClient
  userId: string
  handle: string
  onChanged: () => void
}

export function HandleEditor({ client, userId, handle, onChanged }: Props) {
  const [draft, setDraft] = useState(handle)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  const run = async (action: () => Promise<void>) => {
    setError('')
    try {
      await action()
      onChanged()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  const valid = isValidHandle(draft)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input className={input} value={draft} onChange={event => setDraft(event.target.value)} aria-label="Handle" aria-invalid={!valid} />
        <button className={button('primary')} disabled={!valid || draft === handle} onClick={() => void run(() => setHandle(client, userId, draft))}>Save</button>
        <button className={button('danger')} disabled={handle === neutralHandle(userId)} onClick={() => setResetting(true)}>Reset</button>
      </div>
      {!valid && <p className="text-xs text-amber-700">3 to 20 letters, digits, "_" or "-".</p>}
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
      {resetting && (
        <TypedConfirmDialog
          title="Reset Handle"
          message={`The Handle becomes ${neutralHandle(userId)}. The player can pick another one after the usual delay.`}
          expected={handle}
          confirm="Reset Handle"
          onCancel={() => setResetting(false)}
          onConfirm={() => {
            setResetting(false)
            void run(() => resetHandle(client, userId))
          }}
        />
      )}
    </div>
  )
}

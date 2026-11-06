import { useState } from 'react'
import { replyToReport } from '../api/bugReports'
import type { AdminClient } from '../api/supabaseAdmin'
import { button, input } from './styles'

interface Props {
  client: AdminClient
  reportId: number
  onSent: () => void
}

export function ReportReplyForm({ client, reportId, onSent }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await replyToReport(client, reportId, text)
      setText('')
      onSent()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea className={input} rows={3} maxLength={500} placeholder="Reply to the player (500 characters)" value={text} onChange={event => setText(event.target.value)} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-2">
        <button className={button('primary')} disabled={sending || text.trim() === ''} onClick={() => void send()}>Reply</button>
        <span className="text-xs text-zinc-500">{text.length}/500</span>
      </div>
    </div>
  )
}

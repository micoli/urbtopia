import { formatDate } from '../domain/format'
import type { ReportReply } from '../domain/bugReports'

export function ReportThread({ replies }: { replies: ReportReply[] }) {
  if (replies.length === 0) return <p className="text-sm text-zinc-500">No reply yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {replies.map(reply => (
        <li key={reply.id} className={`rounded-md p-2 text-sm ${reply.fromAdmin ? 'bg-indigo-50' : 'bg-zinc-100'}`}>
          <p className="text-xs text-zinc-500">{reply.fromAdmin ? 'You' : 'Player'} · {formatDate(reply.createdAt)}</p>
          <p className="break-words whitespace-pre-wrap">{reply.body}</p>
        </li>
      ))}
    </ul>
  )
}

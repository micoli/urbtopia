import type { SaveRevision } from '../api/supabaseAdmin'
import { formatBytes, formatDate, formatNumber } from '../domain/format'
import { badge, button } from './styles'

interface Props {
  save: SaveRevision
  handle: string | null
  accountId: string
  onOpen: () => void
}

function download(save: SaveRevision, name: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(save.envelope, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `urbtopia-${name}-r${save.revision}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function SaveRow({ save, handle, accountId, onOpen }: Props) {
  const { stats } = save

  return (
    <li
      className={`flex flex-col gap-2 py-3 first:pt-0 last:pb-0 ${stats.readable ? 'cursor-pointer hover:bg-zinc-50' : ''}`}
      onClick={stats.readable ? onOpen : undefined}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Revision {save.revision}</span>
        <span className="text-xs text-zinc-500">{formatDate(save.clientSavedAt)} · {formatBytes(save.size)} · <b>format v{save.formatVersion}</b></span>
        {stats.readable ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-600">
            <span>Citizens <b>{formatNumber(stats.citizens)}</b></span>
            <span>Urbs <b>{formatNumber(stats.urbs)}</b></span>
            <span>Buildings <b>{formatNumber(stats.buildings)}</b></span>
            <span>Parcels <b>{formatNumber(stats.parcels)}</b></span>
            <span>Game time <b>{formatDate(stats.lastSeen)}</b></span>
          </dl>
        ) : (
          <span className={`${badge('amber')} w-fit`}>Unreadable by this game version: {stats.reason}</span>
        )}
        <span className="ml-auto flex gap-2">
          <button className={button()} onClick={event => {
              event.stopPropagation()
              download(save, handle ?? accountId.slice(0, 8))
            }}>Download JSON</button>
        </span>
      </div>
    </li>
  )
}

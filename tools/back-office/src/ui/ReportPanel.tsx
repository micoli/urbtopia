import { useState } from 'react'
import type { AdminClient } from '../api/supabaseAdmin'
import { canReply, cityEnvelopeText, hasCity } from '../domain/bugReports'
import { formatDate } from '../domain/format'
import { useReportDetail } from '../hooks/useReportDetail'
import { Fact } from './Fact'
import { GameFrame, type GameLaunch } from './GameFrame'
import { ReportReplyForm } from './ReportReplyForm'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportStatusControl } from './ReportStatusControl'
import { ReportThread } from './ReportThread'
import { Section } from './Section'
import { button, panel } from './styles'

interface Props {
  client: AdminClient
  reportId: number
  gameUrl: string
  onChanged: () => void
}

export function ReportPanel({ client, reportId, gameUrl, onChanged }: Props) {
  const [reloadKey, setReloadKey] = useState(0)
  const [launch, setLaunch] = useState<GameLaunch | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const state = useReportDetail(client, reportId, reloadKey, onChanged)

  if (state.kind === 'loading') return <p className="text-sm text-zinc-500">Loading…</p>
  if (state.kind === 'error') return <p className="text-sm text-red-700">Cannot load the report: {state.message}</p>
  const { detail } = state

  const reload = () => {
    setReloadKey(key => key + 1)
    onChanged()
  }

  const openInGame = async () => {
    setOpenError(null)
    try {
      const envelope = await cityEnvelopeText(detail.attachments)
      if (envelope === null) return
      setLaunch(previous => ({ id: (previous?.id ?? 0) + 1, payload: { kind: 'report', report: { reportId: detail.id, envelope, camera: detail.camera } } }))
    } catch (failure) {
      setOpenError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <Section title={`Report ${detail.id}`}>
        <div className="flex flex-wrap items-center gap-3">
          <ReportStatusBadge status={detail.status} />
          <ReportStatusControl client={client} reportId={detail.id} status={detail.status} onChanged={reload} />
        </div>
        <p className="break-words whitespace-pre-wrap text-sm">{detail.description}</p>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          <Fact label="Player">{detail.authorHandle ?? detail.authorEmail ?? detail.authorId}</Fact>
          <Fact label="Email">{detail.authorEmail ?? '—'}</Fact>
          <Fact label="Sent">{formatDate(detail.createdAt)}</Fact>
          <Fact label="City">{detail.citySeed ?? '—'}</Fact>
          <Fact label="Camera">{detail.camera ? JSON.stringify(detail.camera) : '—'}</Fact>
        </dl>
        <details>
          <summary className="cursor-pointer text-sm text-zinc-600">Technical context</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-xs">{JSON.stringify(detail.context, null, 2)}</pre>
        </details>
      </Section>
      {detail.attachments.screenshot && (
        <Section title="Capture">
          <img className="max-h-[28rem] w-full rounded object-contain" src={detail.attachments.screenshot} alt="Screenshot sent by the player" />
        </Section>
      )}
      <Section title="Conversation">
        <ReportThread replies={detail.replies} />
        {canReply(detail.status) ? <ReportReplyForm client={client} reportId={detail.id} onSent={reload} /> : <p className="text-sm text-zinc-500">Resolved: the thread is closed.</p>}
      </Section>
      <section className={`${panel} flex flex-col gap-3 p-4`}>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-800">City of the report</h3>
          <button className={button()} disabled={!hasCity(detail.attachments)} onClick={() => void openInGame()}>Open in game</button>
          {!hasCity(detail.attachments) && <span className="text-sm text-zinc-500">No City attached.</span>}
          {openError && <span className="text-sm text-red-700">{openError}</span>}
        </div>
        <div className="h-[32rem]">
          <GameFrame gameUrl={gameUrl} launch={launch} />
        </div>
      </section>
    </div>
  )
}

import { useState } from 'react'
import type { AdminClient } from '../api/supabaseAdmin'
import { useReports } from '../hooks/useReports'
import { ReportList } from './ReportList'
import { ReportPanel } from './ReportPanel'

interface Props {
  client: AdminClient
  gameUrl: string
}

export function ReportsView({ client, gameUrl }: Props) {
  const { state, reload } = useReports(client)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,26rem)_1fr]">
      <ReportList state={state} selectedId={selectedId} onSelect={setSelectedId} onRetry={reload} />
      <section className="flex min-h-0 flex-col p-3">
        {selectedId === null ? <p className="text-sm text-zinc-500">Select a bug report to read it and answer.</p> : <ReportPanel key={selectedId} client={client} reportId={selectedId} gameUrl={gameUrl} onChanged={reload} />}
      </section>
    </div>
  )
}

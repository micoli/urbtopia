import { useMemo, useState } from 'react'
import { createAdminClient } from '../api/supabaseAdmin'
import { useAccounts } from '../hooks/useAccounts'
import type { Connection } from '../store/connectionStore'
import { AccountList } from './AccountList'
import { AccountPanel } from './AccountPanel'
import { TopBar } from './TopBar'

interface Props {
  connection: Connection
}

export function Shell({ connection }: Props) {
  const client = useMemo(() => createAdminClient(connection), [connection])
  const { state, reload } = useAccounts(client)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = state.kind === 'ready' ? state.accounts.find(account => account.id === selectedId) : undefined

  return (
    <div className="flex h-full flex-col">
      <TopBar connection={connection} onRefresh={reload} />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,26rem)_1fr]">
        <AccountList state={state} selectedId={selectedId} onSelect={setSelectedId} onRetry={reload} />
        <section className="min-h-0 overflow-y-auto p-5">
          {selected ? (
            <AccountPanel key={selected.id} client={client} account={selected} gameUrl={connection.gameUrl} onChanged={reload} />
          ) : (
            <p className="text-sm text-zinc-500">Select an account to see its details and Cloud saves.</p>
          )}
        </section>
      </div>
    </div>
  )
}

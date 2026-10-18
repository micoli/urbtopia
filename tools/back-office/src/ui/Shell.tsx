import { useMemo, useState } from 'react'
import { createAdminClient } from '../api/supabaseAdmin'
import { useAccounts } from '../hooks/useAccounts'
import type { Profile } from '../domain/profiles'
import { AccountList } from './AccountList'
import { AccountPanel } from './AccountPanel'
import { TopBar } from './TopBar'

interface Props {
  profile: Profile
}

export function Shell({ profile }: Props) {
  const client = useMemo(() => createAdminClient(profile), [profile])
  const { state, reload } = useAccounts(client)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = state.kind === 'ready' ? state.accounts.find(account => account.id === selectedId) : undefined

  return (
    <div className="flex h-full flex-col">
      <TopBar profile={profile} onRefresh={reload} />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,26rem)_1fr]">
        <AccountList state={state} selectedId={selectedId} onSelect={setSelectedId} onRetry={reload} />
        <section className="min-h-0 overflow-y-auto p-5">
          {selected ? (
            <AccountPanel key={selected.id} client={client} account={selected} gameUrl={profile.gameUrl} onChanged={reload} />
          ) : (
            <p className="text-sm text-zinc-500">Select an account to see its details and Cloud saves.</p>
          )}
        </section>
      </div>
    </div>
  )
}

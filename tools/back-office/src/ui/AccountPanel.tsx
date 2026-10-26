import { useState } from 'react'
import type { AdminClient } from '../api/supabaseAdmin'
import { accountLabel, type AccountSummary } from '../domain/accounts'
import { formatDate } from '../domain/format'
import { useAccountDetail } from '../hooks/useAccountDetail'
import { BanControl } from './BanControl'
import { Fact } from './Fact'
import { GameFrame, type GameLaunch } from './GameFrame'
import { HandleEditor } from './HandleEditor'
import { CityList } from './CityList'
import { badge, panel } from './styles'

interface Props {
  client: AdminClient
  account: AccountSummary
  gameUrl: string
  onChanged: () => void
}

export function AccountPanel({ client, account, gameUrl, onChanged }: Props) {
  const detail = useAccountDetail(client, account.id)
  const [launch, setLaunch] = useState<GameLaunch | null>(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className={`${panel} sticky top-0 flex max-h-[40%] shrink-0 flex-col gap-3 overflow-y-auto p-4`}>
        <header className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{accountLabel(account)}</h2>
          <p className="text-xs text-zinc-500">{account.id}</p>
        </header>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
          <Fact label="Email">{account.email ?? '—'}</Fact>
          <Fact label="Kind"><span className={badge(account.anonymous ? 'neutral' : 'indigo')}>{account.anonymous ? 'Anonymous' : 'Email attached'}</span></Fact>
          <Fact label="Created">{formatDate(account.createdAt)}</Fact>
          <Fact label="Last sign-in">{formatDate(account.lastSignInAt)}</Fact>
          <Fact label="Friends">{detail.kind === 'ready' ? detail.detail.friendCount : '…'}</Fact>
          <Fact label="Medals">
            {detail.kind === 'ready' ? (detail.detail.medals.length === 0 ? '—' : detail.detail.medals.map(medal => medal.code).join(', ')) : '…'}
          </Fact>
        </dl>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          {account.handle ? (
            <HandleEditor key={account.handle} client={client} userId={account.id} handle={account.handle} onChanged={onChanged} />
          ) : (
            <p className="text-sm text-zinc-500">This account has not chosen a Handle.</p>
          )}
          <BanControl client={client} account={account} onChanged={onChanged} />
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(18rem,18rem)_1fr] gap-3">
        <section className={`${panel} flex min-h-0 flex-col gap-3 overflow-y-auto p-4`}>
          <h3 className="text-sm font-semibold text-zinc-800">Cloud saves</h3>
          {detail.kind === 'loading' && <p className="text-sm text-zinc-500">Loading…</p>}
          {detail.kind === 'error' && <p className="text-sm text-red-700">Cannot load the account: {detail.message}</p>}
          {detail.kind === 'ready' && (
            <CityList
              cities={detail.detail.cities}
              handle={account.handle}
              accountId={account.id}
              onOpen={save => setLaunch(previous => ({ id: (previous?.id ?? 0) + 1, save: { handle: account.handle, revision: save.revision, envelope: save.envelope } }))}
            />
          )}
        </section>
        <GameFrame gameUrl={gameUrl} launch={launch} />
      </div>
    </div>
  )
}

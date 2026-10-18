import type { AdminClient } from '../api/supabaseAdmin'
import { accountLabel, type AccountSummary } from '../domain/accounts'
import { formatDate } from '../domain/format'
import { useAccountDetail } from '../hooks/useAccountDetail'
import { BanControl } from './BanControl'
import { Fact } from './Fact'
import { HandleEditor } from './HandleEditor'
import { SaveList } from './SaveList'
import { Section } from './Section'
import { badge } from './styles'

interface Props {
  client: AdminClient
  account: AccountSummary
  gameUrl: string
  onChanged: () => void
}

export function AccountPanel({ client, account, gameUrl, onChanged }: Props) {
  const detail = useAccountDetail(client, account.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">{accountLabel(account)}</h2>
        <p className="text-xs text-zinc-500">{account.id}</p>
      </header>

      <Section title="Account">
        <dl className="grid grid-cols-2 gap-3">
          <Fact label="Email">{account.email ?? '—'}</Fact>
          <Fact label="Kind"><span className={badge(account.anonymous ? 'neutral' : 'indigo')}>{account.anonymous ? 'Anonymous' : 'Email attached'}</span></Fact>
          <Fact label="Created">{formatDate(account.createdAt)}</Fact>
          <Fact label="Last sign-in">{formatDate(account.lastSignInAt)}</Fact>
          <Fact label="Friends">{detail.kind === 'ready' ? detail.detail.friendCount : '…'}</Fact>
          <Fact label="Medals">
            {detail.kind === 'ready' ? (detail.detail.medals.length === 0 ? '—' : detail.detail.medals.map(medal => medal.code).join(', ')) : '…'}
          </Fact>
        </dl>
        <BanControl client={client} account={account} onChanged={onChanged} />
      </Section>

      <Section title="Handle">
        {account.handle ? (
          <HandleEditor key={account.handle} client={client} userId={account.id} handle={account.handle} onChanged={onChanged} />
        ) : (
          <p className="text-sm text-zinc-500">This account has not chosen a Handle.</p>
        )}
      </Section>

      <Section title="Cloud saves">
        {detail.kind === 'loading' && <p className="text-sm text-zinc-500">Loading…</p>}
        {detail.kind === 'error' && <p className="text-sm text-red-700">Cannot load the account: {detail.message}</p>}
        {detail.kind === 'ready' && <SaveList saves={detail.detail.saves} handle={account.handle} gameUrl={gameUrl} accountId={account.id} />}
      </Section>
    </div>
  )
}

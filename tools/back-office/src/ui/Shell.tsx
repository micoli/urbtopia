import { useMemo } from 'react'
import { createAdminClient } from '../api/supabaseAdmin'
import { useAccounts } from '../hooks/useAccounts'
import { useReports } from '../hooks/useReports'
import { useUnreadBadge } from '../hooks/useUnreadBadge'
import { countUnread } from '../domain/unreadBadge'
import { environmentOf, type RouteView } from '../domain/route'
import { useRoute } from '../store/routeStore'
import type { Profile } from '../domain/profiles'
import { AccountList } from './AccountList'
import { AccountPanel } from './AccountPanel'
import { ReportsView } from './ReportsView'
import { TopBar } from './TopBar'
import { ViewTabs } from './ViewTabs'

interface Props {
  profile: Profile
}

export function Shell({ profile }: Props) {
  const client = useMemo(() => createAdminClient(profile), [profile])
  const { state, reload } = useAccounts(client)
  const reports = useReports(client)
  useUnreadBadge(reports.state.kind === 'ready' ? countUnread(reports.state.reports) : 0)
  const { route, navigate } = useRoute()
  const view = route.view
  const environment = environmentOf(profile)
  const open = (nextView: RouteView, id: string | null) => navigate({ environment, view: nextView, id })
  const selectedId = view === 'account' ? route.id : null
  const selectedReportId = view === 'bug-report' && route.id !== null && /^\d+$/.test(route.id) ? Number(route.id) : null
  const selected = state.kind === 'ready' ? state.accounts.find(account => account.id === selectedId) : undefined

  return (
    <div className="flex h-full flex-col">
      <TopBar profile={profile} onRefresh={reload} />
      <ViewTabs view={view} onChange={nextView => open(nextView, null)} />
      {view === 'bug-report' ? (
        <ReportsView client={client} gameUrl={profile.gameUrl} state={reports.state} reload={reports.reload} selectedId={selectedReportId} onSelect={id => open('bug-report', String(id))} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,26rem)_1fr]">
          <AccountList client={client} state={state} selectedId={selectedId} onSelect={id => open('account', id)} onRetry={reload} />
          <section className="flex min-h-0 flex-col p-3">
            {selected ? (
              <AccountPanel key={selected.id} client={client} account={selected} gameUrl={profile.gameUrl} onChanged={reload} />
            ) : (
              <p className="text-sm text-zinc-500">Select an account to see its details and Cloud saves.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

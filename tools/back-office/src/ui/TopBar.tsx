import { isLocalUrl, useConnection, type Connection } from '../store/connectionStore'
import { badge, button } from './styles'
import { ThemeSwitch } from './ThemeSwitch'

interface Props {
  connection: Connection
  onRefresh: () => void
}

export function TopBar({ connection, onRefresh }: Props) {
  const forget = useConnection(state => state.forget)
  const host = new URL(connection.url).host
  const local = isLocalUrl(connection.url)

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5">
      <div className="flex items-baseline gap-2">
        <h1 className="text-base font-semibold tracking-tight">Back office</h1>
        <span className="text-xs text-zinc-500">Urbtopia</span>
      </div>
      <span className={badge(local ? 'green' : 'red')} title={connection.url}>{local ? 'Local' : 'Remote'} · {host}</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <ThemeSwitch />
        <button className={button('ghost')} onClick={onRefresh}>↻ Refresh</button>
        <button className={button('secondary')} onClick={forget}>Forget key</button>
      </div>
    </header>
  )
}

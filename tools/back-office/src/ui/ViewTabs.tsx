import { button } from './styles'
import type { RouteView } from '../domain/route'

interface Props {
  view: RouteView
  onChange: (view: RouteView) => void
}

export function ViewTabs({ view, onChange }: Props) {
  return (
    <nav className="flex gap-1 border-b border-zinc-200 bg-white px-4 py-1.5">
      <button className={button(view === 'account' ? 'primary' : 'ghost')} onClick={() => onChange('account')}>Accounts</button>
      <button className={button(view === 'bug-report' ? 'primary' : 'ghost')} onClick={() => onChange('bug-report')}>Bug reports</button>
    </nav>
  )
}

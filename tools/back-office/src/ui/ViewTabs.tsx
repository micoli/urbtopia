import { button } from './styles'

export type View = 'accounts' | 'reports'

interface Props {
  view: View
  onChange: (view: View) => void
}

export function ViewTabs({ view, onChange }: Props) {
  return (
    <nav className="flex gap-1 border-b border-zinc-200 bg-white px-4 py-1.5">
      <button className={button(view === 'accounts' ? 'primary' : 'ghost')} onClick={() => onChange('accounts')}>Accounts</button>
      <button className={button(view === 'reports' ? 'primary' : 'ghost')} onClick={() => onChange('reports')}>Bug reports</button>
    </nav>
  )
}

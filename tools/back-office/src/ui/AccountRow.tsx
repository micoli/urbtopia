import { accountLabel, isBanned, type AccountSummary } from '../domain/accounts'
import { badge } from './styles'

interface Props {
  account: AccountSummary
  selected: boolean
  onSelect: () => void
}

export function AccountRow({ account, selected, onSelect }: Props) {
  return (
    <li>
      <button
        onClick={onSelect}
        aria-current={selected}
        className={`flex w-full flex-col gap-1 border-b border-zinc-200 px-3 py-2.5 text-left transition ${selected ? 'bg-indigo-50' : 'hover:bg-zinc-100'}`}
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{accountLabel(account)}</span>
          {isBanned(account, Date.now()) && <span className={badge('red')}>Banned</span>}
          <span className={`${badge(account.anonymous ? 'neutral' : 'indigo')} ml-auto`}>{account.anonymous ? 'Anonymous' : 'Email'}</span>
        </span>
        <span className="truncate text-xs text-zinc-500">
          {account.handle && account.email ? `${account.email} · ` : ''}{account.saveCount} save{account.saveCount === 1 ? '' : 's'}
        </span>
      </button>
    </li>
  )
}

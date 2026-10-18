import { useState } from 'react'
import { setBanned, type AdminClient } from '../api/supabaseAdmin'
import { accountLabel, isBanned, type AccountSummary } from '../domain/accounts'
import { badge, button } from './styles'
import { TypedConfirmDialog } from './TypedConfirmDialog'

interface Props {
  client: AdminClient
  account: AccountSummary
  onChanged: () => void
}

export function BanControl({ client, account, onChanged }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const banned = isBanned(account, Date.now())

  const apply = async () => {
    setConfirming(false)
    setError('')
    try {
      await setBanned(client, account.id, !banned)
      onChanged()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className={badge(banned ? 'red' : 'green')}>{banned ? 'Banned' : 'Active'}</span>
        <button className={button(banned ? 'secondary' : 'danger')} onClick={() => setConfirming(true)}>{banned ? 'Unban' : 'Ban'}</button>
      </div>
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
      {confirming && (
        <TypedConfirmDialog
          title={banned ? 'Unban account' : 'Ban account'}
          message={banned ? 'The player can sign in and sync again.' : 'The player can no longer sign in or refresh their session.'}
          expected={accountLabel(account)}
          confirm={banned ? 'Unban' : 'Ban'}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void apply()}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { exportAccount } from '../api/exportAccount'
import type { ExportProgress } from '../api/exportDatabase'
import type { AdminClient } from '../api/supabaseAdmin'
import { accountLabel, type AccountSummary } from '../domain/accounts'
import { downloadBlob } from '../domain/downloadBlob'
import { button } from './styles'

interface Props {
  client: AdminClient
  account: AccountSummary
}

function fileNameOf(account: AccountSummary): string {
  const day = new Date().toISOString().slice(0, 10)
  const label = accountLabel(account).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `account-${label || account.id}-${day}.json`
}

export function ExportAccountButton({ client, account }: Props) {
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setProgress({ table: 'auth.users', rows: 0 })
    try {
      downloadBlob(await exportAccount(client, account.id, setProgress), fileNameOf(account))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button className={button('ghost')} disabled={progress !== null} onClick={run} title="Download every item of this account: auth user, profile, saves, messages, bug reports…">
        {progress ? `Exporting ${progress.table} (${progress.rows})…` : '⤓ Export all data'}
      </button>
      {error && <span className="text-xs text-red-600" role="alert">{error}</span>}
    </div>
  )
}

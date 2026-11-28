import { useState } from 'react'
import { exportDatabase, type ExportProgress } from '../api/exportDatabase'
import { createAdminClient } from '../api/supabaseAdmin'
import { downloadBlob } from '../domain/downloadBlob'
import { isLocalUrl, type Profile } from '../domain/profiles'
import { button } from './styles'

interface Props {
  profile: Profile
}

function fileNameOf(profile: Profile): string {
  const day = new Date().toISOString().slice(0, 10)
  return `${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export-${day}.json`
}

export function ExportButton({ profile }: Props) {
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setError(null)
    setProgress({ table: 'auth.users', rows: 0 })
    try {
      const blob = await exportDatabase(createAdminClient(profile), setProgress)
      downloadBlob(blob, fileNameOf(profile))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setProgress(null)
    }
  }

  return (
    <>
      {error && <span className="text-xs text-red-600" role="alert">{error}</span>}
      <button className={button('ghost')} disabled={progress !== null} onClick={run} title={isLocalUrl(profile.url) ? 'Export the local database' : 'Export the whole database of this project'}>
        {progress ? `Exporting ${progress.table} (${progress.rows})…` : '⤓ Export database'}
      </button>
    </>
  )
}

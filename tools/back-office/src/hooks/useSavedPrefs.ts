import { useCallback, useEffect, useState } from 'react'
import { loadLatestSavedPrefs, type AdminClient } from '../api/supabaseAdmin'
import { windowOf } from '../domain/dateFilter'
import type { LatestSavedPrefs } from '../domain/savedPrefsTable'
import { useDateFilter } from '../store/dateFilterStore'

export type SavedPrefsState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; saves: LatestSavedPrefs[] }

export function useSavedPrefs(client: AdminClient) {
  const filter = useDateFilter(store => store.filter)
  const [state, setState] = useState<SavedPrefsState>({ kind: 'loading' })

  const reload = useCallback(() => {
    setState({ kind: 'loading' })
    loadLatestSavedPrefs(client, windowOf(filter, Date.now()))
      .then(saves => setState({ kind: 'ready', saves }))
      .catch(error => setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
  }, [client, filter])

  useEffect(reload, [reload])

  return { state, reload }
}

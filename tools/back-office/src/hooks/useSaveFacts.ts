import { useCallback, useEffect, useState } from 'react'
import { loadLatestSaveFacts, type AdminClient, type FactsProgress, type LoadedFacts } from '../api/supabaseAdmin'
import { windowOf } from '../domain/dateFilter'
import { useDateFilter } from '../store/dateFilterStore'

export type SaveFactsState = { kind: 'loading'; progress: FactsProgress | null } | { kind: 'error'; message: string } | { kind: 'ready'; facts: LoadedFacts }

export function useSaveFacts(client: AdminClient) {
  const filter = useDateFilter(store => store.filter)
  const [state, setState] = useState<SaveFactsState>({ kind: 'loading', progress: null })

  const reload = useCallback(() => {
    setState({ kind: 'loading', progress: null })
    loadLatestSaveFacts(client, windowOf(filter, Date.now()), progress => setState(current => (current.kind === 'loading' ? { kind: 'loading', progress } : current)))
      .then(facts => setState({ kind: 'ready', facts }))
      .catch(error => setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) }))
  }, [client, filter])

  useEffect(reload, [reload])

  return { state, reload }
}

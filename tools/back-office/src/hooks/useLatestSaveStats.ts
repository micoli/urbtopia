import { useEffect, useState } from 'react'
import { loadLatestSaveStats, type AdminClient } from '../api/supabaseAdmin'
import type { SaveStats } from '../domain/saveStats'

const CHUNK_SIZE = 20

export function useLatestSaveStats(client: AdminClient, userIds: string[]): Map<string, SaveStats> {
  const [known, setKnown] = useState<Map<string, SaveStats>>(new Map())
  const key = userIds.join(',')

  useEffect(() => {
    let current = true
    const missing = userIds.filter(id => !known.has(id))
    const load = async () => {
      for (let from = 0; from < missing.length && current; from += CHUNK_SIZE) {
        const loaded = await loadLatestSaveStats(client, missing.slice(from, from + CHUNK_SIZE))
        if (current) setKnown(previous => new Map([...previous, ...loaded]))
      }
    }
    load().catch(() => {})
    return () => {
      current = false
    }
  }, [client, key])

  return known
}

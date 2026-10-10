import { useCallback } from 'react'
import { saveDefinitions } from '../api'
import { useDocument } from '../store/documentStore'
import { useProblems } from './useProblems'

export function useSave(): () => Promise<void> {
  const problems = useProblems()
  return useCallback(async () => {
    const { doc, markSaved, setStatus } = useDocument.getState()
    if (problems.all.length) return setStatus(`Not saved: ${problems.all.length} problem${problems.all.length > 1 ? 's' : ''} to fix first`)
    setStatus('Saving…')
    const error = await saveDefinitions(doc)
    if (error) return setStatus(`Not saved: ${error}`)
    markSaved()
    setStatus('Saved')
  }, [problems])
}

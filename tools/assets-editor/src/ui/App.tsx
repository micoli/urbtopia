import { useEffect, useState } from 'react'
import { fetchCatalog } from '../api'
import { useDocument } from '../store/documentStore'
import { Shell } from './Shell'

export function App() {
  const load = useDocument(state => state.load)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCatalog()
      .then(catalog => {
        load(catalog)
        setReady(true)
      })
      .catch(reason => setError(String(reason)))
  }, [load])

  if (error) return <div className="p-6 text-sm text-red-700">Cannot load the catalog: {error}</div>
  if (!ready) return <div className="p-6 text-sm text-zinc-500">Loading the catalog…</div>
  return <Shell />
}

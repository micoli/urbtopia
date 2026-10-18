import { useState, type FormEvent } from 'react'
import { DEFAULT_GAME_URL, DEFAULT_URL, useConnection } from '../store/connectionStore'
import { button, input, panel } from './styles'

export function ConnectionScreen() {
  const connect = useConnection(state => state.connect)
  const [url, setUrl] = useState(DEFAULT_URL)
  const [serviceKey, setServiceKey] = useState('')
  const [gameUrl, setGameUrl] = useState(DEFAULT_GAME_URL)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    connect({ url, serviceKey, gameUrl })
  }

  return (
    <main className="grid min-h-full place-items-center p-6">
      <form onSubmit={submit} className={`${panel} flex w-[min(30rem,100%)] flex-col gap-4 p-6 shadow-sm`}>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Urbtopia Back office</h1>
          <p className="text-sm text-zinc-500">Connect to a Supabase project with its service key.</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Supabase URL
          <input className={input} value={url} onChange={event => setUrl(event.target.value)} placeholder={DEFAULT_URL} required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Service role key
          <input className={input} type="password" value={serviceKey} onChange={event => setServiceKey(event.target.value)} autoComplete="off" required />
          <span className="text-xs font-normal text-zinc-500">Kept in this browser's local storage only. It bypasses row-level security: never share this page's origin.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Game URL
          <input className={input} value={gameUrl} onChange={event => setGameUrl(event.target.value)} placeholder={DEFAULT_GAME_URL} required />
          <span className="text-xs font-normal text-zinc-500">Development server of the game, used to open a save.</span>
        </label>
        <button type="submit" className={button('primary')}>Connect</button>
      </form>
    </main>
  )
}

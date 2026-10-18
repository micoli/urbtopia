import type { SaveRevision } from '../api/supabaseAdmin'
import { SaveRow } from './SaveRow'

interface Props {
  saves: SaveRevision[]
  handle: string | null
  accountId: string
  gameUrl: string
}

export function SaveList({ saves, handle, accountId, gameUrl }: Props) {
  if (saves.length === 0) return <p className="text-sm text-zinc-500">No Cloud save.</p>
  return (
    <ul className="flex flex-col divide-y divide-zinc-200">
      {saves.map(save => (
        <SaveRow key={save.revision} save={save} handle={handle} accountId={accountId} gameUrl={gameUrl} />
      ))}
    </ul>
  )
}

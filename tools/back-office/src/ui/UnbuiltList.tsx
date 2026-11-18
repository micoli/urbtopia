import type { UnbuiltKind } from '../domain/dashboard'

interface Props {
  kinds: UnbuiltKind[]
}

// The buildings no City of the period has: dead content, or content nobody reaches.
export function UnbuiltList({ kinds }: Props) {
  if (kinds.length === 0) return <p className="text-xs text-zinc-500">Every building has been built at least once.</p>
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {kinds.map(entry => (
        <li key={entry.kind}>
          <details>
            <summary className="flex cursor-pointer items-center gap-2 py-0.5">
              <span className="font-medium text-zinc-700">{entry.kind}</span>
              <span className="ml-auto tabular-nums text-zinc-600">{entry.ids.length} of {entry.total} never built</span>
            </summary>
            <p className="py-1 pl-3 leading-relaxed text-zinc-500">{entry.ids.join(', ')}</p>
          </details>
        </li>
      ))}
    </ul>
  )
}

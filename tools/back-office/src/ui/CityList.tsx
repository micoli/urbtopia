import type { SaveRevision } from '../api/supabaseAdmin'
import type { CityGroup } from '../domain/cityGroups'
import { formatNumber } from '../domain/format'
import { SaveList } from './SaveList'

interface Props {
  cities: CityGroup<SaveRevision>[]
  handle: string | null
  accountId: string
  onOpen: (save: SaveRevision) => void
}

export function CityList({ cities, handle, accountId, onOpen }: Props) {
  if (cities.length === 0) return <p className="text-sm text-zinc-500">No Cloud save.</p>
  return (
    <ul className="flex flex-col gap-4">
      {cities.map(city => (
        <li key={city.cityId} className="flex flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">{city.name}</h4>
            {city.latest.stats.readable && <span className="text-xs text-zinc-600">Citizens <b>{formatNumber(city.latest.stats.citizens)}</b></span>}
            <span className="text-xs text-zinc-500">{city.saves.length} {city.saves.length === 1 ? 'revision' : 'revisions'}</span>
          </header>
          <SaveList saves={city.saves} handle={handle} accountId={accountId} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

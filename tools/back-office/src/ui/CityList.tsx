import type { AdminClient, OnlineCityGroup, SaveRevision } from '../api/supabaseAdmin'
import { formatNumber } from '../domain/format'
import { CityNameReset } from './CityNameReset'
import { SaveList } from './SaveList'

interface Props {
  client: AdminClient
  cities: OnlineCityGroup[]
  handle: string | null
  accountId: string
  onOpen: (save: SaveRevision) => void
  onChanged: () => void
}

export function CityList({ client, cities, handle, accountId, onOpen, onChanged }: Props) {
  if (cities.length === 0) return <p className="text-sm text-zinc-500">No Cloud save.</p>
  return (
    <ul className="flex flex-col gap-4">
      {cities.map(city => (
        <li key={city.cityId} className="flex flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-2">
            <h4 className="text-sm font-semibold text-zinc-900">{city.onlineName ?? city.name}</h4>
            {city.latest.stats.readable && <span className="text-xs text-zinc-600">Citizens <b>{formatNumber(city.latest.stats.citizens)}</b></span>}
            {city.onlineName !== null && <CityNameReset client={client} userId={accountId} cityId={city.cityId} onlineName={city.onlineName} defaultName={city.name} onChanged={onChanged} />}
            <span className="text-xs text-zinc-500">{city.saves.length} {city.saves.length === 1 ? 'revision' : 'revisions'}</span>
          </header>
          <SaveList saves={city.saves} handle={handle} accountId={accountId} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

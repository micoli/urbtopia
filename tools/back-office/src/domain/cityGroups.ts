import { parseEnvelope } from '../../../../src/persistence/envelope'
import { cityNameFromSeed } from '../../../../src/persistence/cities'
import type { SaveStats } from './saveStats'

export interface CitySave {
  cityId: string
  revision: number
  stats: SaveStats
  envelope: unknown
}

export interface CityGroup<Save extends CitySave> {
  cityId: string
  name: string
  latest: Save
  saves: Save[]
}

// The Seed-based default name of a City, read from the newest save of it that this game version can read.
export function defaultCityName(saves: readonly CitySave[]): string {
  for (const save of saves) {
    if (!save.stats.readable) continue
    const parsed = parseEnvelope(JSON.stringify(save.envelope))
    if (parsed.ok) return cityNameFromSeed(parsed.state.seed)
  }
  return 'Unreadable city'
}

// One group per City, newest revision first inside a group, the biggest City first.
export function groupByCity<Save extends CitySave>(saves: readonly Save[]): CityGroup<Save>[] {
  const byCity = new Map<string, Save[]>()
  for (const save of saves) byCity.set(save.cityId, [...(byCity.get(save.cityId) ?? []), save])
  const citizens = (group: CityGroup<Save>) => (group.latest.stats.readable ? group.latest.stats.citizens : -1)
  return [...byCity].map(([cityId, group]): CityGroup<Save> => {
    const sorted = [...group].sort((a, b) => b.revision - a.revision)
    return { cityId, name: defaultCityName(sorted), latest: sorted[0]!, saves: sorted }
  }).sort((a, b) => citizens(b) - citizens(a))
}

// The account's biggest City stands for it where one figure is needed.
export function biggestCityStats(saves: readonly CitySave[]): SaveStats | null {
  const latestOfEach = groupByCity(saves).map(group => group.latest.stats)
  const readable = latestOfEach.filter((stats): stats is Extract<SaveStats, { readable: true }> => stats.readable)
  if (readable.length > 0) return readable.reduce((best, stats) => (stats.citizens > best.citizens ? stats : best))
  return latestOfEach[0] ?? null
}

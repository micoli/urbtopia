import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { biggestCityStats, defaultCityName, groupByCity, type CitySave } from './cityGroups'
import { statsOfEnvelope } from './saveStats'

const fixture = JSON.parse(readFileSync(new URL('../../../../src/persistence/fixtures/save-v16.json', import.meta.url), 'utf8'))
const withoutHomes = { ...fixture, state: { ...fixture.state, buildings: fixture.state.buildings.filter((building: { type: string }) => building.type !== 'home') } }

const save = (cityId: string, revision: number, envelope: unknown = fixture): CitySave => ({ cityId, revision, stats: statsOfEnvelope(envelope), envelope })
const unreadable = (cityId: string, revision: number): CitySave => save(cityId, revision, { format: 'other' })

describe('defaultCityName', () => {
  it('names a City after the Seed of its newest readable save', () => {
    expect(defaultCityName([unreadable('a', 3), save('a', 2)])).toBe('Services Compatibility')
  })

  it('says so when no save can be read', () => {
    expect(defaultCityName([unreadable('a', 1)])).toBe('Unreadable city')
  })
})

describe('groupByCity', () => {
  it('groups the revisions of each City, newest first', () => {
    const groups = groupByCity([save('a', 1), save('b', 5), save('a', 2)])
    expect(groups.map((group) => [group.cityId, group.saves.map((s) => s.revision)]).sort()).toEqual([['a', [2, 1]], ['b', [5]]])
    expect(groups.find((group) => group.cityId === 'a')?.latest.revision).toBe(2)
  })

  it('puts the biggest City first and the unreadable ones last', () => {
    const groups = groupByCity([unreadable('x', 9), save('small', 1, withoutHomes), save('big', 1)])
    expect(groups.map((group) => group.cityId)).toEqual(['big', 'small', 'x'])
  })
})

describe('biggestCityStats', () => {
  it('stands for the account with its biggest City', () => {
    const stats = biggestCityStats([save('small', 1, withoutHomes), save('big', 1)])
    expect(stats).toEqual(statsOfEnvelope(fixture))
  })

  it('is null without any save', () => {
    expect(biggestCityStats([])).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { newGame } from '../../../../src/core'
import { serializeEnvelope } from '../../../../src/persistence/envelope'
import { factsOfSave } from './saveFacts'

const meta = { userId: 'u', cityId: 'c', cityIds: ['c'], formatVersion: 19, savedAt: '2026-11-19T10:00:00Z' }
const envelopeOf = (prefs?: Record<string, unknown>) => JSON.parse(serializeEnvelope(newGame({ seed: 'amber-fox-4821', now: 1_700_000_000_000 }), 1_700_000_000_000, prefs)) as unknown

describe('factsOfSave', () => {
  it('reads the city and the preferences of a readable save', () => {
    const facts = factsOfSave(meta, envelopeOf({ language: 'fr', futureKey: [1] }))
    expect(facts.prefs).toEqual({ language: 'fr', futureKey: [1] })
    expect(facts.city).toMatchObject({ readable: true, facts: { difficulty: 'cozy', hasPolitics: false, hasChallenge: false } })
    expect(facts.size).toBeGreaterThan(0)
  })

  it('counts the building types and spots the features of the city', () => {
    const facts = factsOfSave(meta, envelopeOf())
    expect(facts.city.readable && facts.city.facts.content).toMatchObject({ buildingTypes: expect.any(Object), features: { rails: false, market: false, trade: false } })
  })

  it('still gives the preferences of a save the game cannot read', () => {
    const facts = factsOfSave(meta, { format: 'urbtopia-save', version: 9999, savedAt: 1, state: {}, prefs: { language: 'fr' } })
    expect(facts.city).toEqual({ readable: false, reason: 'newer-version' })
    expect(facts.prefs).toEqual({ language: 'fr' })
  })

  it.each([[null], ['text'], [[1]]])('does not fail on an envelope that is %j', (envelope) => {
    expect(factsOfSave(meta, envelope).city.readable).toBe(false)
    expect(factsOfSave(meta, envelope).prefs).toEqual({})
  })
})

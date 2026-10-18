import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { statsOfEnvelope } from './saveStats'

const fixture = JSON.parse(readFileSync(new URL('../../../../src/persistence/fixtures/save-v14.json', import.meta.url), 'utf8'))

describe('statsOfEnvelope', () => {
  it('summarises a readable save', () => {
    const stats = statsOfEnvelope(fixture)
    expect(stats.readable).toBe(true)
    if (!stats.readable) return
    expect(stats.urbs).toBe(fixture.state.urbs)
    expect(stats.buildings).toBe(fixture.state.buildings.length)
    expect(stats.savedAt).toBe(fixture.savedAt)
  })

  it('reports why a save cannot be read', () => {
    expect(statsOfEnvelope({ format: 'other' })).toEqual({ readable: false, reason: 'wrong-format' })
    expect(statsOfEnvelope({ ...fixture, version: 9999 })).toEqual({ readable: false, reason: 'newer-version' })
  })
})

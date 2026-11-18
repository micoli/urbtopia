import { difficultyOf, totalCitizens, type Difficulty } from '../../../../src/core'
import { parseEnvelope, type ParseFailure } from '../../../../src/persistence/envelope'
import { prefsOfSave } from './savedPrefsTable'

export interface SaveMeta {
  userId: string
  cityIds: readonly string[]
  formatVersion: number
  savedAt: string
}

export interface CityFacts {
  citizens: number
  urbs: number
  buildings: number
  parcels: number
  difficulty: Difficulty
  // The Tutorial step the Player stopped at, or null when the Tutorial is over.
  tutorialStep: string | null
  hasPolitics: boolean
  hasChallenge: boolean
}

export interface SaveFacts extends SaveMeta {
  size: number
  prefs: Record<string, unknown>
  city: { readable: true; facts: CityFacts } | { readable: false; reason: ParseFailure }
}

// The preferences are read from the envelope as stored, so an unreadable state still gives them.
export function factsOfSave(meta: SaveMeta, envelope: unknown): SaveFacts {
  const text = JSON.stringify(envelope)
  const prefs = prefsOfSave(typeof envelope === 'object' && envelope !== null ? (envelope as { prefs?: unknown }).prefs : undefined)
  const parsed = parseEnvelope(text)
  if (!parsed.ok) return { ...meta, size: text.length, prefs, city: { readable: false, reason: parsed.reason } }
  const { state } = parsed
  return {
    ...meta,
    size: text.length,
    prefs,
    city: {
      readable: true,
      facts: {
        citizens: totalCitizens(state),
        urbs: state.urbs,
        buildings: state.buildings.length,
        parcels: state.ownedParcels.length,
        difficulty: difficultyOf(state),
        tutorialStep: state.tutorial,
        hasPolitics: state.politics !== undefined,
        hasChallenge: state.challenge !== undefined,
      },
    },
  }
}

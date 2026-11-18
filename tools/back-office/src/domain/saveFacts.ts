import { difficultyOf, totalCitizens, type Difficulty } from '../../../../src/core'
import { parseEnvelope, type ParseFailure } from '../../../../src/persistence/envelope'
import { FEATURES } from './contentFeatures'
import { prefsOfSave } from './savedPrefsTable'

export interface SaveMeta {
  userId: string
  // The City this save belongs to, and every City of the user.
  cityId: string
  cityIds: readonly string[]
  formatVersion: number
  savedAt: string
}

// What the City holds, by building type and by feature: the ground of the content indicators.
export interface CityContent {
  buildingTypes: Record<string, number>
  features: Record<string, boolean>
}

export interface CityFacts {
  content: CityContent
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
        content: {
          buildingTypes: countTypes(state.buildings.map(building => building.type)),
          features: Object.fromEntries(FEATURES.map(feature => [feature.id, feature.present(state)])),
        },
      },
    },
  }
}

function countTypes(types: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const type of types) counts[type] = (counts[type] ?? 0) + 1
  return counts
}

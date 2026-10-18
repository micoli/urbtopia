import { totalCitizens } from '../../../../src/core'
import { parseEnvelope, type ParseFailure } from '../../../../src/persistence/envelope'

export type SaveStats =
  | { readable: true; citizens: number; urbs: number; buildings: number; parcels: number; lastSeen: number; savedAt: number }
  | { readable: false; reason: ParseFailure }

export function statsOfEnvelope(envelope: unknown): SaveStats {
  const parsed = parseEnvelope(JSON.stringify(envelope))
  if (!parsed.ok) return { readable: false, reason: parsed.reason }
  const { state, savedAt } = parsed
  return {
    readable: true,
    citizens: totalCitizens(state),
    urbs: state.urbs,
    buildings: state.buildings.length,
    parcels: state.ownedParcels.length,
    lastSeen: state.lastSeen,
    savedAt,
  }
}

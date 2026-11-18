import type { GameState } from '../../../../src/core'

export interface Feature {
  id: string
  label: string
  group: string
  present: (state: GameState) => boolean
}

const some = (items: readonly unknown[] | undefined): boolean => (items?.length ?? 0) > 0

export const FEATURES: readonly Feature[] = [
  { id: 'rails', label: 'Rails', group: 'Transport', present: state => some(state.rails) },
  { id: 'tunnels', label: 'Metro tunnels', group: 'Transport', present: state => some(state.tunnels) },
  { id: 'brt', label: 'BRT roads', group: 'Transport', present: state => some(state.brtRoads) },
  { id: 'busLines', label: 'Bus lines', group: 'Transport', present: state => some(state.busLines) },
  { id: 'transitLines', label: 'Transit lines', group: 'Transport', present: state => some(state.transitLines) },
  { id: 'boats', label: 'Boats', group: 'Transport', present: state => some(state.boats) },
  { id: 'bridges', label: 'Bridges', group: 'Transport', present: state => some(state.bridges) },
  { id: 'fields', label: 'Fields (farming)', group: 'Economy and land', present: state => some(state.fields) },
  { id: 'market', label: 'Market unlocked', group: 'Economy and land', present: state => state.marketUnlocked },
  { id: 'trade', label: 'Trade ledger entries', group: 'Economy and land', present: state => some(state.tradeLedger) },
  { id: 'donations', label: 'Solidarity donations', group: 'Economy and land', present: state => some(state.donations) },
]

import type { BuildingKind, FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { BUILD_SECTION_TITLES, type BuildSection } from '../../../../src/core/buildings/buildSections'
import type { ModelEntry } from '../../../../src/core/models/modelSchema'
import type { Doc } from './documentStore'

export const sectionOf = (building: FlatBuilding): BuildSection =>
  building.kind === 'nature' ? (building.family === 'decoration' ? 'build.decoration' : 'build.greenSpaces') : (building.section ?? BUILD_SECTION_TITLES[0])

export const setBuilding = (doc: Doc, id: string, building: FlatBuilding): Doc => ({ ...doc, buildings: { ...doc.buildings, [id]: building } })

export const removeBuilding = (doc: Doc, id: string): Doc => ({ ...doc, buildings: Object.fromEntries(Object.entries(doc.buildings).filter(([key]) => key !== id)) })

export function insertBuildingAfter(doc: Doc, afterId: string | undefined, id: string, building: FlatBuilding): Doc {
  const entries = Object.entries(doc.buildings)
  const index = afterId ? entries.findIndex(([key]) => key === afterId) : -1
  const at = index < 0 ? entries.length : index + 1
  return { ...doc, buildings: Object.fromEntries([...entries.slice(0, at), [id, building], ...entries.slice(at)]) }
}

// The members of a section take the positions they already held, in their new order: other sections keep their place.
export function reorderSection(doc: Doc, orderedIds: readonly string[]): Doc {
  const members = new Set(orderedIds)
  const queue = [...orderedIds]
  const ids = Object.keys(doc.buildings).map(id => (members.has(id) ? queue.shift()! : id))
  return { ...doc, buildings: Object.fromEntries(ids.map(id => [id, doc.buildings[id]!])) }
}

export const toggleRetired = ({ retired, ...building }: FlatBuilding): FlatBuilding => (retired ? building : { ...building, retired: true })

export const setModel = (doc: Doc, id: string, model: ModelEntry): Doc => ({ ...doc, models: { ...doc.models, [id]: model } })

export const removeModel = (doc: Doc, id: string): Doc => ({ ...doc, models: Object.fromEntries(Object.entries(doc.models).filter(([key]) => key !== id)) })

const PLACED_DEFAULTS = { footprint: [1, 1] as [number, number], cost: 0, unlockCitizens: 0, requiresRoad: true }

export function blankBuilding(kind: BuildingKind, model: string): FlatBuilding {
  const name = { en: '', fr: '' }
  if (kind === 'nature') return { kind, model, name, family: 'decoration' }
  if (kind === 'sport') return { kind, model, name, section: 'build.sport', ...PLACED_DEFAULTS, radius: 1, wellbeingBonus: 0 }
  return { kind, model, name, section: 'build.production', ...PLACED_DEFAULTS }
}

// Switching kind keeps what both kinds share and fills what the new one requires.
export function convertBuilding(building: FlatBuilding, kind: BuildingKind): FlatBuilding {
  const { model, name, description, retired } = building
  const shared = { model, name, ...(description ? { description } : {}), ...(retired ? { retired } : {}) }
  const blank = blankBuilding(kind, model)
  if (kind === 'nature') return { ...blank, ...shared }
  const placed = { section: building.section ?? blank.section, footprint: building.footprint ?? PLACED_DEFAULTS.footprint, cost: building.cost ?? 0, unlockCitizens: building.unlockCitizens ?? 0, requiresRoad: building.requiresRoad ?? true, ...(building.accessModes ? { accessModes: building.accessModes } : {}), ...(building.initialSlots !== undefined ? { initialSlots: building.initialSlots } : {}) }
  return { ...blank, ...placed, ...shared, kind }
}

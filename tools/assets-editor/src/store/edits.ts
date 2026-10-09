import type { BuildingKind, FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { resolveTiers } from '../../../../src/core/buildings/tiers'
import { BUILD_SECTION_TITLES, type BuildSection } from '../../../../src/core/buildings/buildSections'
import type { ModelEntry } from '../../../../src/core/models/modelSchema'
import type { CollectionName, Definition } from '../../../../scripts/collections'
import type { SingletonName } from '../../../../scripts/singletons'
import type { Doc } from './documentStore'

export const definitionsOf = (doc: Doc, collection: CollectionName): Record<string, Definition> => doc.collections[collection]

const withCollection = (doc: Doc, collection: CollectionName, definitions: Record<string, Definition>): Doc => ({ ...doc, collections: { ...doc.collections, [collection]: definitions } })

export const setDefinition = (doc: Doc, collection: CollectionName, id: string, definition: Definition): Doc => withCollection(doc, collection, { ...definitionsOf(doc, collection), [id]: definition })

export const removeDefinition = (doc: Doc, collection: CollectionName, id: string): Doc =>
  withCollection(doc, collection, Object.fromEntries(Object.entries(definitionsOf(doc, collection)).filter(([key]) => key !== id)))

export function insertDefinitionAfter(doc: Doc, collection: CollectionName, afterId: string | undefined, id: string, definition: Definition): Doc {
  const entries = Object.entries(definitionsOf(doc, collection))
  const index = afterId ? entries.findIndex(([key]) => key === afterId) : -1
  const at = index < 0 ? entries.length : index + 1
  return withCollection(doc, collection, Object.fromEntries([...entries.slice(0, at), [id, definition], ...entries.slice(at)]))
}

// The members of a group take the positions they already held, in their new order: other groups keep their place.
export function reorderGroup(doc: Doc, collection: CollectionName, orderedIds: readonly string[]): Doc {
  const definitions = definitionsOf(doc, collection)
  const members = new Set(orderedIds)
  const queue = [...orderedIds]
  const ids = Object.keys(definitions).map(id => (members.has(id) ? queue.shift()! : id))
  return withCollection(doc, collection, Object.fromEntries(ids.map(id => [id, definitions[id]!])))
}

export const setSingleton = (doc: Doc, name: SingletonName, value: Record<string, unknown>): Doc => ({ ...doc, singletons: { ...doc.singletons, [name]: value } })

export const setModel = (doc: Doc, id: string, model: ModelEntry): Doc => ({ ...doc, models: { ...doc.models, [id]: model } })

export const removeModel = (doc: Doc, id: string): Doc => ({ ...doc, models: Object.fromEntries(Object.entries(doc.models).filter(([key]) => key !== id)) })

export { setIn } from '../../../../scripts/paths'

export const toggleRetired = ({ retired, ...definition }: Definition): Definition => (retired ? definition : { ...definition, retired: true })

export const sectionOf = (building: FlatBuilding): BuildSection =>
  building.kind === 'nature' ? (building.family === 'decoration' ? 'build.decoration' : 'build.greenSpaces') : (building.section ?? BUILD_SECTION_TITLES[0])

// The list groups of a collection: build menu sections for buildings, one group otherwise.
export const groupOf = (collection: CollectionName, definition: Definition): string => (collection === 'buildings' ? sectionOf(definition as unknown as FlatBuilding) : collection)

const PLACED_DEFAULTS = { footprint: [1, 1] as [number, number], cost: 0, unlockCitizens: 0, requiresRoad: true }

// What Tier 1 of a kind with Tiers needs besides its model and footprint.
const TIER_ONE: Partial<Record<BuildingKind, Record<string, number>>> = {
  home: { citizens: 1, power: 1, water: 1 },
  production: { durationFactor: 1, maxSlots: 2, yield: 1 },
  farm: { seedCapacity: 10, fieldCap: 4 },
  storage: { materials: 0, goods: 0, crops: 0 },
}

const SECTIONS: Partial<Record<BuildingKind, BuildSection>> = { home: 'build.housing', sport: 'build.sport', storage: 'build.storage' }

export function blankBuilding(kind: BuildingKind, model: string): FlatBuilding {
  const name = { en: '', fr: '' }
  if (kind === 'nature') return { kind, model, name, family: 'decoration' }
  const sited = { section: SECTIONS[kind] ?? 'build.production', cost: 0, unlockCitizens: 0, requiresRoad: true }
  const tierOne = TIER_ONE[kind]
  if (tierOne) return { kind, name, ...sited, tiers: [{ model, footprint: PLACED_DEFAULTS.footprint, ...tierOne }] } as FlatBuilding
  if (kind === 'sport') return { kind, model, name, ...sited, footprint: PLACED_DEFAULTS.footprint, radius: 1, wellbeingBonus: 0 }
  return { kind, model, name, ...sited, footprint: PLACED_DEFAULTS.footprint }
}

const name = { en: '', fr: '' }

// What a new Game object of each collection starts from; its form shows what is still missing.
export function blankDefinition(collection: CollectionName, model: string): Definition {
  if (collection === 'buildings') return blankBuilding('standard', model) as unknown as Definition
  if (collection === 'materials') return { kind: 'material', name, producedBy: 'workshop', durationMinutes: 1, unlockCitizens: 0, minTier: 1 }
  if (collection === 'goods') return { kind: 'good', name, recipe: {}, durationMinutes: 1, value: 0, unlockCitizens: 0, minTier: 1 }
  return { kind: 'crop', name, growthMinutes: 1, water: 1, yield: 1, seedShare: 0.5, seedPrice: 1, unlockCitizens: 0, packingMinutes: 1, packedValue: 0, models: { growth: [model, model, model, model] } }
}

// Switching kind keeps what both kinds share and fills what the new one requires.
export function convertBuilding(building: FlatBuilding, kind: BuildingKind): FlatBuilding {
  const { name: text, description, retired } = building
  const [firstTier] = resolveTiers<NonNullable<FlatBuilding['tiers']>[number]>(building.tiers ?? [])
  const model = building.model ?? firstTier?.model ?? ''
  const footprint = building.footprint ?? firstTier?.footprint ?? PLACED_DEFAULTS.footprint
  const shared = { name: text, ...(description ? { description } : {}), ...(retired ? { retired } : {}) }
  const blank = blankBuilding(kind, model)
  if (kind === 'nature') return { ...blank, ...shared, model }
  const placed = { section: building.section ?? blank.section, cost: building.cost ?? 0, unlockCitizens: building.unlockCitizens ?? 0, requiresRoad: building.requiresRoad ?? true, ...(building.accessModes ? { accessModes: building.accessModes } : {}), ...(building.initialSlots !== undefined ? { initialSlots: building.initialSlots } : {}) }
  if (blank.tiers) return { ...blank, ...placed, ...shared, tiers: [{ ...blank.tiers[0], model, footprint }] }
  return { ...blank, ...placed, ...shared, model, footprint, kind }
}

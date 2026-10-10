import { BUILDING_KINDS } from '../../../../../src/core/buildings/buildingSchema'
import type { BuildingKind } from '../../../../../src/core/buildings/buildingDefinition'
import { resolveTiers } from '../../../../../src/core/buildings/tiers'
import type { Definition } from '../../../../../scripts/collections'
import { setIn } from '../../../../../scripts/paths'
import { buildingFieldsOf, labelOf } from '../../schema/fields'

export const UPGRADE_COST = 'upgradeCost'

export interface ComparableField {
  key: string
  label: string
  integer: boolean
}

export interface Cell {
  value: number | undefined
  // Set on the Tier itself rather than inherited from the previous one.
  own: boolean
}

export interface Row {
  id: string
  name: string
  retired: boolean
  cells: Cell[]
}

type Tier = Record<string, unknown>

const tiersOf = (definition: Definition): Tier[] => (definition.tiers as Tier[] | undefined) ?? []

export const comparableFieldsOf = (kind: BuildingKind): ComparableField[] => {
  const tiers = buildingFieldsOf(kind).find(field => field.key === 'tiers')
  if (tiers?.type !== 'list') return []
  const numbers = tiers.fields.flatMap(field => (field.type === 'number' ? [{ key: field.key, label: labelOf(field.key), integer: field.integer }] : []))
  return [...numbers, { key: UPGRADE_COST, label: 'Upgrade cost (Urbs)', integer: true }]
}

// Kinds whose objects grow through Tiers.
export const COMPARABLE_KINDS = BUILDING_KINDS.filter(kind => comparableFieldsOf(kind).length > 0)

function cellsOf(definition: Definition, field: string): Cell[] {
  const own = tiersOf(definition)
  const resolved = resolveTiers<Tier>(own)
  return resolved.map((tier, index) => {
    if (field === UPGRADE_COST) return { value: (own[index]?.upgradeCost as { urbs?: number } | undefined)?.urbs, own: true }
    return { value: tier[field] as number | undefined, own: own[index]?.[field] !== undefined }
  })
}

export const rowsOf = (definitions: Record<string, Definition>, kind: BuildingKind, field: string): Row[] =>
  Object.entries(definitions)
    .filter(([, definition]) => definition.kind === kind)
    .map(([id, definition]) => ({ id, name: (definition.name as { en?: string } | undefined)?.en || id, retired: definition.retired === true, cells: cellsOf(definition, field) }))

export function withCell(definition: Definition, field: string, tier: number, value: number): Definition {
  if (field === UPGRADE_COST) {
    const current = (tiersOf(definition)[tier]?.upgradeCost ?? {}) as Record<string, unknown>
    return setIn(definition, ['tiers', tier, UPGRADE_COST], { ...current, urbs: value }) as Definition
  }
  return setIn(definition, ['tiers', tier, field], value) as Definition
}

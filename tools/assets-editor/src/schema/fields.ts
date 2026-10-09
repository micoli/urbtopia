import { z } from 'zod'
import type { BuildingKind } from '../../../../src/core/buildings/buildingDefinition'
import { buildingSchema } from '../../../../src/core/buildings/buildingSchema'
import { modelSchema } from '../../../../src/core/models/modelSchema'

interface JsonSchema {
  type?: string
  const?: unknown
  enum?: string[]
  minimum?: number
  exclusiveMinimum?: number
  pattern?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  prefixItems?: JsonSchema[]
  items?: JsonSchema | false
  oneOf?: JsonSchema[]
}

interface Base {
  key: string
  label: string
  required: boolean
}

export type FieldSpec = Base &
  (
    | { type: 'text'; readOnly?: boolean }
    | { type: 'model' }
    | { type: 'number'; integer: boolean; min?: number }
    | { type: 'switch' }
    | { type: 'select'; options: string[] }
    | { type: 'pair'; integer: boolean; min?: number; parts: [string, string] }
    | { type: 'choices'; options: string[] }
    | { type: 'localized' }
    | { type: 'object'; fields: FieldSpec[] }
    | { type: 'custom' }
  )

const LABELS: Record<string, string> = {
  unlockCitizens: 'Unlock (Citizens)',
  cost: 'Cost (Urbs)',
  requiresRoad: 'Requires a road',
  accessModes: 'Access modes',
  initialSlots: 'Initial Slots',
  wellbeingBonus: 'Well-being bonus',
  radius: 'Radius (tiles)',
  rotationOffset: 'Rotation offset (deg)',
  bakeNodeScale: 'Bake node scale',
  url: 'Source URL',
}

const PAIR_PARTS: Record<string, [string, string]> = { footprint: ['W', 'D'], center: ['X', 'Z'] }

export const labelOf = (key: string) => LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())

const isLocalized = (schema: JsonSchema) => schema.type === 'object' && Object.keys(schema.properties ?? {}).join() === 'en,fr'

export interface FieldOptions {
  hidden?: readonly string[]
  readOnly?: readonly string[]
  custom?: readonly string[]
}

function fieldOf(key: string, schema: JsonSchema, required: boolean, options: FieldOptions): FieldSpec {
  const base = { key, label: labelOf(key), required }
  if (options.custom?.includes(key)) return { ...base, type: 'custom' }
  if (key === 'model') return { ...base, type: 'model' }
  if (schema.enum) return { ...base, type: 'select', options: schema.enum }
  if (schema.type === 'boolean') return { ...base, type: 'switch' }
  if (schema.type === 'integer' || schema.type === 'number') return { ...base, type: 'number', integer: schema.type === 'integer', min: schema.minimum ?? schema.exclusiveMinimum }
  if (schema.type === 'array' && schema.prefixItems?.length === 2) {
    const [first] = schema.prefixItems
    return { ...base, type: 'pair', integer: first!.type === 'integer', min: first!.minimum, parts: PAIR_PARTS[key] ?? ['A', 'B'] }
  }
  if (schema.type === 'array' && schema.items && schema.items.enum) return { ...base, type: 'choices', options: schema.items.enum }
  if (isLocalized(schema)) return { ...base, type: 'localized' }
  if (schema.type === 'object' && schema.properties) return { ...base, type: 'object', fields: fieldsOf(schema, options) }
  return { ...base, type: 'text', readOnly: options.readOnly?.includes(key) }
}

export function fieldsOf(schema: JsonSchema, options: FieldOptions = {}): FieldSpec[] {
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties ?? {})
    .filter(([key]) => !options.hidden?.includes(key))
    .map(([key, property]) => fieldOf(key, property, required.has(key), options))
}

const buildingJson = z.toJSONSchema(buildingSchema) as JsonSchema
const BUILDING_HIDDEN = ['$schema', 'kind', 'order', 'retired']

export const buildingFieldsOf = (kind: BuildingKind): FieldSpec[] => {
  const branch = buildingJson.oneOf?.find(candidate => candidate.properties?.kind?.const === kind)
  return branch ? fieldsOf(branch, { hidden: BUILDING_HIDDEN }) : []
}

export const MODEL_FIELDS: FieldSpec[] = fieldsOf(z.toJSONSchema(modelSchema) as JsonSchema, { readOnly: ['file'], custom: ['recolor'] })

export const isTextField = (field: FieldSpec) => field.type === 'localized'

import { z } from 'zod'
import type { BuildingKind } from '../../../../src/core/buildings/buildingDefinition'
import { modelSchema } from '../../../../src/core/models/modelSchema'
import { STAFF_ROLES_ALL } from '../../../../src/core/venues/venueVocabulary'
import { specOf, type CollectionName, type Definition } from '../../../../scripts/collections'
import { singletonSpecOf, type SingletonName } from '../../../../scripts/singletons'

interface JsonSchema {
  type?: string
  const?: unknown
  enum?: string[]
  minimum?: number
  exclusiveMinimum?: number
  pattern?: string
  properties?: Record<string, JsonSchema>
  additionalProperties?: JsonSchema | boolean
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
    | { type: 'modelList'; count: number }
    | { type: 'number'; integer: boolean; min?: number }
    | { type: 'switch' }
    | { type: 'select'; options: string[] }
    | { type: 'pair'; integer: boolean; min?: number; parts: [string, string] }
    | { type: 'choices'; options: string[] }
    | { type: 'numberList'; integer: boolean }
    | { type: 'localized' }
    | { type: 'object'; fields: FieldSpec[] }
    | { type: 'record'; targets: readonly CollectionName[]; keys?: readonly string[]; integer: boolean; min?: number }
    | { type: 'list'; fields: FieldSpec[] }
    | { type: 'map'; fields: FieldSpec[] }
    | { type: 'custom' }
  )

const LABELS: Record<string, string> = {
  unlockCitizens: 'Unlock (Citizens)',
  cost: 'Cost (Urbs)',
  value: 'Value (Urbs)',
  requiresRoad: 'Requires a road',
  accessModes: 'Access modes',
  initialSlots: 'Initial Slots',
  wellbeingBonus: 'Well-being bonus',
  radius: 'Radius (tiles)',
  rotationOffset: 'Rotation offset (deg)',
  bakeNodeScale: 'Bake node scale',
  url: 'Source URL',
  minTier: 'Minimum Tier',
  durationMinutes: 'Duration (min)',
  growthMinutes: 'Growth (min)',
  packingMinutes: 'Packing (min)',
  seedShare: 'Seed share',
  model: 'Model',
}

const PAIR_PARTS: Record<string, [string, string]> = { footprint: ['W', 'D'], center: ['X', 'Z'] }

// Fields that hold Model ids, wherever they sit.
const MODEL_KEYS = new Set(['model', 'produce', 'harvested', 'growth'])

// Records keyed by ids of other collections.
const RECORD_TARGETS: Record<string, readonly CollectionName[]> = { recipe: ['materials', 'crops'], goods: ['goods'] }

// Records keyed by a closed vocabulary.
const RECORD_KEYS: Record<string, readonly string[]> = { posts: STAFF_ROLES_ALL }

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
  if (MODEL_KEYS.has(key) && schema.type === 'string') return { ...base, type: 'model' }
  if (MODEL_KEYS.has(key) && schema.type === 'array' && schema.prefixItems) return { ...base, type: 'modelList', count: schema.prefixItems.length }
  if (schema.enum) return { ...base, type: 'select', options: schema.enum }
  if (schema.type === 'boolean') return { ...base, type: 'switch' }
  if (schema.type === 'integer' || schema.type === 'number') return { ...base, type: 'number', integer: schema.type === 'integer', min: schema.minimum ?? schema.exclusiveMinimum }
  if (schema.type === 'array' && schema.prefixItems?.length === 2) {
    const [first] = schema.prefixItems
    return { ...base, type: 'pair', integer: first!.type === 'integer', min: first!.minimum, parts: PAIR_PARTS[key] ?? ['A', 'B'] }
  }
  if (schema.type === 'array' && schema.items && schema.items.enum) return { ...base, type: 'choices', options: schema.items.enum }
  if (schema.type === 'array' && schema.items && (schema.items.type === 'integer' || schema.items.type === 'number')) return { ...base, type: 'numberList', integer: schema.items.type === 'integer' }
  if (schema.type === 'array' && schema.items && schema.items.type === 'object') return { ...base, type: 'list', fields: fieldsOf(schema.items, options) }
  if (isLocalized(schema)) return { ...base, type: 'localized' }
  if (schema.type === 'object' && !schema.properties && typeof schema.additionalProperties === 'object' && schema.additionalProperties.properties) return { ...base, type: 'map', fields: fieldsOf(schema.additionalProperties, options) }
  if (schema.type === 'object' && !schema.properties && typeof schema.additionalProperties === 'object') {
    const values = schema.additionalProperties
    return { ...base, type: 'record', targets: RECORD_TARGETS[key] ?? [], keys: RECORD_KEYS[key], integer: values.type === 'integer', min: values.minimum }
  }
  if (schema.type === 'object' && schema.properties) return { ...base, type: 'object', fields: fieldsOf(schema, options) }
  return { ...base, type: 'text', readOnly: options.readOnly?.includes(key) }
}

export function fieldsOf(schema: JsonSchema, options: FieldOptions = {}): FieldSpec[] {
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties ?? {})
    .filter(([key]) => !options.hidden?.includes(key))
    .map(([key, property]) => fieldOf(key, property, required.has(key), options))
}

const HIDDEN = ['$schema', 'kind', 'order', 'retired']

const jsonOf = (schema: z.ZodType) => z.toJSONSchema(schema) as JsonSchema

const collectionJson = new Map<CollectionName, JsonSchema>()

// A discriminated union shows the branch whose constants (kind, Venue) the definition holds.
export function collectionFieldsOf(collection: CollectionName, definition: Definition): FieldSpec[] {
  if (!collectionJson.has(collection)) collectionJson.set(collection, jsonOf(specOf(collection).schema))
  const json = collectionJson.get(collection)!
  const matches = (candidate: JsonSchema) => (candidate.required ?? []).every(key => candidate.properties?.[key]?.const === undefined || candidate.properties[key].const === definition[key])
  const branch = json.oneOf ? json.oneOf.find(matches) : json
  return branch ? fieldsOf(branch, { hidden: HIDDEN, readOnly: ['venue'] }) : []
}

export const buildingFieldsOf = (kind: BuildingKind): FieldSpec[] => collectionFieldsOf('buildings', { kind })

export const singletonFieldsOf = (name: SingletonName): FieldSpec[] => fieldsOf(jsonOf(singletonSpecOf(name).schema), { hidden: ['$schema'] })

export const MODEL_FIELDS: FieldSpec[] = fieldsOf(jsonOf(modelSchema), { readOnly: ['file'], custom: ['recolor'] })

export const isTextField = (field: FieldSpec) => field.type === 'localized'

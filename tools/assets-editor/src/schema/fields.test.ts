import { describe, expect, it } from 'vitest'
import { MODEL_FIELDS, buildingFieldsOf } from './fields'

describe('form fields from the JSON Schemas', () => {
  it('describes a sport building with typed controls and no internal field', () => {
    const fields = Object.fromEntries(buildingFieldsOf('sport').map(field => [field.key, field]))
    expect(Object.keys(fields)).not.toContain('order')
    expect(Object.keys(fields)).not.toContain('kind')
    expect(fields.model?.type).toBe('model')
    expect(fields.section).toMatchObject({ type: 'select', required: true })
    expect(fields.footprint).toMatchObject({ type: 'pair', integer: true, min: 1, parts: ['W', 'D'] })
    expect(fields.accessModes).toMatchObject({ type: 'choices', options: ['road', 'brt'], required: false })
    expect(fields.name?.type).toBe('localized')
    expect(fields.radius).toMatchObject({ type: 'number', integer: true, min: 1 })
    expect(fields.requiresRoad?.type).toBe('switch')
  })

  it('gives a nature building only its own fields', () => {
    expect(buildingFieldsOf('nature').map(({ key }) => key)).toEqual(['model', 'name', 'description', 'family'])
  })

  it('describes a model definition with a read-only file and nested fit', () => {
    const fields = Object.fromEntries(MODEL_FIELDS.map(field => [field.key, field]))
    expect(fields.file).toMatchObject({ type: 'text', readOnly: true })
    expect(fields.recolor?.type).toBe('custom')
    expect(fields.fit).toMatchObject({ type: 'object' })
    expect(fields.scale).toMatchObject({ type: 'number', integer: false, min: 0 })
  })
})

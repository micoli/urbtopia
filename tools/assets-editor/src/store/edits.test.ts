import { describe, expect, it } from 'vitest'
import type { FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import type { Collections, Definition } from '../../../../scripts/collections'
import { BUILDING_KINDS } from '../../../../src/core/buildings/buildingSchema'
import { buildingProblemsOf, collectionProblems } from '../../../../scripts/definitionProblems'
import type { Doc } from './documentStore'
import { blankBuilding, blankDefinition, convertBuilding, insertDefinitionAfter, reorderGroup, sectionOf, setIn } from './edits'

const building = (section: FlatBuilding['section']): Definition => ({ ...blankBuilding('standard', 'm'), section, name: { en: 'A', fr: 'A' } }) as unknown as Definition

const doc: Doc = {
  models: {},
  collections: { buildings: { a: building('build.housing'), b: building('build.storage'), c: building('build.housing'), d: building('build.storage'), e: building('build.housing') }, materials: {}, goods: {}, crops: {}, fixtures: {} } as Collections,
  singletons: { packFormats: { formats: [] } },
}

describe('document edits', () => {
  it('reorders a group in the places its members held', () => {
    expect(Object.keys(reorderGroup(doc, 'buildings', ['e', 'a', 'c']).collections.buildings)).toEqual(['e', 'b', 'a', 'd', 'c'])
  })

  it('inserts a definition after another, or at the end', () => {
    expect(Object.keys(insertDefinitionAfter(doc, 'buildings', 'b', 'x', building('build.storage')).collections.buildings)).toEqual(['a', 'b', 'x', 'c', 'd', 'e'])
    expect(Object.keys(insertDefinitionAfter(doc, 'buildings', undefined, 'x', building('build.storage')).collections.buildings).at(-1)).toBe('x')
  })

  it('writes deep values without touching the source, and unsets with undefined', () => {
    const crop = { models: { growth: ['a', 'b', 'c', 'd'] }, name: 'x' }
    expect(setIn(crop, ['models', 'growth', 2], 'z')).toEqual({ models: { growth: ['a', 'b', 'z', 'd'] }, name: 'x' })
    expect(crop.models.growth[2]).toBe('c')
    expect(setIn(crop, ['name'], undefined)).toEqual({ models: crop.models })
  })

  it('places nature buildings in the section of their family', () => {
    expect(sectionOf({ ...blankBuilding('nature', 'm'), family: 'tree' })).toBe('build.greenSpaces')
    expect(sectionOf(blankBuilding('nature', 'm'))).toBe('build.decoration')
  })

  it('converts a building to another kind into a valid one', () => {
    const named = { ...(building('build.leisure') as unknown as FlatBuilding), description: { en: 'D', fr: 'D' }, accessModes: ['road', 'brt'] as FlatBuilding['accessModes'] }
    for (const kind of BUILDING_KINDS) {
      const converted = { ...convertBuilding(named, kind), order: 10 }
      expect(converted.kind).toBe(kind)
      expect(buildingProblemsOf('x', converted)).toEqual([])
    }
    expect(convertBuilding(named, 'sport')).toMatchObject({ section: 'build.leisure', accessModes: ['road', 'brt'], radius: 1 })
  })

  it('starts new materials and crops from a shape that only lacks a name', () => {
    for (const collection of ['materials', 'crops', 'fixtures'] as const) {
      const problems = collectionProblems(collection, { fresh: { ...blankDefinition(collection, 'm'), order: 10 } })
      expect(problems.map(({ path }) => path).sort()).toEqual(['name.en', 'name.fr'])
    }
  })
})

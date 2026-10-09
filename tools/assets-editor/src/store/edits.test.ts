import { describe, expect, it } from 'vitest'
import type { FlatBuilding } from '../../../../src/core/buildings/buildingDefinition'
import { buildingProblemsOf } from '../../../../scripts/definitionProblems'
import type { Doc } from './documentStore'
import { blankBuilding, convertBuilding, insertBuildingAfter, reorderSection, sectionOf } from './edits'

const building = (section: FlatBuilding['section']): FlatBuilding => ({ ...blankBuilding('standard', 'm'), section, name: { en: 'A', fr: 'A' } })

const doc: Doc = {
  models: {},
  buildings: { a: building('build.housing'), b: building('build.storage'), c: building('build.housing'), d: building('build.storage'), e: building('build.housing') },
}

describe('document edits', () => {
  it('reorders a section in the places its members held', () => {
    expect(Object.keys(reorderSection(doc, ['e', 'a', 'c']).buildings)).toEqual(['e', 'b', 'a', 'd', 'c'])
  })

  it('inserts a building after another, or at the end', () => {
    expect(Object.keys(insertBuildingAfter(doc, 'b', 'x', building('build.storage')).buildings)).toEqual(['a', 'b', 'x', 'c', 'd', 'e'])
    expect(Object.keys(insertBuildingAfter(doc, undefined, 'x', building('build.storage')).buildings).at(-1)).toBe('x')
  })

  it('places nature buildings in the section of their family', () => {
    expect(sectionOf({ ...blankBuilding('nature', 'm'), family: 'tree' })).toBe('build.greenSpaces')
    expect(sectionOf(blankBuilding('nature', 'm'))).toBe('build.decoration')
  })

  it('converts a building to another kind into a valid one', () => {
    const named = { ...building('build.leisure'), description: { en: 'D', fr: 'D' }, accessModes: ['road', 'brt'] as FlatBuilding['accessModes'] }
    for (const kind of ['sport', 'nature', 'standard'] as const) {
      const converted = { ...convertBuilding(named, kind), order: 10 }
      expect(converted.kind).toBe(kind)
      expect(buildingProblemsOf('x', converted)).toEqual([])
    }
    expect(convertBuilding(named, 'sport')).toMatchObject({ section: 'build.leisure', accessModes: ['road', 'brt'], radius: 1 })
  })
})

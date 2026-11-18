import { describe, expect, it } from 'vitest'
import { NOT_IN_SAVE } from '../domain/dashboard'
import { colorsOf, hueCount } from './chartColors'

const parts = (...labels: string[]) => labels.map(label => ({ label, count: 1 }))

describe('colorsOf', () => {
  it('gives the hues in the order of the parts', () => {
    expect(colorsOf(parts('a', 'b', 'c'))).toEqual(['var(--series-1)', 'var(--series-2)', 'var(--series-3)'])
  })

  it('gives the parts that say nothing the neutral gray without using up a hue', () => {
    expect(colorsOf(parts('a', NOT_IN_SAVE, 'b'))).toEqual(['var(--series-1)', 'var(--series-neutral)', 'var(--series-2)'])
    expect(hueCount(parts('a', NOT_IN_SAVE, 'b'))).toBe(2)
  })
})

import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate } from './format'

describe('formatBytes', () => {
  it('picks the unit', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 kB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB')
  })
})

describe('formatDate', () => {
  it('shows a dash when there is no date', () => {
    expect(formatDate(null)).toBe('—')
  })
})

import { describe, expect, it } from 'vitest'
import { isValidHandle, neutralHandle } from './handle'

describe('isValidHandle', () => {
  it('follows the database format', () => {
    expect(isValidHandle('Ada_01-b')).toBe(true)
    expect(isValidHandle('ab')).toBe(false)
    expect(isValidHandle('a'.repeat(21))).toBe(false)
    expect(isValidHandle('has space')).toBe(false)
  })
})

describe('neutralHandle', () => {
  it('derives a valid handle from the user id', () => {
    const handle = neutralHandle('11111111-2222-3333-4444-555555555555')
    expect(handle).toBe('player-11111111')
    expect(isValidHandle(handle)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { describeFilter, inWindow, windowOf } from './dateFilter'

const NOW = new Date(2026, 10, 19, 12, 0).getTime()
const local = (month: number, day: number, hour = 0) => new Date(2026, month - 1, day, hour).getTime()

describe('windowOf', () => {
  it('leaves both sides open for all time', () => {
    expect(windowOf({ kind: 'all' }, NOW)).toEqual({ from: null, to: null })
  })

  it('opens the last days up to now', () => {
    expect(windowOf({ kind: 'last', days: 7 }, NOW)).toEqual({ from: NOW - 7 * 86_400_000, to: null })
  })

  it('takes a whole day, from its start to the start of the next one', () => {
    expect(windowOf({ kind: 'day', day: '2026-11-19' }, NOW)).toEqual({ from: local(11, 19), to: local(11, 20) })
  })

  it('takes the last day of a range whole', () => {
    expect(windowOf({ kind: 'range', from: '2026-11-10', to: '2026-11-12' }, NOW)).toEqual({ from: local(11, 10), to: local(11, 13) })
  })

  it('reads a range given backwards the right way round', () => {
    expect(windowOf({ kind: 'range', from: '2026-11-12', to: '2026-11-10' }, NOW)).toEqual({ from: local(11, 10), to: local(11, 13) })
  })

  it('leaves open the side of a range that is not filled in, and ignores a day that is not a date', () => {
    expect(windowOf({ kind: 'range', from: '2026-11-10', to: '' }, NOW)).toEqual({ from: local(11, 10), to: null })
    expect(windowOf({ kind: 'day', day: 'tomorrow' }, NOW)).toEqual({ from: null, to: null })
  })
})

describe('inWindow', () => {
  const window = { from: local(11, 10), to: local(11, 13) }

  it('includes the start and excludes the end', () => {
    expect(inWindow(local(11, 10), window)).toBe(true)
    expect(inWindow(local(11, 12, 23), window)).toBe(true)
    expect(inWindow(local(11, 13), window)).toBe(false)
    expect(inWindow(local(11, 9, 23), window)).toBe(false)
  })

  it('accepts everything in an open window', () => {
    expect(inWindow(0, { from: null, to: null })).toBe(true)
  })
})

describe('describeFilter', () => {
  it('says what is filtered', () => {
    expect(describeFilter({ kind: 'all' })).toBe('all time')
    expect(describeFilter({ kind: 'last', days: 14 })).toBe('the last 14 days')
    expect(describeFilter({ kind: 'day', day: '2026-11-19' })).toBe('2026-11-19')
    expect(describeFilter({ kind: 'range', from: '2026-11-10', to: '' })).toBe('2026-11-10 to now')
  })
})

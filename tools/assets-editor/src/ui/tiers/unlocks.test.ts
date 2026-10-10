import { describe, expect, it } from 'vitest'
import type { Collections } from '../../../../../scripts/collections'
import { unlocksByTier } from './unlocks'

const collections = { buildings: { shopFood: { kind: 'shop', tiers: [{ sells: ['a'] }, { sells: ['a', 'b'] }, {}, { sells: ['a', 'b', 'c'] }] } }, goods: {}, materials: {} } as unknown as Collections

describe('unlocksByTier', () => {
  it('lists the Goods each Shop Tier starts selling', () => {
    expect(unlocksByTier(collections, 'buildings', 'shopFood', 4)).toEqual([['a'], ['b'], [], ['c']])
  })
})

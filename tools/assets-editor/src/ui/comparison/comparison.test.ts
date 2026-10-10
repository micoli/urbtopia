import { describe, expect, it } from 'vitest'
import type { Definition } from '../../../../../scripts/collections'
import { COMPARABLE_KINDS, comparableFieldsOf, rowsOf, withCell } from './comparison'

const silo: Definition = {
  kind: 'storage',
  name: { en: 'Silo' },
  tiers: [{ materials: 40, goods: 0 }, { materials: 60, upgradeCost: { urbs: 250 } }, { upgradeCost: { urbs: 600 } }],
}

describe('comparison', () => {
  it('compares the numbers each kind sets per Tier, and the upgrade cost', () => {
    expect(comparableFieldsOf('storage').map(({ key }) => key)).toEqual(['materials', 'goods', 'crops', 'upgradeCost'])
    expect(COMPARABLE_KINDS).toContain('home')
    expect(COMPARABLE_KINDS).not.toContain('standard')
  })

  it('shows one cell per Tier, flagging the values inherited from the previous Tier', () => {
    const [row] = rowsOf({ silo, other: { kind: 'home', tiers: [] } }, 'storage', 'materials')
    expect(row!.cells).toEqual([{ value: 40, own: true }, { value: 60, own: true }, { value: 60, own: false }])
  })

  it('reads the upgrade cost as it is set, with none at Tier 1', () => {
    const [row] = rowsOf({ silo }, 'storage', 'upgradeCost')
    expect(row!.cells.map(cell => cell.value)).toEqual([undefined, 250, 600])
  })

  it('sets a value on its Tier only', () => {
    const edited = withCell(silo, 'materials', 2, 90)
    expect((edited.tiers as Record<string, unknown>[])[2]).toEqual({ upgradeCost: { urbs: 600 }, materials: 90 })
    expect(silo.tiers).toEqual([{ materials: 40, goods: 0 }, { materials: 60, upgradeCost: { urbs: 250 } }, { upgradeCost: { urbs: 600 } }])
    expect((withCell(silo, 'upgradeCost', 1, 300).tiers as Record<string, unknown>[])[1]).toEqual({ materials: 60, upgradeCost: { urbs: 300 } })
  })
})

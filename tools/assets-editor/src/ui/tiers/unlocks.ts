import { resolveTiers } from '../../../../../src/core/buildings/tiers'
import type { CollectionName, Collections, Definition } from '../../../../../scripts/collections'

// What a building makes, mirroring the game's producible items: unlocked by Tier through each item's minimum Tier.
const MADE_BY: Record<string, { collection: CollectionName; keep: (definition: Definition) => boolean }> = {
  workshop: { collection: 'materials', keep: ({ producedBy }) => producedBy === 'workshop' },
  factory: { collection: 'goods', keep: () => true },
}

const sellsOf = (tier: Definition): string[] => (tier.sells as string[] | undefined) ?? []

// The Goods each Tier of a Shop starts selling, from the lists the Shop gives for every Tier.
function shopUnlocks(tiers: Definition[]): string[][] {
  const resolved = resolveTiers<Definition>(tiers)
  return resolved.map((tier, index) => sellsOf(tier).filter(good => !sellsOf(resolved[index - 1] ?? {}).includes(good)))
}

export function unlocksByTier(collections: Collections, collection: CollectionName, id: string, tierCount: number): string[][] | undefined {
  const definition = collection === 'buildings' ? collections.buildings[id] : undefined
  if (definition?.kind === 'shop') return shopUnlocks((definition.tiers as Definition[] | undefined) ?? [])
  const made = collection === 'buildings' ? MADE_BY[id] : undefined
  if (!made) return undefined
  const items = Object.entries(collections[made.collection]).filter(([, definition]) => made.keep(definition))
  return Array.from({ length: tierCount }, (_, index) => items.filter(([, { minTier }]) => minTier === index + 1).map(([itemId]) => itemId))
}

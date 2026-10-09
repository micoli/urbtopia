import type { CollectionName, Collections, Definition } from '../../../../../scripts/collections'

// What a building makes, mirroring the game's producible items: unlocked by Tier through each item's minimum Tier.
const MADE_BY: Record<string, { collection: CollectionName; keep: (definition: Definition) => boolean }> = {
  workshop: { collection: 'materials', keep: ({ producedBy }) => producedBy === 'workshop' },
  factory: { collection: 'goods', keep: () => true },
}

export function unlocksByTier(collections: Collections, collection: CollectionName, id: string, tierCount: number): string[][] | undefined {
  const made = collection === 'buildings' ? MADE_BY[id] : undefined
  if (!made) return undefined
  const items = Object.entries(collections[made.collection]).filter(([, definition]) => made.keep(definition))
  return Array.from({ length: tierCount }, (_, index) => items.filter(([, { minTier }]) => minTier === index + 1).map(([itemId]) => itemId))
}

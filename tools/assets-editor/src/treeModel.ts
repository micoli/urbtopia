import type { ModelSource } from '../../../src/scene/modelDefinitions'
import { assetKey, sourceOf, type Asset } from './assetKeys'

export interface TreePack {
  pack: string
  assets: Asset[]
}

export interface TreeSource {
  id: string
  label: string
  packs: TreePack[]
  count: number
}

const SOURCE_ORDER = ['kenney', 'quaternius', 'managed', 'poly.pizza', 'other']
const SOURCE_LABELS: Record<string, string> = { managed: 'managed-models' }

export function buildTree(manifest: Record<string, string[]>, sourceByPack: Record<string, ModelSource | undefined>, filter: string): TreeSource[] {
  const query = filter.trim().toLowerCase()
  const bySource = new Map<string, TreePack[]>()
  for (const [pack, models] of Object.entries(manifest)) {
    const assets = models.filter((model) => assetKey(pack, model).toLowerCase().includes(query)).map((name) => ({ pack, name }))
    if (assets.length === 0) continue
    const source = sourceOf(pack, sourceByPack) ?? 'other'
    bySource.set(source, [...(bySource.get(source) ?? []), { pack, assets }])
  }
  return SOURCE_ORDER.filter((id) => bySource.has(id)).map((id) => {
    const packs = bySource.get(id)!
    return { id, label: SOURCE_LABELS[id] ?? id, packs, count: packs.reduce((total, { assets }) => total + assets.length, 0) }
  })
}

// A source holding only a pack of the same name (poly.pizza) would show the same label twice.
export const isFlatSource = ({ id, packs }: TreeSource) => packs.length === 1 && packs[0]!.pack === id

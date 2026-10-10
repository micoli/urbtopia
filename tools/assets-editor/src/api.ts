import type { ModelSource } from '../../../src/core/models/modelSchema'
import type { Collections } from '../../../scripts/collections'
import type { ModelDefinitions } from '../../../scripts/definitionProblems'
import type { Singletons } from '../../../scripts/singletons'

export interface Definitions {
  models: ModelDefinitions
  collections: Collections
  singletons: Singletons
}

export interface Catalog extends Definitions {
  installablePacks: string[]
  manifest: Record<string, string[]>
  sourceByPack: Record<string, ModelSource | undefined>
}

const errorOf = async (response: Response) => (response.ok ? null : ((await response.json()) as { error: string }).error)

export const fetchCatalog = async (): Promise<Catalog> => (await fetch('/api/catalog')).json()

export const saveDefinitions = async (definitions: Definitions): Promise<string | null> =>
  errorOf(await fetch('/api/definitions', { method: 'PUT', body: JSON.stringify(definitions) }))

export const callAssets = async (operation: string, body: object): Promise<string | null> =>
  errorOf(await fetch(`/api/assets/${operation}`, { method: 'POST', body: JSON.stringify(body) }))

export async function base64Of(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

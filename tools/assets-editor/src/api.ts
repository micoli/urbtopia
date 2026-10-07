import type { ModelSource } from '../../../src/scene/modelDefinitions'
import type { BuildingDefinitions } from '../../../src/core/buildings/buildingDefinition'
import type { Definitions } from './assetKeys'

const getJson = async <T>(url: string): Promise<T> => (await fetch(url)).json()

export const fetchManifest = () => getJson<Record<string, string[]>>('/manifest.json')
export const fetchSourceByPack = () => getJson<Record<string, ModelSource | undefined>>('/api/packs')
export const fetchDefinitions = () => getJson<Definitions>('/api/models')

export const fetchBuildings = () => getJson<BuildingDefinitions>('/api/buildings')

export async function saveBuildings(buildings: BuildingDefinitions): Promise<string> {
  const response = await fetch('/api/buildings', { method: 'PUT', body: JSON.stringify(buildings) })
  return response.ok ? 'saved' : ((await response.json()) as { error: string }).error
}

export async function saveDefinitions(definitions: Definitions): Promise<string> {
  const response = await fetch('/api/models', { method: 'PUT', body: JSON.stringify(definitions) })
  return response.ok ? 'saved' : ((await response.json()) as { error: string }).error
}

export async function callAssets(operation: string, body: object): Promise<string | null> {
  const response = await fetch(`/api/assets/${operation}`, { method: 'POST', body: JSON.stringify(body) })
  if (response.ok) return null
  return ((await response.json()) as { error: string }).error
}

export async function base64Of(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

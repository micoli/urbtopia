export interface CatalogModel {
  key: string
  tones: string[]
  modified: number
}

export async function fetchCatalog(): Promise<CatalogModel[]> {
  const response = await fetch('/api/models')
  return response.json() as Promise<CatalogModel[]>
}

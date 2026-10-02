export type Category = 'production' | 'habitat' | 'services' | 'roads'
export type Resource = 'urbs' | 'wood' | 'stone' | 'planks'

export type CatalogItem = {
  id: string
  label: string
  category: Category
  cost: number
  model: string
  yields?: { resource: Resource; amount: number }
  citizens?: number
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'production', label: 'Production', icon: '⚒️' },
  { id: 'habitat', label: 'Homes', icon: '🏠' },
  { id: 'services', label: 'Services', icon: '⚡' },
  { id: 'roads', label: 'Roads', icon: '🛣️' },
]

export const CATALOG: CatalogItem[] = [
  { id: 'workshop', label: 'Workshop', category: 'production', cost: 80, model: 'industrial/building-a', yields: { resource: 'wood', amount: 2 } },
  { id: 'factory', label: 'Factory', category: 'production', cost: 200, model: 'industrial/building-h', yields: { resource: 'planks', amount: 1 } },
  { id: 'shop', label: 'Shop', category: 'production', cost: 150, model: 'commercial/building-a', yields: { resource: 'urbs', amount: 35 } },
  { id: 'home', label: 'Home', category: 'habitat', cost: 150, model: 'suburban/building-type-a', yields: { resource: 'urbs', amount: 12 }, citizens: 6 },
  { id: 'power', label: 'Power plant', category: 'services', cost: 250, model: 'industrial/building-t' },
  { id: 'water', label: 'Water tower', category: 'services', cost: 200, model: 'industrial/water-tower' },
  { id: 'road', label: 'Road', category: 'roads', cost: 5, model: 'roads/road-straight' },
]

export const itemById = (id: string) => CATALOG.find(i => i.id === id)!
export const itemsOf = (category: Category) => CATALOG.filter(i => i.category === category)

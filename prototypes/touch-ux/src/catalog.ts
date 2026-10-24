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
  { id: 'workshop', label: 'Workshop', category: 'production', cost: 80, model: 'buildings/factory-2x2-t1-tone-a', yields: { resource: 'wood', amount: 2 } },
  { id: 'factory', label: 'Factory', category: 'production', cost: 200, model: 'buildings/factory-2x2-t3-tone-a', yields: { resource: 'planks', amount: 1 } },
  { id: 'shop', label: 'Shop', category: 'production', cost: 150, model: 'buildings/shop-construction-1x1-t1-tone-a', yields: { resource: 'urbs', amount: 35 } },
  { id: 'home', label: 'Home', category: 'habitat', cost: 150, model: 'buildings/house-1x1-1f-tone-a', yields: { resource: 'urbs', amount: 12 }, citizens: 6 },
  { id: 'power', label: 'Power plant', category: 'services', cost: 250, model: 'buildings/coal-1x1-t1-tone-a' },
  { id: 'water', label: 'Water tower', category: 'services', cost: 200, model: 'buildings/watertower-1x1-t1-tone-a' },
  { id: 'road', label: 'Road', category: 'roads', cost: 5, model: 'streets/road-straight' },
]

export const itemById = (id: string) => CATALOG.find(i => i.id === id)!
export const itemsOf = (category: Category) => CATALOG.filter(i => i.category === category)

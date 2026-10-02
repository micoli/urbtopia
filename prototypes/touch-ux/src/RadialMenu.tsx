import { useState } from 'react'
import { CATEGORIES, itemsOf, type CatalogItem, type Category } from './catalog'

type Props = { center: { x: number; y: number }; budget: number; onPick: (item: CatalogItem) => void; onClose: () => void }

const polar = (angleDeg: number, radius: number) => ({
  left: Math.cos((angleDeg * Math.PI) / 180) * radius,
  top: Math.sin((angleDeg * Math.PI) / 180) * radius,
})

export function RadialMenu({ center, budget, onPick, onClose }: Props) {
  const [category, setCategory] = useState<Category | null>(null)
  const clamp = (v: number, max: number) => Math.min(max - 170, Math.max(170, v))
  const x = clamp(center.x, window.innerWidth)
  const y = clamp(center.y, window.innerHeight)
  const items = category ? itemsOf(category) : []
  return (
    <div className="radial-backdrop" onClick={onClose}>
      <div className="radial" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
        <button className="radial-hub" onClick={category ? () => setCategory(null) : onClose}>{category ? '‹' : '✕'}</button>
        {!category && CATEGORIES.map((c, i) => (
          <button key={c.id} className="radial-node" style={polar(-90 + i * 90, 84)} onClick={() => setCategory(c.id)}>
            {c.icon}<small>{c.label}</small>
          </button>
        ))}
        {items.map((item, i) => (
          <button key={item.id} className="radial-node item" disabled={budget < item.cost} style={polar(-90 + (i - (items.length - 1) / 2) * 55, 110)} onClick={() => onPick(item)}>
            <strong>{item.label}</strong><small>{item.cost}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

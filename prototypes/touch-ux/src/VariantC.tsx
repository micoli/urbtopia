import { useState } from 'react'
import { CATEGORIES, itemsOf, type Category } from './catalog'
import { select, startBuild, useGame } from './game'
import { BuildingDetails } from './BuildingDetails'
import { CameraButtons } from './CameraButtons'
import { ConfirmPad } from './ConfirmPad'

export function VariantC() {
  const { stock, citizens, nextUnlock, powerUsed, powerCap, waterUsed, waterCap, buildItemId, selectedId } = useGame()
  const [open, setOpen] = useState<Category | null>(null)
  const pct = Math.min(100, Math.round((citizens / nextUnlock) * 100))

  return (
    <div className="ui c">
      <aside className="c-rail">
        <div className="c-stat" title="Urbs">🪙<b>{stock.urbs}</b></div>
        <div className="c-stat" title="Citizens">👥<b>{citizens}</b><i style={{ width: `${pct}%` }} /></div>
        <div className="c-stat" title="Power">⚡<b>{powerUsed}/{powerCap}</b></div>
        <div className="c-stat" title="Water">💧<b>{waterUsed}/{waterCap}</b></div>
        <hr />
        {CATEGORIES.map(c => (
          <button key={c.id} className={open === c.id ? 'on' : ''} onClick={() => { select(null); setOpen(open === c.id ? null : c.id) }}>{c.icon}</button>
        ))}
        <hr />
        <button>📦</button>
        <button>🏪</button>
        <button>🗺️</button>
      </aside>

      {open && !buildItemId && (
        <div className="c-flyout">
          {itemsOf(open).map(item => (
            <button key={item.id} disabled={stock.urbs < item.cost} onClick={() => { startBuild(item.id); setOpen(null) }}>
              <strong>{item.label}</strong>
              <span>{item.cost} Urbs</span>
            </button>
          ))}
        </div>
      )}

      {!buildItemId && selectedId !== null && <aside className="c-side"><BuildingDetails /></aside>}
      <ConfirmPad className="c-confirm" />
      <CameraButtons className="c-camera" />
    </div>
  )
}

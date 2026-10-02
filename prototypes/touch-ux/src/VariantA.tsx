import { useState } from 'react'
import { CATEGORIES, itemsOf, type Category } from './catalog'
import { startBuild, useGame } from './game'
import { BuildingDetails } from './BuildingDetails'
import { CameraButtons } from './CameraButtons'
import { ConfirmPad } from './ConfirmPad'

export function VariantA() {
  const { stock, citizens, nextUnlock, powerUsed, powerCap, waterUsed, waterCap, buildItemId, selectedId } = useGame()
  const [menu, setMenu] = useState<'build' | null>(null)
  const [category, setCategory] = useState<Category>('production')
  const sheet = buildItemId ? 'confirm' : selectedId !== null ? 'details' : menu === 'build' ? 'build' : null

  return (
    <div className="ui a">
      <header className="a-top">
        <div className="chip big">🪙 {stock.urbs}</div>
        <div className="chip">👥 {citizens}/{nextUnlock}</div>
        <div className="chip">⚡ {powerUsed}/{powerCap}</div>
        <div className="chip">💧 {waterUsed}/{waterCap}</div>
        <div className="chip dim">🪵 {stock.wood} 🪨 {stock.stone} 📦 {stock.planks}</div>
      </header>

      <CameraButtons className="a-camera" />

      {sheet && (
        <section className={`a-sheet ${sheet}`}>
          {sheet === 'confirm' && <ConfirmPad />}
          {sheet === 'details' && <BuildingDetails />}
          {sheet === 'build' && (
            <>
              <div className="a-cats">
                {CATEGORIES.map(c => (
                  <button key={c.id} className={c.id === category ? 'on' : ''} onClick={() => setCategory(c.id)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              <div className="a-items">
                {itemsOf(category).map(item => (
                  <button key={item.id} disabled={stock.urbs < item.cost} onClick={() => { startBuild(item.id); setMenu(null) }}>
                    <strong>{item.label}</strong>
                    <span>{item.cost} Urbs</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <nav className="a-tabs">
        <button className={menu === 'build' ? 'on' : ''} onClick={() => setMenu(menu === 'build' ? null : 'build')}>🔨<small>Build</small></button>
        <button>📦<small>Storehouse</small></button>
        <button>🏪<small>Market</small></button>
        <button>🗺️<small>Parcels</small></button>
      </nav>
    </div>
  )
}

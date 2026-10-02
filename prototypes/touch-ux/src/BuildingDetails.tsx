import { collect, select, sell, useGame } from './game'
import { itemById } from './catalog'

export function BuildingDetails({ onClose = () => select(null) }: { onClose?: () => void }) {
  const { buildings, selectedId } = useGame()
  const building = buildings.find(b => b.id === selectedId)
  if (!building) return null
  const item = itemById(building.itemId)
  return (
    <div className="details">
      <div className="details-head">
        <strong>{item.label}</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <p>{item.yields ? (building.ready ? 'Ready to collect' : 'Producing…') : 'No production'}</p>
      <div className="details-actions">
        <button disabled={!building.ready} onClick={() => collect(building.id)}>Collect</button>
        <button className="danger" onClick={() => sell(building.id)}>Sell +{Math.floor(item.cost * 0.75)}</button>
      </div>
    </div>
  )
}

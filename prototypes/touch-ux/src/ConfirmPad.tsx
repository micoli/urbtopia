import { cancelBuild, confirmBuild, useGame } from './game'
import { itemById } from './catalog'

export function ConfirmPad({ className = '' }: { className?: string }) {
  const { buildItemId, ghost, stock } = useGame()
  if (!buildItemId) return null
  const item = itemById(buildItemId)
  const affordable = stock.urbs >= item.cost
  const ok = !!ghost?.valid && affordable
  return (
    <div className={`confirm-pad ${className}`}>
      <button className="pad-cancel" onClick={cancelBuild} aria-label="Cancel">✕</button>
      <div className="pad-info">
        <strong>{item.label}</strong>
        <span className={affordable ? '' : 'bad'}>{item.cost} Urbs</span>
      </div>
      <button className="pad-ok" disabled={!ok} onClick={confirmBuild} aria-label="Confirm">✓</button>
    </div>
  )
}

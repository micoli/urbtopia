import { collect, useGame } from './game'
import { itemById } from './catalog'
import { ScreenAnchored } from './ScreenAnchored'

const ICON: Record<string, string> = { urbs: '🪙', wood: '🪵', stone: '🪨', planks: '📦' }

export function CollectBadges() {
  const { buildings, buildItemId } = useGame()
  if (buildItemId) return null
  return (
    <>
      {buildings.filter(b => b.ready).map(b => (
        <ScreenAnchored key={b.id} buildingId={b.id} className="badge-anchor">
          <button className="badge" onClick={() => collect(b.id)} aria-label="Collect">
            {ICON[itemById(b.itemId).yields!.resource]}
          </button>
        </ScreenAnchored>
      ))}
    </>
  )
}

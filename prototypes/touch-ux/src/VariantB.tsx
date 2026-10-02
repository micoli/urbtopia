import { useState } from 'react'
import { startBuild, useGame } from './game'
import { BuildingDetails } from './BuildingDetails'
import { CameraButtons } from './CameraButtons'
import { ConfirmPad } from './ConfirmPad'
import { RadialMenu } from './RadialMenu'
import { ScreenAnchored } from './ScreenAnchored'

type Props = { longPress: { x: number; y: number } | null; onLongPressDone: () => void }

export function VariantB({ longPress, onLongPressDone }: Props) {
  const { stock, citizens, nextUnlock, powerUsed, powerCap, waterUsed, waterCap, buildItemId, selectedId } = useGame()
  const [statsOpen, setStatsOpen] = useState(false)
  const [fab, setFab] = useState<{ x: number; y: number } | null>(null)
  const radialCenter = longPress ?? fab

  const closeRadial = () => { setFab(null); onLongPressDone() }

  return (
    <div className="ui b">
      <button className="b-pill" onClick={() => setStatsOpen(!statsOpen)}>🪙 {stock.urbs}</button>
      {statsOpen && (
        <div className="b-stats">
          <div>👥 Citizens {citizens} / next unlock {nextUnlock}</div>
          <div>⚡ Power {powerUsed}/{powerCap}</div>
          <div>💧 Water {waterUsed}/{waterCap}</div>
          <div>🪵 {stock.wood} 🪨 {stock.stone} 📦 {stock.planks}</div>
        </div>
      )}

      {!buildItemId && selectedId !== null && (
        <ScreenAnchored buildingId={selectedId} offsetY={-8} className="b-popover-anchor">
          <div className="b-popover"><BuildingDetails /></div>
        </ScreenAnchored>
      )}

      <ConfirmPad className="b-confirm" />
      <CameraButtons className="b-camera" />
      {!buildItemId && (
        <button className="b-fab" onClick={() => setFab({ x: window.innerWidth - 60, y: window.innerHeight - 80 })}>＋</button>
      )}

      {radialCenter && (
        <RadialMenu
          center={radialCenter}
          budget={stock.urbs}
          onClose={closeRadial}
          onPick={item => { startBuild(item.id); closeRadial() }}
        />
      )}
    </div>
  )
}

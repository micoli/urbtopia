import { useEffect, useRef } from 'react'
import { GameScene } from './scene'
import { sceneHandle } from './sceneHandle'
import { cancelBuild, getState, select, setGhost, subscribeGame } from './game'

type Props = { onLongPress?: (screen: { x: number; y: number }) => void }

export function SceneCanvas({ onLongPress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const longPressRef = useRef(onLongPress)
  longPressRef.current = onLongPress

  useEffect(() => {
    const canvas = canvasRef.current!
    const scene = new GameScene(canvas, {
      onTap: (tile, buildingId) => {
        if (getState().buildItemId) return scene.centerOn(tile.x, tile.z)
        select(buildingId)
      },
      onLongPress: screen => longPressRef.current?.(screen),
      onGhost: setGhost,
      onCancel: () => (getState().buildItemId ? cancelBuild() : select(null)),
    })
    let unsubscribe = () => {}
    scene.init().then(() => {
      sceneHandle.current = scene
      const apply = () => {
        const s = getState()
        scene.sync(s.buildings)
        scene.setSelected(s.selectedId)
        scene.setBuildItem(s.buildItemId)
      }
      apply()
      unsubscribe = subscribeGame(apply)
    })
    return () => {
      unsubscribe()
      sceneHandle.current = null
      scene.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="scene" />
}

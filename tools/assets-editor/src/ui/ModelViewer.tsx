import { useEffect, useRef } from 'react'
import { definitionKey, type Definitions } from '../assetKeys'
import type { ModelInfo } from '../modelLoader'
import { buildPlacement, SceneStage } from '../sceneStage'

const OVERVIEW_SPACING = 3
const CLICK_TOLERANCE_PX = 4

interface Props {
  pack: string
  names: string[]
  current: string
  rotation: number
  overview: boolean
  definitions: Definitions
  onInfo: (pack: string, name: string, info: ModelInfo) => void
  onPick: (name: string) => void
}

export function ModelViewer({ pack, names, current, rotation, overview, definitions, onInfo, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<SceneStage | null>(null)
  const focus = overview ? '' : current
  const callbacks = useRef({ onInfo, onPick, overview })
  callbacks.current = { onInfo, onPick, overview }

  useEffect(() => {
    const canvas = canvasRef.current!
    const container = containerRef.current!
    const stage = new SceneStage(canvas, container)
    stageRef.current = stage
    const observer = new ResizeObserver(() => stage.resize())
    observer.observe(container)
    stage.resize()

    let pointerDown: { x: number; y: number } | null = null
    const onPointerDown = (event: PointerEvent) => { pointerDown = { x: event.clientX, y: event.clientY } }
    const onPointerUp = (event: PointerEvent) => {
      const start = pointerDown
      pointerDown = null
      if (!callbacks.current.overview || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_TOLERANCE_PX) return
      const name = stage.nameAt(event.clientX, event.clientY)
      if (name) callbacks.current.onPick(name)
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      observer.disconnect()
      stage.dispose()
      stageRef.current = null
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current!
    let cancelled = false
    const shown = overview ? names : focus ? [focus] : []
    const cols = Math.ceil(Math.sqrt(shown.length))
    void (async () => {
      const placements = await Promise.all(shown.map((name) => buildPlacement(pack, name, definitions[definitionKey(pack, name)], !overview)))
      if (cancelled) return
      stage.clear()
      placements.forEach(({ name, info, object }, index) => {
        callbacks.current.onInfo(pack, name, info)
        if (overview) object.position.set((index % cols) * OVERVIEW_SPACING, 0, Math.floor(index / cols) * OVERVIEW_SPACING)
        else object.rotation.y = (rotation * Math.PI) / 2
        stage.stage.add(object)
      })
      stage.frameStage()
    })()
    return () => { cancelled = true }
  }, [pack, names, focus, rotation, overview, definitions])

  return (
    <div id="view" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div id="legend">RED = +X &nbsp; BLUE = +Z (grey strip = -Z = street side by convention) &nbsp; drag: orbit, wheel: zoom</div>
    </div>
  )
}

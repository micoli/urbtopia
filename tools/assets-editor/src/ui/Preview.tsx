import { resolveTiers, resolveVariant } from '../../../../src/core/buildings/tiers'
import { specOf } from '../../../../scripts/collections'
import { useEffect, useRef, useState } from 'react'
import { footprintOf } from '../fitted'
import { useLibrary } from '../hooks/useLibrary'
import type { ModelInfo } from '../modelLoader'
import { buildPlacement, SceneStage } from '../sceneStage'
import { useDocument, type Doc, type Selection } from '../store/documentStore'
import { button, panel } from './styles'

type Tier = { model?: string }

// The model a Game object shows: the previewed Tier of one that grows, the last growth stage of a Crop.
function modelOfSelection(doc: Doc, selection: Selection | null, preview: { tier: number; variant?: string }): string | undefined {
  if (!selection || selection.kind === 'singletons') return undefined
  if (selection.kind === 'models') return selection.id
  const definition = doc.collections[selection.kind][selection.id]
  if (!definition) return undefined
  if (Array.isArray(definition.tiers)) {
    const base = resolveTiers<Tier>(definition.tiers as Tier[])
    const variant = preview.variant ? (definition.variants as Record<string, { tiers: Tier[] }> | undefined)?.[preview.variant]?.tiers : undefined
    return (variant ? resolveVariant(base, variant) : base)[preview.tier]?.model ?? base[0]?.model
  }
  const models = specOf(selection.kind).references(definition as never).filter(({ target }) => target === 'models')
  return (models.find(({ path }) => path === 'models.growth.3') ?? models[0])?.id
}

// The model of the selected Game object, placed as the game places it, with its footprint and the street side (-Z).
export function Preview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<SceneStage | null>(null)
  const [rotation, setRotation] = useState(0)
  const [info, setInfo] = useState<ModelInfo | null>(null)
  const modelId = useDocument(state => modelOfSelection(state.doc, state.selection, state.preview))
  const settings = useDocument(state => (modelId ? state.doc.models[modelId] : undefined))
  const location = useLibrary().byFile.get(settings?.file ?? '')

  useEffect(() => {
    const stage = new SceneStage(canvasRef.current!, containerRef.current!)
    stageRef.current = stage
    const observer = new ResizeObserver(() => stage.resize())
    observer.observe(containerRef.current!)
    stage.resize()
    return () => {
      observer.disconnect()
      stage.dispose()
      stageRef.current = null
    }
  }, [])

  useEffect(() => {
    const stage = stageRef.current!
    stage.clear()
    setInfo(null)
    if (!location) return
    let live = true
    void buildPlacement(location.pack, location.name, settings, true).then(placed => {
      if (!live) return
      placed.object.rotation.y = (rotation * Math.PI) / 2
      stage.stage.add(placed.object)
      stage.frameStage()
      setInfo(placed.info)
    })
    return () => {
      live = false
    }
  }, [location, settings, rotation])

  const footprint = info ? footprintOf(info, settings) : null

  return (
    <section className={`${panel} relative overflow-hidden`}>
      <div ref={containerRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <span className="rounded bg-white/85 px-2 py-1 font-mono text-[11px] text-zinc-600 shadow-sm">{settings?.file ?? 'No model'}</span>
        <div className="pointer-events-auto flex gap-1">
          <button className={button('secondary')} onClick={() => setRotation((rotation + 3) % 4)} aria-label="Rotate left">⟲</button>
          <button className={button('secondary')} onClick={() => setRotation((rotation + 1) % 4)} aria-label="Rotate right">⟳</button>
        </div>
      </div>
      {info && footprint && (
        <p className="pointer-events-none absolute inset-x-2 bottom-2 rounded bg-white/85 px-2 py-1 text-[11px] text-zinc-600 shadow-sm">
          {info.size.x.toFixed(2)} × {info.size.z.toFixed(2)} × {info.size.y.toFixed(2)} · {Math.round(info.tris)} tris · footprint {footprint.width}×{footprint.depth}{settings?.footprint ? '' : ' (computed)'}
          {info.nodeScaled && ' · node scale ≠ 1'}
        </p>
      )}
    </section>
  )
}

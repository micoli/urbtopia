import { resolveTiers, resolveVariant } from '../../../../src/core/buildings/tiers'
import { specOf } from '../../../../scripts/collections'
import { useEffect, useRef, useState } from 'react'
import { footprintOf } from '../fitted'
import { useLibrary } from '../hooks/useLibrary'
import type { ModelInfo } from '../modelLoader'
import * as THREE from 'three'
import { solarPanelPlacements } from '../../../../src/core/environment/solarPanelLayout'
import type { SolarPanelsDefinition } from '../../../../src/core/buildings/solarPanelsSchema'
import { buildModel, buildPlacement, SceneStage, type PlacedModel } from '../sceneStage'
import type { Definition } from '../../../../scripts/collections'
import { useDocument, type Doc, type Selection } from '../store/documentStore'
import { setDefinition } from '../store/edits'
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

const COMPACT = 'px-2! py-1! text-xs! whitespace-nowrap'

// The Solar panels the preview puts on the roof of the selected building, unless the solar preview is turned off.
function solarOfSelection(doc: Doc, selection: Selection | null, solar: boolean | undefined): SolarPanelsDefinition | undefined {
  if (solar === false || selection?.kind !== 'buildings') return undefined
  const building = doc.collections.buildings[selection.id]
  if ((building?.variants as Record<string, unknown> | undefined)?.solar !== undefined) return undefined
  return building?.solarPanels as SolarPanelsDefinition | undefined
}

// The model of the selected Game object, placed as the game places it, with its footprint and the street side (-Z).
export function Preview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<SceneStage | null>(null)
  const [rotation, setRotation] = useState(0)
  const [info, setInfo] = useState<ModelInfo | null>(null)
  const [placed, setPlaced] = useState<PlacedModel | null>(null)
  const modelId = useDocument(state => modelOfSelection(state.doc, state.selection, state.preview))
  const settings = useDocument(state => (modelId ? state.doc.models[modelId] : undefined))
  const library = useLibrary()
  const location = library.byFile.get(settings?.file ?? '')
  const solar = useDocument(state => solarOfSelection(state.doc, state.selection, state.preview.solar))
  const solarAvailable = useDocument(state => state.selection?.kind === 'buildings' && state.doc.collections.buildings[state.selection.id]?.solarPanels !== undefined)
  const solarVariant = useDocument(state => state.selection?.kind === 'buildings' && (state.doc.collections.buildings[state.selection.id]?.variants as Record<string, unknown> | undefined)?.solar !== undefined)
  const solarOn = useDocument(state => state.preview.solar !== false) && !solarVariant
  const showSolar = useDocument(state => state.showSolar)
  const defaultPanelId = useDocument(state => (state.doc.singletons.scenery as { roofPanel: string } | undefined)?.roofPanel)
  const models = useDocument(state => state.doc.models)
  const selectedPanel = useDocument(state => state.selectedPanel)
  const gizmoMode = useDocument(state => state.gizmoMode)
  const selectPanel = useDocument(state => state.selectPanel)
  const setGizmoMode = useDocument(state => state.setGizmoMode)
  const listed = (solar?.panels?.length ?? 0) > 0
  const attached = useRef<{ holder: THREE.Object3D; index: number; top: number } | null>(null)
  const pressed = useRef<{ x: number; y: number; onGizmo: boolean } | null>(null)
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

  // The building alone: rebuilt, and the camera framed, only when its model, settings or rotation change.
  useEffect(() => {
    const stage = stageRef.current!
    stage.clear()
    setInfo(null)
    setPlaced(null)
    if (!location) return
    let live = true
    void buildPlacement(location.pack, location.name, settings, true).then(next => {
      if (!live) return
      next.object.rotation.y = (rotation * Math.PI) / 2
      stage.stage.add(next.object)
      stage.frameStage()
      setInfo(next.info)
      setPlaced(next)
    })
    return () => {
      live = false
    }
  }, [location?.pack, location?.name, settings, rotation])

  // The Solar panels, redrawn on every edit without touching the camera or the building.
  useEffect(() => {
    if (!placed || !solar) return
    const group = new THREE.Group()
    placed.object.add(group)
    let live = true
    const { width, depth } = footprintOf(placed.info, settings)
    solarPanelPlacements(width, depth, solar.panels).forEach((panel, index) => {
      const id = panel.model || defaultPanelId
      const panelSettings = id ? models[id] : undefined
      const panelLocation = library.byFile.get(panelSettings?.file ?? '')
      if (!panelLocation) return
      void buildModel(panelLocation.pack, panelLocation.name, panelSettings).then(({ object }) => {
        if (!live) return
        const holder = new THREE.Group()
        holder.add(object)
        holder.rotation.set(THREE.MathUtils.degToRad(panel.rotationX), THREE.MathUtils.degToRad(panel.rotationY), THREE.MathUtils.degToRad(panel.rotationZ), 'YXZ')
        holder.position.set(panel.x, placed.top + panel.y, panel.z)
        holder.scale.setScalar(panel.scale)
        if (listed) holder.userData.panelIndex = index
        group.add(holder)
        if (listed && index === selectedPanel) {
          attached.current = { holder, index, top: placed.top }
          stageRef.current?.attachGizmo(holder, gizmoMode)
        }
      })
    })
    return () => {
      live = false
      attached.current = null
      stageRef.current?.attachGizmo(null, gizmoMode)
      placed.object.remove(group)
    }
  }, [placed, solar, defaultPanelId, models, library, settings, listed, selectedPanel, gizmoMode])

  // Dropping the gizmo writes the panel's new position and angles to the definition: one undo step per drag.
  useEffect(() => stageRef.current!.onGizmoRelease(() => {
    const target = attached.current
    const { selection, change } = useDocument.getState()
    if (!target || selection?.kind !== 'buildings') return
    const round = (value: number, scale: number) => Math.round(value * scale) / scale
    const degrees = (radians: number) => round(THREE.MathUtils.radToDeg(radians), 10)
    const { holder, index, top } = target
    const values = { x: round(holder.position.x, 1000), y: round(holder.position.y - top, 1000), z: round(holder.position.z, 1000), rotationX: degrees(holder.rotation.x), rotationY: degrees(holder.rotation.y), rotationZ: degrees(holder.rotation.z) }
    change(doc => {
      const definition = doc.collections.buildings[selection.id]
      const current = definition?.solarPanels as SolarPanelsDefinition | undefined
      if (!definition || !current?.panels) return doc
      const panels = current.panels.map((item, position) => (position === index ? { ...item, ...values } : item))
      return setDefinition(doc, 'buildings', selection.id, { ...definition, solarPanels: { ...current, panels } } as Definition)
    })
  }), [])

  // A click on a listed panel selects it for the gizmo; a drag orbits the camera and a click on the gizmo itself is left alone.
  const onPointerDown = (event: React.PointerEvent) => {
    pressed.current = { x: event.clientX, y: event.clientY, onGizmo: stageRef.current?.overGizmo ?? false }
  }
  const onPointerUp = (event: React.PointerEvent) => {
    const start = pressed.current
    pressed.current = null
    if (!start || start.onGizmo || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return
    const index = stageRef.current?.pickAt(event.clientX, event.clientY, object => object.userData.panelIndex as number | undefined)
    if (index !== undefined) selectPanel(index)
  }

  const footprint = info ? footprintOf(info, settings) : null

  return (
    <section className={`${panel} relative overflow-hidden`}>
      <div ref={containerRef} className="absolute inset-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <span className="min-w-0 truncate rounded bg-white/85 px-2 py-1 font-mono text-[11px] text-zinc-600 shadow-sm">{settings?.file ?? 'No model'}</span>
        <div className="pointer-events-auto flex shrink-0 gap-1">
          {listed && selectedPanel !== null && (['translate', 'rotate'] as const).map(mode => (
            <button key={mode} className={`${button(gizmoMode === mode ? 'primary' : 'secondary')} ${COMPACT}`} aria-pressed={gizmoMode === mode} onClick={() => setGizmoMode(mode)}>{mode === 'translate' ? 'Move' : 'Rotate'}</button>
          ))}
          {solarAvailable && <button className={`${button(solarOn ? 'primary' : 'secondary')} ${COMPACT}`} aria-pressed={solarOn} disabled={solarVariant} onClick={() => showSolar(!solarOn)}>☀ Solar {solarOn ? 'on' : 'off'}</button>}
          <button className={`${button('secondary')} ${COMPACT}`} onClick={() => setRotation((rotation + 3) % 4)} aria-label="Rotate left">⟲</button>
          <button className={`${button('secondary')} ${COMPACT}`} onClick={() => setRotation((rotation + 1) % 4)} aria-label="Rotate right">⟳</button>
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

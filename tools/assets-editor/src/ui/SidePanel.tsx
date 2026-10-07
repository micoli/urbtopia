import type { BuildingDefinitions } from '../../../../src/core/buildings/buildingDefinition'
import type { ModelDefinition, ModelSource } from '../../../../src/scene/modelDefinitions'
import { defaultLicense } from '../assetKeys'
import { BuildingFields } from './BuildingFields'
import { CheckboxField } from './components/CheckboxField'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { footprintOf } from '../fitted'
import type { ModelInfo } from '../modelLoader'
import { NumberField } from './components/NumberField'
import { RecolorField } from './components/RecolorField'
import { TextField } from './components/TextField'

type Field = keyof ModelDefinition

const setField = <K extends Field>(definition: ModelDefinition, field: K, value: ModelDefinition[K] | undefined | '') => {
  if (value === undefined || value === '') delete definition[field]
  else definition[field] = value
}

const pair = (width: number | undefined, depth: number | undefined): [number, number] | undefined => (width === undefined && depth === undefined ? undefined : [width ?? 1, depth ?? 1])

interface Props {
  title: string
  info: ModelInfo | undefined
  definition: ModelDefinition | undefined
  buildings: BuildingDefinitions
  onBuildingsChange: (buildings: BuildingDefinitions) => void
  source: ModelSource | undefined
  usedInGame: boolean
  deletable: boolean
  message: string
  onEdit: (mutate: (definition: ModelDefinition) => void) => void
  onRemoveDefinition: () => void
  onDeleteAsset: () => void
}

export function SidePanel({ title, info, definition, buildings, onBuildingsChange, source, usedInGame, deletable, message, onEdit, onRemoveDefinition, onDeleteAsset }: Props) {
  const footprint = info ? footprintOf(info, definition) : { width: 0, depth: 0 }
  const edit = <K extends Field>(field: K) => (value: ModelDefinition[K] | undefined | '') => onEdit((draft) => setField(draft, field, value))

  return (
    <div id="side">
      <h3>{title}</h3>
      {info ? (
        <div>
          <strong>Bbox</strong>: {info.size.x.toFixed(2)} x {info.size.z.toFixed(2)} h {info.size.y.toFixed(2)}
          <br />
          <strong>Min</strong>: {info.min.x.toFixed(2)},{info.min.z.toFixed(2)}
          <br />
          <strong>Max</strong>: {info.max.x.toFixed(2)},{info.max.z.toFixed(2)}
          <br />
          <strong>Tris</strong>: {info.tris}
          <br />
          <strong>Meshes</strong>: {info.meshes}
          {info.nodeScaled && <b><br />node scale != 1 (bake)</b>}
          <br />
          <strong>Footprint</strong>: {footprint.width} x {footprint.depth} {!definition?.footprint && ' (computed)'}
          <br />
          <strong>Source</strong>: {source ?? 'none'}
          <br />
          <strong>Used in game</strong>: {usedInGame ? 'yes' : 'no'}
        </div>
      ) : (
        <div>loading</div>
      )}
      {source ? (
        <>
          <NumberField label="Footprint W (x)" value={definition?.footprint?.[0]} placeholder={String(footprint.width)} onCommit={(value) => onEdit((draft) => setField(draft, 'footprint', pair(value, draft.footprint?.[1] ?? footprint.depth)))} />
          <NumberField label="Footprint D (z)" value={definition?.footprint?.[1]} placeholder={String(footprint.depth)} onCommit={(value) => onEdit((draft) => setField(draft, 'footprint', pair(draft.footprint?.[0] ?? footprint.width, value)))} />
          <NumberField label="Scale" value={definition?.scale} placeholder="1" onCommit={edit('scale')} />
          <NumberField label="Fit width" value={definition?.fit?.width} onCommit={(value) => onEdit((draft) => setField(draft, 'fit', value === undefined ? undefined : { width: value, height: draft.fit?.height ?? value }))} />
          <NumberField label="Fit height" value={definition?.fit?.height} onCommit={(value) => onEdit((draft) => setField(draft, 'fit', value === undefined ? undefined : { width: draft.fit?.width ?? value, height: value }))} />
          <NumberField label="Rotation offset (deg)" value={definition?.rotationOffset} placeholder="0" onCommit={edit('rotationOffset')} />
          <CheckboxField label="Bake node scale" checked={!!definition?.bakeNodeScale} onChange={(checked) => onEdit((draft) => setField(draft, 'bakeNodeScale', checked || undefined))} />
          <RecolorField recolor={definition?.recolor} onChange={(recolor) => onEdit((draft) => setField(draft, 'recolor', recolor))} />
          <BuildingFields model={title} modelFootprint={definition?.footprint} buildings={buildings} onChange={onBuildingsChange} />
          <TextField label="License" value={definition?.license ?? defaultLicense(source)} onCommit={edit('license')} />
          <TextField label="Author" value={definition?.author ?? ''} onCommit={edit('author')} />
          <TextField label="Url" value={definition?.url ?? ''} onCommit={edit('url')} />
          <TextField label="Note" value={definition?.note ?? ''} onCommit={edit('note')} />
          <button onClick={onRemoveDefinition}>remove definition (use computed defaults)</button>
          {deletable && <ConfirmDeleteDialog assetKey={title} onConfirm={onDeleteAsset} />}
          <div>{message}</div>
        </>
      ) : (
        <div>not part of a managed source: read only</div>
      )}
    </div>
  )
}

import type { ModelDefinition, ModelSource } from '../../../src/scene/modelDefinitions'
import { defaultLicense } from './assetKeys'
import { CheckboxField } from './CheckboxField'
import { footprintOf } from './fitted'
import type { ModelInfo } from './modelLoader'
import { NumberField } from './NumberField'
import { RecolorField } from './RecolorField'
import { TextField } from './TextField'

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
  source: ModelSource | undefined
  usedInGame: boolean
  deletable: boolean
  message: string
  onEdit: (mutate: (definition: ModelDefinition) => void) => void
  onRemoveDefinition: () => void
  onDeleteAsset: () => void
}

export function SidePanel({ title, info, definition, source, usedInGame, deletable, message, onEdit, onRemoveDefinition, onDeleteAsset }: Props) {
  const footprint = info ? footprintOf(info, definition) : { width: 0, depth: 0 }
  const edit = <K extends Field>(field: K) => (value: ModelDefinition[K] | undefined | '') => onEdit((draft) => setField(draft, field, value))

  return (
    <div id="side">
      <h3>{title}</h3>
      {info ? (
        <div>
          bbox {info.size.x.toFixed(2)} x {info.size.z.toFixed(2)} h {info.size.y.toFixed(2)}
          <br />
          min {info.min.x.toFixed(2)},{info.min.z.toFixed(2)} max {info.max.x.toFixed(2)},{info.max.z.toFixed(2)}
          <br />
          tris {info.tris} meshes {info.meshes}
          {info.nodeScaled && <b><br />node scale != 1 (bake)</b>}
          <br />
          footprint {footprint.width} x {footprint.depth}
          {!definition?.footprint && ' (computed)'}
          <br />
          source {source ?? 'none'}, {usedInGame ? 'used in game' : 'not used in game'}
        </div>
      ) : (
        <div>loading</div>
      )}
      {source ? (
        <>
          <NumberField label="footprint W (x)" value={definition?.footprint?.[0]} placeholder={String(footprint.width)} onCommit={(value) => onEdit((draft) => setField(draft, 'footprint', pair(value, draft.footprint?.[1] ?? footprint.depth)))} />
          <NumberField label="footprint D (z)" value={definition?.footprint?.[1]} placeholder={String(footprint.depth)} onCommit={(value) => onEdit((draft) => setField(draft, 'footprint', pair(draft.footprint?.[0] ?? footprint.width, value)))} />
          <NumberField label="scale" value={definition?.scale} placeholder="1" onCommit={edit('scale')} />
          <NumberField label="fit width" value={definition?.fit?.width} onCommit={(value) => onEdit((draft) => setField(draft, 'fit', value === undefined ? undefined : { width: value, height: draft.fit?.height ?? value }))} />
          <NumberField label="fit height" value={definition?.fit?.height} onCommit={(value) => onEdit((draft) => setField(draft, 'fit', value === undefined ? undefined : { width: draft.fit?.width ?? value, height: value }))} />
          <NumberField label="rotation offset (deg)" value={definition?.rotationOffset} placeholder="0" onCommit={edit('rotationOffset')} />
          <CheckboxField label="bake node scale" checked={!!definition?.bakeNodeScale} onChange={(checked) => onEdit((draft) => setField(draft, 'bakeNodeScale', checked || undefined))} />
          <RecolorField recolor={definition?.recolor} onChange={(recolor) => onEdit((draft) => setField(draft, 'recolor', recolor))} />
          <TextField label="license" value={definition?.license ?? defaultLicense(source)} onCommit={edit('license')} />
          <TextField label="author" value={definition?.author ?? ''} onCommit={edit('author')} />
          <TextField label="url" value={definition?.url ?? ''} onCommit={edit('url')} />
          <TextField label="note" value={definition?.note ?? ''} onCommit={edit('note')} />
          <button onClick={onRemoveDefinition}>remove definition (use computed defaults)</button>
          {deletable && <button onClick={onDeleteAsset}>delete this asset</button>}
          <div>{message}</div>
        </>
      ) : (
        <div>not part of a managed source: read only</div>
      )}
    </div>
  )
}

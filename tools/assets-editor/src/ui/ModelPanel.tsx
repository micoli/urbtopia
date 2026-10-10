import { useState } from 'react'
import type { ModelEntry } from '../../../../src/core/models/modelSchema'
import { useDirty } from '../hooks/useDirty'
import { useLibrary } from '../hooks/useLibrary'
import { useProblems } from '../hooks/useProblems'
import { MODEL_FIELDS, type FieldSpec } from '../schema/fields'
import { useDocument } from '../store/documentStore'
import { removeModel, setModel } from '../store/edits'
import { RecolorControl } from './form/RecolorControl'
import { SchemaForm } from './form/SchemaForm'
import { RenameModelDialog } from './RenameModelDialog'
import { badge, button, panel } from './styles'
import { Tabs } from './Tabs'
import { UsedByList } from './UsedByList'

const HINTS: Record<string, string> = {
  footprint: 'Tiles taken on the map; computed from the bounding box when unset.',
  scale: 'Uniform scale applied by the game, with Center as the pivot.',
  fit: 'Scales the model down to fit this width and height (nature elements).',
}

interface Props {
  id: string
}

export function ModelPanel({ id }: Props) {
  const model = useDocument(state => state.doc.models[id]!)
  const { change, select } = useDocument.getState()
  const problems = useProblems().of('models', id)
  const dirty = useDirty().has('models', id)
  const library = useLibrary()
  const users = library.usersOf(id)
  const [renaming, setRenaming] = useState(false)

  const setField = (key: string, value: unknown) => change(doc => setModel(doc, id, { ...model, [key]: value } as ModelEntry))
  const custom = (field: FieldSpec) => (field.key === 'recolor' ? <RecolorControl recolor={model.recolor} onChange={recolor => setField('recolor', recolor)} /> : null)
  const removable = !users.length && !library.inScene(model.file)

  return (
    <article className={`${panel} flex flex-col`}>
      <header className="flex flex-wrap items-start gap-3 border-b border-zinc-200 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-mono text-lg font-semibold">{id}</h2>
            <span className={badge('indigo')}>{model.source}</span>
            {dirty && <span className={badge('amber')}>modified</span>}
            {removable && <span className={badge()}>orphan</span>}
          </div>
          <p className="truncate font-mono text-xs text-zinc-500">{model.file}</p>
        </div>
        <div className="flex gap-2">
          <button className={button()} onClick={() => setRenaming(true)}>Rename</button>
          <button
            className={button('danger')}
            disabled={!removable}
            title={removable ? 'The model falls back to computed defaults' : 'Used by a Game object or the scene'}
            onClick={() => {
              change(doc => removeModel(doc, id))
              select(null)
            }}
          >
            Remove definition
          </button>
        </div>
      </header>
      <Tabs
        tabs={[
          { id: 'general', label: 'General', badge: problems.length, content: <SchemaForm fields={MODEL_FIELDS} value={model} problems={problems} onChange={setField} custom={custom} hints={HINTS} /> },
          { id: 'used', label: `Used by · ${users.length}`, content: <UsedByList modelId={id} /> },
        ]}
      />
      {renaming && <RenameModelDialog id={id} onClose={() => setRenaming(false)} />}
    </article>
  )
}

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
import { modelIdOf } from '../../../../scripts/definitionProblems'
import type { DragData, ModelDrop } from '../dnd'
import { useLibrary } from '../hooks/useLibrary'
import { useSave } from '../hooks/useSave'
import { useShortcuts } from '../hooks/useShortcuts'
import { isFreelyDefinable } from '../library/modelFiles'
import { useDocument } from '../store/documentStore'
import { reorderSection, sectionOf, setModel } from '../store/edits'
import { BuildingList } from './BuildingList'
import { DragPreview } from './DragPreview'
import { FileDropZone } from './FileDropZone'
import { KindNav } from './KindNav'
import { LibraryDrawer } from './LibraryDrawer'
import { ModelList } from './ModelList'
import { ObjectPanel } from './ObjectPanel'
import { Preview } from './Preview'
import { TopBar } from './TopBar'

export function Shell() {
  const kind = useDocument(state => state.kind)
  const save = useSave()
  const library = useLibrary()
  const [dragging, setDragging] = useState<DragData | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  useShortcuts(() => void save())

  const dropModel = (file: string, drop: ModelDrop) => {
    const entry = library.byFile.get(file)
    const { change, setStatus } = useDocument.getState()
    if (!entry?.id && !isFreelyDefinable(entry?.source)) return setStatus(`Define ${file} before using it`)
    change(doc => {
      if (entry?.id) return drop.assign(doc, entry.id)
      const id = modelIdOf(file)
      return drop.assign(setModel(doc, id, { file, source: entry!.source!, license: 'CC0' }), id)
    })
  }

  const moveBuilding = (id: string, overId: string) => {
    const { doc, change } = useDocument.getState()
    const section = sectionOf(doc.buildings[id]!)
    const members = Object.keys(doc.buildings).filter(key => sectionOf(doc.buildings[key]!) === section)
    const from = members.indexOf(id), to = members.indexOf(overId)
    if (from < 0 || to < 0 || from === to) return
    change(current => reorderSection(current, arrayMove(members, from, to)))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    const data = active.data.current as DragData | undefined
    if (!data || !over) return
    if (data.type === 'model' && over.data.current?.type === 'model-field') dropModel(data.file, over.data.current as ModelDrop)
    if (data.type === 'building') moveBuilding(data.id, String(over.id))
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <TopBar onSave={() => void save()} />
      <DndContext sensors={sensors} onDragStart={({ active }: DragStartEvent) => setDragging((active.data.current as DragData) ?? null)} onDragCancel={() => setDragging(null)} onDragEnd={onDragEnd}>
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-auto p-3 lg:grid-cols-[19rem_minmax(0,1fr)_24rem] lg:overflow-hidden">
          <aside className="flex min-h-[24rem] flex-col gap-2 lg:min-h-0">
            <KindNav />
            {kind === 'building' ? <BuildingList /> : <ModelList />}
          </aside>
          <main className="min-h-0 lg:overflow-auto">
            <ObjectPanel />
          </main>
          <aside className="grid min-h-[36rem] grid-rows-[15rem_minmax(0,1fr)] gap-3 lg:min-h-0">
            <Preview />
            <LibraryDrawer />
          </aside>
        </div>
        <DragOverlay dropAnimation={null}>{dragging ? <DragPreview data={dragging} /> : null}</DragOverlay>
      </DndContext>
      <FileDropZone />
    </div>
  )
}

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { BUILD_SECTION_TITLES } from '../../../../src/core/buildings/buildSections'
import { useDocument } from '../store/documentStore'
import { sectionOf } from '../store/edits'
import { BuildingRow } from './BuildingRow'
import { CreateBuildingDialog } from './CreateBuildingDialog'
import { button, input, panel } from './styles'

const sectionLabel = (section: string) => section.replace('build.', '').replace(/([A-Z])/g, ' $1').toLowerCase()

export function BuildingList() {
  const buildings = useDocument(state => state.doc.buildings)
  const [query, setQuery] = useState('')
  const [section, setSection] = useState('')
  const [creating, setCreating] = useState(false)
  const search = query.trim().toLowerCase()

  const groups = useMemo(() => {
    const matches = Object.entries(buildings).filter(([id, building]) => (!section || sectionOf(building) === section) && (!search || `${id} ${building.name.en} ${building.name.fr}`.toLowerCase().includes(search)))
    const bySection = Map.groupBy(matches, ([, building]) => sectionOf(building))
    return BUILD_SECTION_TITLES.filter(title => bySection.has(title)).map(title => ({ title, ids: bySection.get(title)!.map(([id]) => id) }))
  }, [buildings, section, search])

  return (
    <div className={`${panel} flex min-h-0 flex-1 flex-col`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-2">
        <div className="flex gap-2">
          <input className={input} placeholder="Search buildings" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search buildings" />
          <button className={button('primary')} onClick={() => setCreating(true)}>New</button>
        </div>
        <select className={input} value={section} onChange={event => setSection(event.target.value)} aria-label="Section">
          <option value="">All sections</option>
          {BUILD_SECTION_TITLES.map(title => <option key={title} value={title}>{sectionLabel(title)}</option>)}
        </select>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        {groups.map(({ title, ids }) => (
          <section key={title} className="mb-2">
            <h2 className="sticky top-0 z-10 bg-white/95 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase backdrop-blur">{sectionLabel(title)} <span className="font-normal text-zinc-400">{ids.length}</span></h2>
            <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={search !== ''}>
              {ids.map(id => <BuildingRow key={id} id={id} section={title} />)}
            </SortableContext>
          </section>
        ))}
        {!groups.length && <p className="p-4 text-center text-sm text-zinc-500">No building matches.</p>}
      </div>
      {creating && <CreateBuildingDialog onClose={() => setCreating(false)} />}
    </div>
  )
}

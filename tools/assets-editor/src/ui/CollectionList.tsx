import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { BUILD_SECTION_TITLES } from '../../../../src/core/buildings/buildSections'
import { specOf, type CollectionName } from '../../../../scripts/collections'
import { useDocument } from '../store/documentStore'
import { groupOf } from '../store/edits'
import { CreateDialog } from './CreateDialog'
import { DefinitionRow } from './DefinitionRow'
import { button, input, panel } from './styles'

const groupLabel = (group: string) => group.replace('build.', '').replace(/([A-Z])/g, ' $1').toLowerCase()

interface Props {
  collection: CollectionName
}

// Rows are grouped (build menu sections for buildings) and can be dragged within their group.
export function CollectionList({ collection }: Props) {
  const definitions = useDocument(state => state.doc.collections[collection])
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [creating, setCreating] = useState(false)
  const search = query.trim().toLowerCase()
  const sectioned = collection === 'buildings'

  const groups = useMemo(() => {
    const text = (id: string) => `${id} ${JSON.stringify((definitions[id] as { name?: unknown }).name ?? '')}`.toLowerCase()
    const matches = Object.keys(definitions).filter(id => (!group || groupOf(collection, definitions[id]!) === group) && (!search || text(id).includes(search)))
    const byGroup = Map.groupBy(matches, id => groupOf(collection, definitions[id]!))
    const order = sectioned ? BUILD_SECTION_TITLES.filter(title => byGroup.has(title)) : [...byGroup.keys()]
    return order.map(title => ({ title, ids: byGroup.get(title)! }))
  }, [definitions, collection, group, search, sectioned])

  return (
    <div className={`${panel} flex min-h-0 flex-1 flex-col`}>
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-2">
        <div className="flex gap-2">
          <input className={input} placeholder={`Search ${specOf(collection).title.toLowerCase()}`} value={query} onChange={event => setQuery(event.target.value)} aria-label="Search" />
          <button className={button('primary')} onClick={() => setCreating(true)}>New</button>
        </div>
        {sectioned && (
          <select className={input} value={group} onChange={event => setGroup(event.target.value)} aria-label="Section">
            <option value="">All sections</option>
            {BUILD_SECTION_TITLES.map(title => <option key={title} value={title}>{groupLabel(title)}</option>)}
          </select>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        {groups.map(({ title, ids }) => (
          <section key={title} className="mb-2">
            {sectioned && <h2 className="sticky top-0 z-10 bg-white/95 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase backdrop-blur">{groupLabel(title)} <span className="font-normal text-zinc-400">{ids.length}</span></h2>}
            <SortableContext items={ids.map(id => `${collection}:${id}`)} strategy={verticalListSortingStrategy} disabled={search !== ''}>
              {ids.map(id => <DefinitionRow key={id} collection={collection} id={id} />)}
            </SortableContext>
          </section>
        ))}
        {!groups.length && <p className="p-4 text-center text-sm text-zinc-500">Nothing matches.</p>}
      </div>
      {creating && <CreateDialog collection={collection} onClose={() => setCreating(false)} />}
    </div>
  )
}

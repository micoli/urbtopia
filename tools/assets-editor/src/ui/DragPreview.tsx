import type { DragData } from '../dnd'
import { useDocument } from '../store/documentStore'
import { Thumbnail } from './Thumbnail'

interface Props {
  data: DragData
}

export function DragPreview({ data }: Props) {
  const name = useDocument(state => (data.type === 'building' ? state.doc.buildings[data.id]?.name.en : undefined))
  if (data.type === 'model')
    return (
      <div className="flex w-40 items-center gap-2 rounded-lg bg-white p-1.5 shadow-xl ring-1 ring-indigo-300">
        <Thumbnail file={data.file} className="h-10 w-10 shrink-0" />
        <span className="truncate text-xs font-medium">{data.file}</span>
      </div>
    )
  return <div className="rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-xl ring-1 ring-indigo-300">{name || data.id}</div>
}

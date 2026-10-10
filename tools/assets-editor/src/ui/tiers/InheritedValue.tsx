import type { FieldSpec } from '../../schema/fields'
import { useDocument } from '../../store/documentStore'
import { Thumbnail } from '../Thumbnail'

interface Props {
  field: FieldSpec
  value: unknown
}

const summary = (value: unknown): string => {
  if (value === undefined) return '—'
  if (Array.isArray(value)) return value.join(' × ')
  if (value && typeof value === 'object')
    return Object.entries(value)
      .map(([key, part]) => (part && typeof part === 'object' ? Object.entries(part).map(([name, amount]) => `${name} ${amount}`).join(', ') : `${part} ${key}`))
      .filter(Boolean)
      .join(' · ')
  return String(value)
}

// A value the Tier keeps from the previous one, shown greyed.
export function InheritedValue({ field, value }: Props) {
  const file = useDocument(state => (field.type === 'model' && typeof value === 'string' ? state.doc.models[value]?.file : undefined))
  if (field.type === 'model' && typeof value === 'string')
    return (
      <span className="flex items-center gap-2 opacity-60">
        <Thumbnail file={file} className="h-9 w-9 shrink-0" />
        <span className="truncate font-mono text-[11px]">{value}</span>
      </span>
    )
  return <span className="text-sm text-zinc-400 italic">{summary(value)}</span>
}

import type { CollectionName } from '../../../../../scripts/collections'
import { useDocument } from '../../store/documentStore'
import { button, input } from '../styles'
import { NumberControl } from './NumberControl'

interface Props {
  value: Record<string, number> | undefined
  targets: readonly CollectionName[]
  integer: boolean
  min?: number
  label: string
  compact?: boolean
  onChange: (value: Record<string, number>) => void
}

// A record keyed by ids of other collections, such as a recipe of Materials and Crops.
export function RecordControl({ value, targets, integer, min, label, compact, onChange }: Props) {
  const collections = useDocument(state => state.doc.collections)
  const entries = Object.entries(value ?? {})
  const options = targets.flatMap(target => Object.keys(collections[target]))
  const unused = options.filter(option => !(option in (value ?? {})))
  const replaceKey = (from: string, to: string) => onChange(Object.fromEntries(entries.map(([key, amount]) => [key === from ? to : key, amount])))

  return (
    <div className="flex flex-col gap-1.5">
      {entries.map(([key, amount]) => (
        <div key={key} className={`grid items-center gap-2 ${compact ? 'grid-cols-[minmax(0,1fr)_4rem_auto]' : 'grid-cols-[minmax(0,1fr)_6rem_auto]'}`}>
          <select className={input} aria-label={`${label} id`} value={key} onChange={event => replaceKey(key, event.target.value)}>
            {[key, ...unused].map(option => <option key={option}>{option}</option>)}
          </select>
          <NumberControl value={amount} integer={integer} min={min} label={`${label} ${key}`} onChange={next => onChange({ ...value, [key]: next ?? min ?? 1 })} />
          <button className={button('ghost')} aria-label={`Remove ${key}`} onClick={() => onChange(Object.fromEntries(entries.filter(([candidate]) => candidate !== key)))}>×</button>
        </div>
      ))}
      {unused.length > 0 && (
        <button className={`${button('ghost')} self-start`} onClick={() => onChange({ ...value, [unused[0]!]: min ?? 1 })}>＋ add</button>
      )}
    </div>
  )
}

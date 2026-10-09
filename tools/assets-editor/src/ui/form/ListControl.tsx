import type { ReactNode } from 'react'
import type { FieldSpec } from '../../schema/fields'
import { button } from '../styles'

interface Props {
  value: Record<string, unknown>[] | undefined
  fields: FieldSpec[]
  renderItem: (item: Record<string, unknown>, index: number, onItem: (item: Record<string, unknown>) => void) => ReactNode
  onChange: (value: Record<string, unknown>[]) => void
}

const blankOf = (fields: FieldSpec[]): Record<string, unknown> =>
  Object.fromEntries(fields.filter(field => field.required).map(field => [field.key, field.type === 'number' ? Math.max(1, field.min ?? 1) : field.type === 'switch' ? false : '']))

export function ListControl({ value, fields, renderItem, onChange }: Props) {
  const items = value ?? []
  const setItem = (index: number) => (item: Record<string, unknown>) => onChange(items.map((current, position) => (position === index ? item : current)))

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="relative rounded-lg bg-zinc-50 p-3 pr-10 ring-1 ring-zinc-200">
          {renderItem(item, index, setItem(index))}
          <button className={`${button('ghost')} absolute top-2 right-2`} aria-label={`Remove item ${index + 1}`} onClick={() => onChange(items.filter((_, position) => position !== index))}>×</button>
        </div>
      ))}
      <button className={`${button('ghost')} self-start`} onClick={() => onChange([...items, blankOf(fields)])}>＋ add</button>
    </div>
  )
}

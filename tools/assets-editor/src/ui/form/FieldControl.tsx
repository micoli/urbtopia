import type { ReactNode } from 'react'
import type { LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import type { FieldSpec } from '../../schema/fields'
import type { Doc } from '../../store/documentStore'
import { ChoicesControl } from './ChoicesControl'
import { LocalizedControl } from './LocalizedControl'
import { ModelControl } from './ModelControl'
import { NumberControl } from './NumberControl'
import { NumberListControl } from './NumberListControl'
import { PairControl } from './PairControl'
import { RecordControl } from './RecordControl'
import { SelectControl } from './SelectControl'
import { SwitchControl } from './SwitchControl'
import { TextControl } from './TextControl'

export type FieldPath = readonly (string | number)[]

export interface ModelSlot {
  dropId: string
  assign: (doc: Doc, modelId: string) => Doc
}

interface Props {
  field: FieldSpec
  value: unknown
  path: FieldPath
  onChange: (value: unknown) => void
  modelSlot?: (path: FieldPath) => ModelSlot
  nested: (field: FieldSpec & { type: 'object' | 'list' }) => ReactNode
  custom?: (field: FieldSpec) => ReactNode
  compact?: boolean
}

export function FieldControl({ field, value, path, onChange, modelSlot, nested, custom, compact }: Props) {
  const modelControl = (current: string | undefined, at: FieldPath, label: string, set: (id: string) => void) => {
    const slot = modelSlot?.(at)
    return slot ? <ModelControl value={current} label={label} dropId={slot.dropId} assign={slot.assign} onChange={set} compact={compact} /> : null
  }

  switch (field.type) {
    case 'text':
      return <TextControl value={value as string | undefined} label={field.label} readOnly={field.readOnly} onChange={onChange} />
    case 'model':
      return modelControl(value as string | undefined, path, field.label, onChange)
    case 'modelList': {
      const ids = (value as string[] | undefined) ?? []
      return (
        <div className="grid gap-2">
          {Array.from({ length: field.count }, (_, index) => (
            <div key={index}>{modelControl(ids[index], [...path, index], `${field.label} ${index + 1}`, id => onChange(Array.from({ length: field.count }, (_, position) => (position === index ? id : (ids[position] ?? id)))))}</div>
          ))}
        </div>
      )
    }
    case 'number':
      return <NumberControl value={value as number | undefined} integer={field.integer} min={field.min} label={field.label} onChange={onChange} />
    case 'switch':
      return <SwitchControl checked={value === true} label={field.label} onChange={checked => onChange(checked || (field.required ? false : undefined))} />
    case 'select':
      return <SelectControl value={value as string | undefined} options={field.options} label={field.label} required={field.required} onChange={onChange} />
    case 'pair':
      return <PairControl value={value as [number, number] | undefined} integer={field.integer} min={field.min} parts={field.parts} label={field.label} onChange={onChange} />
    case 'choices':
      return <ChoicesControl value={value as string[] | undefined} options={field.options} onChange={onChange} />
    case 'numberList':
      return <NumberListControl value={value as number[] | undefined} label={field.label} onChange={onChange} />
    case 'localized':
      return <LocalizedControl value={value as LocalizedText | undefined} label={field.label} onChange={onChange} />
    case 'record':
      return <RecordControl value={value as Record<string, number> | undefined} targets={field.targets} keys={field.keys} integer={field.integer} min={field.min} label={field.label} onChange={onChange} compact={compact} />
    case 'object':
    case 'list':
      return nested(field)
    case 'map':
      return null
    case 'custom':
      return custom?.(field) ?? null
  }
}

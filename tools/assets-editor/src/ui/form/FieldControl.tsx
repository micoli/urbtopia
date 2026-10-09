import type { ReactNode } from 'react'
import type { LocalizedText } from '../../../../../src/core/buildings/buildingDefinition'
import type { FieldSpec } from '../../schema/fields'
import type { Doc } from '../../store/documentStore'
import { ChoicesControl } from './ChoicesControl'
import { LocalizedControl } from './LocalizedControl'
import { ModelControl } from './ModelControl'
import { NumberControl } from './NumberControl'
import { PairControl } from './PairControl'
import { SelectControl } from './SelectControl'
import { SwitchControl } from './SwitchControl'
import { TextControl } from './TextControl'

export interface ModelSlot {
  dropId: string
  assign: (doc: Doc, modelId: string) => Doc
}

interface Props {
  field: FieldSpec
  value: unknown
  onChange: (value: unknown) => void
  modelSlot?: ModelSlot
  nested?: (field: FieldSpec & { type: 'object' }) => ReactNode
  custom?: (field: FieldSpec) => ReactNode
}

export function FieldControl({ field, value, onChange, modelSlot, nested, custom }: Props) {
  switch (field.type) {
    case 'text':
      return <TextControl value={value as string | undefined} label={field.label} readOnly={field.readOnly} onChange={onChange} />
    case 'model':
      return modelSlot ? <ModelControl value={value as string | undefined} label={field.label} dropId={modelSlot.dropId} assign={modelSlot.assign} onChange={onChange} /> : null
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
    case 'localized':
      return <LocalizedControl value={value as LocalizedText | undefined} label={field.label} onChange={onChange} />
    case 'object':
      return nested?.(field) ?? null
    case 'custom':
      return custom?.(field) ?? null
  }
}

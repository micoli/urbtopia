import type { Problem } from '../../../../scripts/definitionProblems'
import type { FieldSpec } from '../schema/fields'
import { useDocument } from '../store/documentStore'
import { FieldDocsScope } from './form/fieldDocsScope'
import { SchemaForm } from './form/SchemaForm'
import { SwitchControl } from './form/SwitchControl'

type Solar = Record<string, unknown>

interface Props {
  solar: Solar | undefined
  fields: FieldSpec[]
  problems: Problem[]
  onChange: (solar: Solar | undefined) => void
}

const HINTS = { panels: 'Leave empty for one panel per footprint tile.' }

// Turns Solar panels on or off for the building and sets how they look and what they cost; the preview shows them on its roof.
export function SolarTab({ solar, fields, problems, onChange }: Props) {
  const previewing = useDocument(state => state.preview.solar === true)
  const showSolar = useDocument(state => state.showSolar)
  const enabled = solar !== undefined
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
        <SwitchControl checked={enabled} label="Solar panels" onChange={checked => { onChange(checked ? {} : undefined); showSolar(checked) }} />
        {enabled ? 'On: the player can equip this building with Solar panels' : 'Off: this building cannot have Solar panels'}
      </label>
      {enabled && (
        <>
          <label className="flex items-center gap-3 text-sm text-zinc-600">
            <SwitchControl checked={previewing} label="Show the panels in the preview" onChange={showSolar} />
            Show the panels in the preview
          </label>
          <FieldDocsScope value={['solarPanels']}>
            <SchemaForm fields={fields} value={solar} problems={problems} hints={HINTS} onChange={(key, value) => onChange({ ...solar, [key]: value })} />
          </FieldDocsScope>
        </>
      )}
    </div>
  )
}

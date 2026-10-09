import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import { FieldControl, type FieldPath, type ModelSlot } from '../form/FieldControl'
import { SchemaForm } from '../form/SchemaForm'
import { InheritedValue } from './InheritedValue'

interface Props {
  field: FieldSpec
  own: unknown
  effective: unknown
  inherits: boolean
  // False where the field has no place, such as an upgrade cost on Tier 1.
  settable: boolean
  path: FieldPath
  problems: Problem[]
  modelSlot: (path: FieldPath) => ModelSlot
  onChange: (value: unknown) => void
}

const fallbackOf = (field: FieldSpec): unknown => {
  if (field.type === 'number') return Math.max(field.min ?? 0, field.integer ? 1 : 0)
  if (field.type === 'pair') return [1, 1]
  if (field.type === 'object') return Object.fromEntries(field.fields.filter(({ required }) => required).map(child => [child.key, fallbackOf(child)]))
  if (field.type === 'switch') return false
  return ''
}

// A cell holds the Tier's own value, or shows what it inherits with a way to override it.
export function TierCell({ field, own, effective, inherits, settable, path, problems, modelSlot, onChange }: Props) {
  const errors = problems.map(({ path: at, message }) => (at ? `${at}: ${message}` : message))
  const control =
    field.type === 'object' ? (
      <SchemaForm compact fields={field.fields} value={(own as Record<string, unknown>) ?? {}} problems={problems} path={path} modelSlot={modelSlot} onChange={(key, next) => onChange({ ...((own as object) ?? {}), [key]: next })} />
    ) : (
      <FieldControl compact field={field} value={own} path={path} onChange={onChange} modelSlot={modelSlot} nested={() => null} />
    )

  return (
    <div className={`flex min-h-10 flex-col gap-1 rounded-md p-1.5 ${errors.length ? 'bg-red-50 ring-1 ring-red-300' : ''}`}>
      {own === undefined ? (
        <div className="flex items-center justify-between gap-2">
          <InheritedValue field={field} value={inherits ? effective : undefined} />
          {settable && (
            <button className="shrink-0 rounded px-1.5 text-[11px] text-indigo-600 hover:bg-indigo-50" onClick={() => onChange(structuredClone(inherits && effective !== undefined ? effective : fallbackOf(field)))}>
              {inherits && effective !== undefined ? 'override' : 'set'}
            </button>
          )}
        </div>
      ) : (
        <>
          {control}
          <button className="self-end rounded px-1.5 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={() => onChange(undefined)}>
            {inherits ? 'inherit' : 'unset'}
          </button>
        </>
      )}
      {errors.map((error, index) => <p key={index} className="text-[11px] text-red-600">{error}</p>)}
    </div>
  )
}

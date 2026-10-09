import type { ReactNode } from 'react'
import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import { FieldControl, type ModelSlot } from './FieldControl'
import { FieldShell } from './FieldShell'

interface Props {
  fields: FieldSpec[]
  value: Record<string, unknown>
  problems: Problem[]
  onChange: (key: string, value: unknown) => void
  modelSlot?: (key: string) => ModelSlot
  custom?: (field: FieldSpec) => ReactNode
  hints?: Record<string, string>
}

const errorsOf = (problems: Problem[], key: string) =>
  problems.filter(({ path }) => path === key || path.startsWith(`${key}.`)).map(({ path, message }) => (path === key ? message : `${path.slice(key.length + 1)}: ${message}`))

// Required fields come from the schema; an optional field can be unset to fall back to its default.
export function SchemaForm({ fields, value, problems, onChange, modelSlot, custom, hints }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map(field => {
        const current = value[field.key]
        const nested = (object: FieldSpec & { type: 'object' }) => (
          <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-200">
            <SchemaForm
              fields={object.fields}
              value={(current as Record<string, unknown> | undefined) ?? {}}
              problems={problems.filter(({ path }) => path.startsWith(`${field.key}.`)).map(problem => ({ ...problem, path: problem.path.slice(field.key.length + 1) }))}
              onChange={(key, next) => onChange(field.key, { ...((current as object | undefined) ?? {}), [key]: next })}
            />
          </div>
        )
        return (
          <FieldShell
            key={field.key}
            label={field.label}
            required={field.required}
            errors={field.type === 'object' ? [] : errorsOf(problems, field.key)}
            hint={hints?.[field.key]}
            onClear={!field.required && current !== undefined && field.type !== 'custom' ? () => onChange(field.key, undefined) : undefined}
          >
            <FieldControl field={field} value={current} onChange={next => onChange(field.key, next)} modelSlot={modelSlot?.(field.key)} nested={nested} custom={custom} />
          </FieldShell>
        )
      })}
    </div>
  )
}

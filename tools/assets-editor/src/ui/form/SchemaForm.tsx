import type { ReactNode } from 'react'
import type { Problem } from '../../../../../scripts/definitionProblems'
import type { FieldSpec } from '../../schema/fields'
import { FieldControl, type FieldPath, type ModelSlot } from './FieldControl'
import { FieldShell } from './FieldShell'
import { ListControl } from './ListControl'

interface Props {
  fields: FieldSpec[]
  value: Record<string, unknown>
  problems: Problem[]
  onChange: (key: string, value: unknown) => void
  path?: FieldPath
  modelSlot?: (path: FieldPath) => ModelSlot
  custom?: (field: FieldSpec) => ReactNode
  hints?: Record<string, string>
  compact?: boolean
}

const errorsOf = (problems: Problem[], key: string) =>
  problems.filter(({ path }) => path === key || path.startsWith(`${key}.`)).map(({ path, message }) => (path === key ? message : `${path.slice(key.length + 1)}: ${message}`))

const within = (problems: Problem[], prefix: string) => problems.filter(({ path }) => path.startsWith(`${prefix}.`)).map(problem => ({ ...problem, path: problem.path.slice(prefix.length + 1) }))

// Required fields come from the schema; an optional field can be unset to fall back to its default.
export function SchemaForm({ fields, value, problems, onChange, path = [], modelSlot, custom, hints, compact }: Props) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {fields.map(field => {
        const current = value[field.key]
        const at = [...path, field.key]
        const nested = (container: FieldSpec & { type: 'object' | 'list' }) =>
          container.type === 'object' ? (
            <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-200">
              <SchemaForm
                fields={container.fields}
                value={(current as Record<string, unknown> | undefined) ?? {}}
                problems={within(problems, field.key)}
                path={at}
                modelSlot={modelSlot}
                onChange={(key, next) => onChange(field.key, { ...((current as object | undefined) ?? {}), [key]: next })}
              />
            </div>
          ) : (
            <ListControl
              value={current as Record<string, unknown>[] | undefined}
              fields={container.fields}
              onChange={next => onChange(field.key, next)}
              renderItem={(item, index, onItem) => (
                <SchemaForm fields={container.fields} value={item} problems={within(problems, `${field.key}.${index}`)} path={[...at, index]} modelSlot={modelSlot} onChange={(key, next) => onItem({ ...item, [key]: next })} />
              )}
            />
          )
        const containerErrors = field.type === 'object' || field.type === 'list' ? problems.filter(({ path: problemPath }) => problemPath === field.key).map(({ message }) => message) : errorsOf(problems, field.key)
        return (
          <FieldShell
            key={field.key}
            name={field.key}
            label={field.label}
            required={field.required}
            errors={containerErrors}
            hint={hints?.[field.key]}
            compact={compact}
            onClear={!field.required && current !== undefined && field.type !== 'custom' ? () => onChange(field.key, undefined) : undefined}
          >
            <FieldControl field={field} value={current} path={at} onChange={next => onChange(field.key, next)} modelSlot={modelSlot} nested={nested} custom={custom} compact={compact} />
          </FieldShell>
        )
      })}
    </div>
  )
}

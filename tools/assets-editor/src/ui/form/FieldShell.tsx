import type { ReactNode } from 'react'
import { FieldHelp } from './FieldHelp'

interface Props {
  // The property it edits, to document it.
  name?: string
  label: string
  required: boolean
  errors: string[]
  onClear?: () => void
  hint?: string
  // Label above the control, for narrow places such as a Tier cell.
  compact?: boolean
  children: ReactNode
}

export function FieldShell({ name, label, required, errors, onClear, hint, compact, children }: Props) {
  return (
    <div className={compact ? 'grid gap-1' : 'grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-3'}>
      <div className={`flex items-center gap-1 text-zinc-600 ${compact ? 'text-xs' : 'pt-1.5 text-sm'}`}>
        {name ? <FieldHelp name={name}>{label}</FieldHelp> : <span>{label}</span>}
        {required && <span className="text-red-500" aria-label="required">*</span>}
        {onClear && (
          <button className="ml-auto rounded px-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={onClear} title="Unset: use the default">
            unset
          </button>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        {children}
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
        {errors.map((error, index) => <p key={index} className="text-xs text-red-600">{error}</p>)}
      </div>
    </div>
  )
}

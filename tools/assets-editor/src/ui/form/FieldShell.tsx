import type { ReactNode } from 'react'

interface Props {
  label: string
  required: boolean
  errors: string[]
  onClear?: () => void
  hint?: string
  children: ReactNode
}

export function FieldShell({ label, required, errors, onClear, hint, children }: Props) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-3">
      <div className="flex items-center gap-1 pt-1.5 text-sm text-zinc-600">
        <span>{label}</span>
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

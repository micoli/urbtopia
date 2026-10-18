import type { ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}

export function Fact({ label, children }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  )
}

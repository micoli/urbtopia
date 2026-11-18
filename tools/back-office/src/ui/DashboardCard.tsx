import type { ReactNode } from 'react'
import { panel } from './styles'

interface Props {
  title: string
  note?: string
  children: ReactNode
}

export function DashboardCard({ title, note, children }: Props) {
  return (
    <section className={`${panel} flex flex-col gap-2 p-3`}>
      <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
      {children}
    </section>
  )
}

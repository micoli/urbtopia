import type { ReactNode } from 'react'
import { panel } from './styles'

interface Props {
  title: string
  children: ReactNode
}

export function Section({ title, children }: Props) {
  return (
    <section className={`${panel} flex flex-col gap-3 p-4`}>
      <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
      {children}
    </section>
  )
}

import { Tooltip } from 'radix-ui'
import { useContext, type ReactNode } from 'react'
import { docOf } from '../../schema/fieldDocs'
import { FieldDocsScope } from './fieldDocsScope'

interface Props {
  name: string
  children: ReactNode
}

// Hovering a label tells what the property is and where the game uses it.
export function FieldHelp({ name, children }: Props) {
  const scopes = useContext(FieldDocsScope)
  const doc = docOf(name, scopes)
  if (!doc) return <>{children}</>

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="cursor-help decoration-zinc-300 decoration-dotted underline-offset-4 hover:underline">{children}</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" align="start" sideOffset={6} className="z-50 max-w-72 rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-snug text-zinc-100 shadow-lg ring-1 ring-zinc-700">
            <p className="font-mono text-[11px] text-zinc-400">{name}</p>
            <p className="mt-1">{doc.description}</p>
            <p className="mt-1.5 text-zinc-400">Used by: {doc.usedBy}</p>
            <Tooltip.Arrow className="fill-zinc-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

import { Popover } from 'radix-ui'
import { useProblems } from '../hooks/useProblems'
import { useDocument } from '../store/documentStore'
import { badge, button } from './styles'

export function ProblemsPopover() {
  const { all } = useProblems()
  const select = useDocument(state => state.select)

  if (!all.length) return <span className={badge('green')}>No problem</span>
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className={button('danger')}>⚠ {all.length} problem{all.length > 1 ? 's' : ''}</button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 max-h-80 w-96 overflow-auto rounded-lg bg-white p-1 shadow-lg ring-1 ring-zinc-200">
          {all.map((problem, index) => (
            <button key={index} className="flex w-full flex-col items-start rounded px-2 py-1.5 text-left hover:bg-zinc-100" onClick={() => select({ kind: problem.kind, id: problem.id })}>
              <span className="text-xs font-medium text-zinc-800">{problem.kind} · {problem.id}</span>
              <span className="text-xs text-red-700">{problem.path ? `${problem.path}: ` : ''}{problem.message}</span>
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

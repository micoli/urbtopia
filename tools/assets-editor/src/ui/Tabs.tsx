import { Tabs as RadixTabs } from 'radix-ui'
import type { ReactNode } from 'react'
import { useDocument } from '../store/documentStore'

export interface Tab {
  id: string
  label: string
  badge?: number
  content: ReactNode
  // The tab sizes its own scrolling (a table) instead of scrolling as a whole.
  fill?: boolean
}

interface Props {
  tabs: Tab[]
}

// The open tab lives in the store, hence in the URL.
export function Tabs({ tabs }: Props) {
  const stored = useDocument(state => state.tab)
  const setTab = useDocument(state => state.setTab)
  const value = tabs.some(tab => tab.id === stored) ? stored! : tabs[0]?.id
  return (
    <RadixTabs.Root value={value} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
      <RadixTabs.List className="flex shrink-0 gap-1 border-b border-zinc-200 px-4">
        {tabs.map(tab => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className="-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-2.5 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 data-[state=active]:border-indigo-600 data-[state=active]:text-zinc-900"
          >
            {tab.label}
            {tab.badge ? <span className="rounded bg-red-100 px-1 text-[10px] text-red-700">{tab.badge}</span> : null}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map(tab => (
        <RadixTabs.Content key={tab.id} value={tab.id} className={`min-h-0 flex-1 p-4 outline-none ${tab.fill ? 'flex flex-col' : 'overflow-auto'}`}>
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}

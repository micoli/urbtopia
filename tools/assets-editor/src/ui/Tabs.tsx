import { Tabs as RadixTabs } from 'radix-ui'
import type { ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  badge?: number
  content: ReactNode
}

interface Props {
  tabs: Tab[]
}

export function Tabs({ tabs }: Props) {
  return (
    <RadixTabs.Root defaultValue={tabs[0]?.id} className="flex flex-col">
      <RadixTabs.List className="flex gap-1 border-b border-zinc-200 px-4">
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
        <RadixTabs.Content key={tab.id} value={tab.id} className="p-4 outline-none">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}

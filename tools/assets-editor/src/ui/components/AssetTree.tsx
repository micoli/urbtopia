import { Accordion, ScrollArea } from 'radix-ui'
import type { Asset, Definitions } from '../../assetKeys'
import { SourceNode } from '../SourceNode'
import type { TreeSource } from '../../treeModel'

interface Props {
  sources: TreeSource[]
  expandedSources: string[]
  expandedPacks: string[]
  selected: Asset | null
  definitions: Definitions
  usedInGame: ReadonlySet<string>
  filter: string
  onFilter: (value: string) => void
  onExpandedSources: (sources: string[]) => void
  onExpandedPacks: (packs: string[]) => void
  onSelect: (asset: Asset) => void
}

export function AssetTree({ sources, expandedSources, expandedPacks, selected, definitions, usedInGame, filter, onFilter, onExpandedSources, onExpandedPacks, onSelect }: Props) {
  return (
    <div id="assets">
      <div className="tree-header">
        <input id="tree-search" type="search" placeholder="Filter assets" aria-label="Filter assets" value={filter} onChange={(event) => onFilter(event.target.value)} />
      </div>
      <ScrollArea.Root className="scroll-root">
        <ScrollArea.Viewport id="list" aria-label="Assets" className="scroll-viewport">
          {sources.length === 0 && 'No assets found'}
          <Accordion.Root type="multiple" value={expandedSources} onValueChange={onExpandedSources} role="tree">
            {sources.map((node) => (
              <SourceNode key={node.id} node={node} expandedPacks={expandedPacks} onExpandedPacks={onExpandedPacks} selected={selected} definitions={definitions} usedInGame={usedInGame} onSelect={onSelect} />
            ))}
          </Accordion.Root>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="scrollbar">
          <ScrollArea.Thumb className="scrollbar-thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  )
}

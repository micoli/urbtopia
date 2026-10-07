import { Accordion } from 'radix-ui'
import { AssetRows, type RowsContext } from './components/AssetRows'
import { PackNode } from './PackNode'
import { isFlatSource, type TreeSource } from '../treeModel'

interface Props extends RowsContext {
  node: TreeSource
  expandedPacks: string[]
  onExpandedPacks: (packs: string[]) => void
}

export function SourceNode({ node, expandedPacks, onExpandedPacks, ...context }: Props) {
  return (
    <Accordion.Item value={node.id} className="source-node">
      <Accordion.Header asChild>
        <div className="source-header">
          <Accordion.Trigger className="source-trigger">
            <span className="chevron" aria-hidden>▸</span>
            {node.label}
            <span className="count">{node.count}</span>
          </Accordion.Trigger>
        </div>
      </Accordion.Header>
      <Accordion.Content className="source-content" role="group">
        {isFlatSource(node) ? (
          <AssetRows assets={node.packs[0]!.assets} {...context} />
        ) : (
          <Accordion.Root type="multiple" value={expandedPacks} onValueChange={onExpandedPacks}>
            {node.packs.map((pack) => <PackNode key={pack.pack} node={pack} {...context} />)}
          </Accordion.Root>
        )}
      </Accordion.Content>
    </Accordion.Item>
  )
}
